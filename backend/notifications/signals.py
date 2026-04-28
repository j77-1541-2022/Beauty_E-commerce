import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from orders.models import Order, OrderItem
from users.models import User
from dealer.models import DealerInventory, DealerStockMovement
from .models import NotificationPreference, DealerNotification
# Optional Celery tasks - fall back to sync execution if Celery not available
try:
    from .tasks import (
        async_send_order_confirmation,
        async_send_status_update,
        async_send_welcome_email,
    )
    # Check if tasks actually have .delay() method (Celery available)
    CELERY_AVAILABLE = hasattr(async_send_order_confirmation, 'delay')
except ImportError:
    CELERY_AVAILABLE = False
    async_send_order_confirmation = None
    async_send_status_update = None
    async_send_welcome_email = None

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def order_post_save(sender, instance, created, **kwargs):
    """Send emails on order creation and status change, and create dealer notifications"""
    if created:
        logger.info(f"New order created: {instance.id}")
        # Trigger async email task (will fall back to sync if Redis unavailable)
        if CELERY_AVAILABLE and async_send_order_confirmation:
            async_send_order_confirmation.delay(instance.id)
        else:
            logger.info(f"Celery not available - email would be sent for order {instance.id}")
        
        # Create dealer notifications for new orders containing dealer products
        try:
            order_items = OrderItem.objects.filter(order=instance).select_related('product__dealer')
            notified_dealers = set()
            
            for item in order_items:
                if item.product.dealer and item.product.dealer.id not in notified_dealers:
                    dealer = item.product.dealer
                    notified_dealers.add(dealer.id)
                    
                    # Count total items for this dealer in this order
                    dealer_items = order_items.filter(product__dealer=dealer)
                    total_quantity = dealer_items.aggregate(total=Sum('quantity'))['total'] or 0
                    total_value = sum(item.quantity * item.price for item in dealer_items)
                    
                    DealerNotification.objects.create(
                        dealer=dealer,
                        notification_type='new_order',
                        title=f'New Order #{instance.order_number}',
                        message=f'You have received a new order with {total_quantity} items worth KES {total_value:,.2f}.',
                        reference_id=str(instance.id)
                    )
                    logger.info(f"New order notification created for dealer {dealer.id}")
        except Exception as e:
            logger.error(f"Error creating dealer notifications: {e}")
    else:
        # Check if status changed by comparing with database
        try:
            old_order = Order.objects.get(id=instance.id)
            if old_order.status != instance.status:
                logger.info(f"Order {instance.id} status changed to {instance.status}")
                # Trigger async email task
                if CELERY_AVAILABLE and async_send_status_update:
                    async_send_status_update.delay(instance.id, instance.status)
                else:
                    logger.info(f"Celery not available - status email would be sent for order {instance.id}")
                
                # Create payment confirmation notification for dealers
                if instance.status == 'paid' or instance.payment_status == 'completed':
                    order_items = OrderItem.objects.filter(order=instance).select_related('product__dealer')
                    notified_dealers = set()
                    
                    for item in order_items:
                        if item.product.dealer and item.product.dealer.id not in notified_dealers:
                            dealer = item.product.dealer
                            notified_dealers.add(dealer.id)
                            
                            dealer_items = order_items.filter(product__dealer=dealer)
                            total_value = sum(item.quantity * item.price for item in dealer_items)
                            
                            DealerNotification.objects.create(
                                dealer=dealer,
                                notification_type='payment_confirmed',
                                title=f'Payment Confirmed - Order #{instance.order_number}',
                                message=f'Payment of KES {total_value:,.2f} has been confirmed for your products in order #{instance.order_number}.',
                                reference_id=str(instance.id)
                            )
                            logger.info(f"Payment confirmation notification created for dealer {dealer.id}")
        except Order.DoesNotExist:
            pass


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """Send welcome email to new customers and create notification preferences"""
    if created:
        NotificationPreference.objects.create(user=instance)
        logger.info(f"Notification preferences created for user {instance.id}")
        
        if instance.role == 'customer':
            logger.info(f"New customer registered: {instance.id}")
            # Trigger async email task
            if CELERY_AVAILABLE and async_send_welcome_email:
                async_send_welcome_email.delay(instance.id)
            else:
                logger.info(f"Celery not available - welcome email would be sent for user {instance.id}")


@receiver(post_save, sender=DealerStockMovement)
def check_low_stock_after_movement(sender, instance, created, **kwargs):
    """Create notification when dealer stock goes below reorder level"""
    if created and instance.movement_type in ['out', 'sale']:
        try:
            dealer_inventory = instance.dealer_inventory
            
            # Check if stock is now at or below reorder level
            if dealer_inventory.stock_quantity <= dealer_inventory.reorder_level:
                # Check if we already created a notification recently (within 24 hours)
                from django.utils import timezone
                from datetime import timedelta
                
                recent_notification = DealerNotification.objects.filter(
                    dealer=dealer_inventory.dealer,
                    notification_type='low_stock',
                    reference_id=str(dealer_inventory.product.id),
                    created_at__gte=timezone.now() - timedelta(hours=24)
                ).exists()
                
                if not recent_notification:
                    DealerNotification.objects.create(
                        dealer=dealer_inventory.dealer,
                        notification_type='low_stock',
                        title=f'Low Stock Alert: {dealer_inventory.product.name}',
                        message=f'Your product "{dealer_inventory.product.name}" is running low. Current stock: {dealer_inventory.stock_quantity}, Reorder level: {dealer_inventory.reorder_level}. Please restock soon.',
                        reference_id=str(dealer_inventory.product.id)
                    )
                    logger.info(f"Low stock notification created for dealer {dealer_inventory.dealer.id}, product {dealer_inventory.product.id}")
        except Exception as e:
            logger.error(f"Error creating low stock notification: {e}")
