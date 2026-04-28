import logging
from django.db import models
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from orders.models import Order, OrderItem
from products.models import Product
from users.models import User
from inventory.models import Inventory

logger = logging.getLogger(__name__)


def send_order_confirmation(order_id):
    """Send order confirmation email to customer"""
    try:
        order = Order.objects.select_related('created_by').prefetch_related('items__product').get(id=order_id)
        customer_user = order.created_by
        
        # Check customer preference
        if customer_user and hasattr(customer_user, 'notification_preference') and not customer_user.notification_preference.order_updates:
            logger.info(f"Order confirmation email skipped - user preference disabled for order {order_id}")
            return {'success': False, 'reason': 'user_preference_disabled'}
        
        items = [{
            'name': item.product.name,
            'quantity': item.quantity,
            'price': f"{item.unit_price:,.2f}"
        } for item in order.items.all()]
        
        context = {
            'order_number': order.order_number or str(order.id)[:8].upper(),
            'order_id': str(order.id),
            'order_date': order.created_at.strftime('%B %d, %Y'),
            'items': items,
            'total': f"{order.total_amount:,.2f}",
            'delivery_address': order.shipping_address,
            'frontend_url': settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
        }
        
        html_message = render_to_string('emails/order_confirmation.html', context)
        
        send_mail(
            subject=f'Order Confirmation - #{context["order_number"]}',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer_email],
            html_message=html_message,
            fail_silently=True
        )
        
        logger.info(f"Order confirmation email sent to {order.customer_email} for order {order_id}")
        return {'success': True}
        
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for confirmation email")
        return {'success': False, 'error': 'Order not found'}
    except Exception as e:
        logger.error(f"Failed to send order confirmation email: {str(e)}")
        return {'success': False, 'error': str(e)}


def send_status_update(order_id, new_status):
    """Send order status update email to customer"""
    try:
        order = Order.objects.select_related('created_by').get(id=order_id)
        customer_user = order.created_by
        
        # Check customer preference
        if customer_user and hasattr(customer_user, 'notification_preference') and not customer_user.notification_preference.order_updates:
            logger.info(f"Status update email skipped - user preference disabled for order {order_id}")
            return {'success': False, 'reason': 'user_preference_disabled'}
        
        status_config = {
            'confirmed': {'icon': '✅', 'class': '', 'progress': 10},
            'processing': {'icon': '📦', 'class': 'processing', 'progress': 35},
            'shipped': {'icon': '🚚', 'class': 'shipped', 'progress': 65},
            'delivered': {'icon': '🎉', 'class': 'delivered', 'progress': 100}
        }
        
        config = status_config.get(new_status.lower(), {'icon': '📋', 'class': '', 'progress': 0})
        
        context = {
            'order_number': order.order_number or str(order.id)[:8].upper(),
            'order_id': str(order.id),
            'status': new_status.title(),
            'status_icon': config['icon'],
            'status_class': config['class'],
            'progress_width': config['progress'],
            'estimated_delivery': order.estimated_delivery.strftime('%B %d, %Y') if hasattr(order, 'estimated_delivery') and order.estimated_delivery else None,
            'frontend_url': settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
        }
        
        html_message = render_to_string('emails/order_status_update.html', context)
        
        send_mail(
            subject=f'Order Update - {new_status.title()} - #{context["order_number"]}',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer_email],
            html_message=html_message,
            fail_silently=True
        )
        
        logger.info(f"Status update email sent to {order.customer_email} for order {order_id}")
        return {'success': True}
        
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for status update email")
        return {'success': False, 'error': 'Order not found'}
    except Exception as e:
        logger.error(f"Failed to send status update email: {str(e)}")
        return {'success': False, 'error': str(e)}


def send_low_stock_alert(product_ids=None):
    """Send low stock alert to all admin users"""
    try:
        # Get products with low stock
        if product_ids:
            low_stock_items = Inventory.objects.filter(
                product_id__in=product_ids,
                quantity__lte=models.F('reorder_level')
            ).select_related('product')
        else:
            low_stock_items = Inventory.objects.filter(
                quantity__lte=models.F('reorder_level')
            ).select_related('product')
        
        if not low_stock_items.exists():
            logger.info("No low stock items found, skipping alert")
            return {'success': False, 'reason': 'no_low_stock'}
        
        # Get admin emails who want low stock alerts
        admin_users = User.objects.filter(
            role__in=['admin', 'manager'],
            notification_preference__low_stock_alerts=True,
            is_active=True
        ).values_list('email', flat=True)
        
        if not admin_users:
            admin_users = User.objects.filter(
                role__in=['admin', 'manager'],
                is_active=True
            ).values_list('email', flat=True)
        
        admin_emails = list(admin_users)
        if not admin_emails:
            logger.warning("No admin emails found for low stock alert")
            return {'success': False, 'error': 'No admin recipients'}
        
        products = [{
            'name': item.product.name,
            'sku': getattr(item.product, 'sku', 'N/A'),
            'current_stock': item.quantity,
            'reorder_level': item.reorder_level,
            'recommended_order': max(item.reorder_level * 2 - item.quantity, 10)
        } for item in low_stock_items]
        
        context = {
            'products': products,
            'generated_at': timezone.now().strftime('%B %d, %Y at %H:%M'),
            'admin_url': settings.ADMIN_URL if hasattr(settings, 'ADMIN_URL') else 'http://localhost:8000/admin'
        }
        
        html_message = render_to_string('emails/low_stock_alert.html', context)
        
        send_mail(
            subject='🚨 Low Stock Alert - Action Required',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,
            html_message=html_message,
            fail_silently=True
        )
        
        logger.info(f"Low stock alert sent to {len(admin_emails)} admins for {len(products)} products")
        return {'success': True, 'recipients': len(admin_emails), 'products': len(products)}
        
    except Exception as e:
        logger.error(f"Failed to send low stock alert: {str(e)}")
        return {'success': False, 'error': str(e)}


def send_welcome_email(user_id):
    """Send welcome email to new customer"""
    try:
        user = User.objects.get(id=user_id, role='customer')
        
        # Check customer preference
        if hasattr(user, 'notification_preference') and not user.notification_preference.promotions:
            logger.info(f"Welcome email skipped - user preference disabled for user {user_id}")
            return {'success': False, 'reason': 'user_preference_disabled'}
        
        context = {
            'first_name': user.first_name or user.username or 'Beauty Lover',
            'frontend_url': settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
        }
        
        html_message = render_to_string('emails/welcome_email.html', context)
        
        send_mail(
            subject='✨ Welcome to Glow Beyond Beauty!',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True
        )
        
        logger.info(f"Welcome email sent to {user.email}")
        return {'success': True}
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for welcome email")
        return {'success': False, 'error': 'User not found'}
    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")
        return {'success': False, 'error': str(e)}

def send_payment_confirmation(payment_id):
    """Send payment confirmation email to customer"""
    try:
        from payments.models import Payment
        
        payment = Payment.objects.select_related('order', 'order__created_by').get(id=payment_id)
        order = payment.order
        customer_user = order.created_by
        
        # Check customer preference
        if customer_user and hasattr(customer_user, 'notification_preference') and not customer_user.notification_preference.order_updates:
            logger.info(f"Payment confirmation email skipped - user preference disabled for payment {payment_id}")
            return {'success': False, 'reason': 'user_preference_disabled'}
        
        context = {
            'order_number': order.order_number or str(order.id)[:8].upper(),
            'payment_method': payment.payment_method,
            'amount': f"{payment.amount:,.2f}",
            'transaction_id': getattr(payment, 'transaction_id', 'N/A'),
            'payment_date': payment.created_at.strftime('%B %d, %Y at %H:%M'),
            'order_id': str(order.id),
            'frontend_url': settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'
        }
        
        html_message = render_to_string('emails/payment_confirmation.html', context)
        
        send_mail(
            subject=f'Payment Confirmed - Order #{context["order_number"]}',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer_email],
            html_message=html_message,
            fail_silently=True
        )
        
        logger.info(f"Payment confirmation email sent to {order.customer_email} for payment {payment_id}")
        return {'success': True}
        
    except Exception as e:
        logger.error(f"Failed to send payment confirmation email: {str(e)}")
        return {'success': False, 'error': str(e)}