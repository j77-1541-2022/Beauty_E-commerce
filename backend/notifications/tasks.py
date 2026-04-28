try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    # Create a passthrough decorator when Celery is not available
    def shared_task(func):
        return func

from .email_service import (
    send_order_confirmation,
    send_status_update,
    send_low_stock_alert,
    send_welcome_email,
    send_payment_confirmation,
)
import logging

logger = logging.getLogger(__name__)


@shared_task
def async_send_order_confirmation(order_id):
    """Async task to send order confirmation email"""
    logger.info(f"Sending order confirmation email for order {order_id}")
    result = send_order_confirmation(order_id)
    logger.info(f"Order confirmation result: {result}")
    return result


@shared_task
def async_send_status_update(order_id, new_status):
    """Async task to send order status update email"""
    logger.info(f"Sending status update email for order {order_id} -> {new_status}")
    result = send_status_update(order_id, new_status)
    logger.info(f"Status update result: {result}")
    return result


@shared_task
def daily_low_stock_check():
    """Daily Celery beat task to check for low stock and send alerts"""
    logger.info("Running daily low stock check")
    result = send_low_stock_alert()
    if result['success']:
        logger.info(f"Low stock alert sent to {result.get('recipients', 0)} admins for {result.get('products', 0)} products")
    else:
        logger.info(f"Low stock check: {result.get('reason', result.get('error', 'No alert sent'))}")
    return result


@shared_task
def async_send_welcome_email(user_id):
    """Async task to send welcome email to new customer"""
    logger.info(f"Sending welcome email to user {user_id}")
    result = send_welcome_email(user_id)
    logger.info(f"Welcome email result: {result}")
    return result


@shared_task
def async_send_payment_confirmation(payment_id):
    """Async task to send payment confirmation email"""
    logger.info(f"Sending payment confirmation email for payment {payment_id}")
    result = send_payment_confirmation(payment_id)
    logger.info(f"Payment confirmation result: {result}")
    return result
