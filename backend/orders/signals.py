from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from .models import Order, OrderItem, OrderStatusHistory
from inventory.models import Inventory, StockMovement
import logging

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Order)
def cache_previous_order_status(sender, instance, **kwargs):
    """Cache previous status so post_save can detect real status transitions."""
    if not instance.pk:
        instance._previous_status = None
        return
    try:
        previous = Order.objects.only('status').get(pk=instance.pk)
        instance._previous_status = previous.status
    except Order.DoesNotExist:
        instance._previous_status = None

@receiver(post_save, sender=OrderItem)
def reduce_inventory_on_purchase(sender, instance, created, **kwargs):
    """
    Reduce inventory and sync Product.stock_quantity when OrderItem created.
    Creates audit trail via StockMovement.
    Option B: Keep both Inventory and Product stock in sync.
    """
    if created:
        try:
            with transaction.atomic():
                # Get inventory
                inventory = Inventory.objects.select_for_update().get(product=instance.product)
                quantity_before = inventory.quantity
                
                # Reduce inventory
                inventory.quantity = max(0, inventory.quantity - instance.quantity)
                inventory.save(update_fields=['quantity'])
                
                # Create audit trail
                StockMovement.objects.create(
                    inventory=inventory,
                    movement_type='sale',
                    quantity=-instance.quantity,
                    quantity_before=quantity_before,
                    quantity_after=inventory.quantity,
                    reference=f"Order {instance.order.order_number}",
                    created_by=instance.order.created_by,
                )
                
                # SYNC: Inventory is main source of truth, no Product stock fields to update
                product = instance.product
                
                # Sync DealerInventory if dealer product
                if product.dealer:
                    try:
                        from dealer.models import DealerInventory
                        dealer_inv = DealerInventory.objects.get(product=product, dealer=product.dealer)
                        dealer_inv.stock_quantity = max(0, dealer_inv.stock_quantity - instance.quantity)
                        dealer_inv.save(update_fields=['stock_quantity'])
                    except Exception as e:
                        logger.warning(f"Could not sync DealerInventory: {e}")
                
                logger.info(f"Inventory synced for product {product.id}: {instance.quantity} units for order {instance.order.order_number}")
        except Inventory.DoesNotExist:
            logger.warning(f"Inventory record not found for product {instance.product.id}")
        except Exception as e:
            logger.error(f"Error reducing inventory for product {instance.product.id}: {str(e)}", exc_info=True)

@receiver(post_save, sender=Order)
def create_initial_status_history(sender, instance, created, **kwargs):
    """
    Create initial status history when an order is created.
    """
    if created:
        try:
            OrderStatusHistory.objects.create(
                order=instance,
                old_status='',
                new_status=instance.status,
                notes='Order created',
                changed_by=instance.created_by,
            )
            logger.info(f"Initial status history created for order {instance.order_number}")
        except Exception as e:
            logger.error(f"Error creating status history for order {instance.id}: {str(e)}", exc_info=True)


@receiver(post_save, sender=Order)
def update_dealer_earnings_on_completion(sender, instance, created, **kwargs):
    """
    Update dealer pending_payout when order is marked as completed/delivered.
    This adds the dealer's commission earnings to their pending payout.
    """
    if not created:  # Only on update (status change)
        try:
            previous_status = getattr(instance, '_previous_status', None)

            # Only process the transition into delivered once.
            if instance.status == 'delivered' and previous_status != 'delivered':
                with transaction.atomic():
                    # Get all order items for this order
                    order_items = instance.items.select_related('product').all()
                    
                    for item in order_items:
                        product = item.product
                        if product and product.dealer:
                            try:
                                # product.dealer already points to DealerProfile.
                                dealer_profile = type(product.dealer).objects.select_for_update().get(
                                    pk=product.dealer.pk
                                )
                                
                                # Calculate dealer earnings (after commission)
                                commission_rate = dealer_profile.commission_rate / 100
                                dealer_earning = item.quantity * item.unit_price * (1 - commission_rate)
                                
                                # Add to pending payout
                                dealer_profile.pending_payout += dealer_earning
                                dealer_profile.save(update_fields=['pending_payout'])
                                
                                logger.info(
                                    f"Added KSh {dealer_earning:.2f} to dealer {dealer_profile.business_name} "
                                    f"pending payout for order {instance.order_number}"
                                )
                            except type(product.dealer).DoesNotExist:
                                logger.warning(f"Dealer profile not found for product {product.id}")
                            except Exception as e:
                                logger.error(f"Error updating dealer earnings: {e}")
                                
        except Exception as e:
            logger.error(f"Error in update_dealer_earnings_on_completion: {e}", exc_info=True)
