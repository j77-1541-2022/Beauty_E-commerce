from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Inventory
from analytics.views import AnalyticsViewSet

@receiver(post_save, sender=Inventory)
def trigger_analytics_on_stock_change(sender, instance, **kwargs):
    """
    Trigger analytics recalculation or flag for update when inventory changes.
    """
    # This is a placeholder for actual analytics recalculation logic
    # In production, call a Celery task or analytics service
    AnalyticsViewSet().inventory_insights(None)
