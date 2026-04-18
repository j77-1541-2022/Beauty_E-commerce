from celery import shared_task
from .email_service import send_low_stock_alert
import logging

logger = logging.getLogger(__name__)


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
