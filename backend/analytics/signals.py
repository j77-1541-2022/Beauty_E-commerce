from django.dispatch import receiver
from django.db.models.signals import post_save
from analytics.models import InventoryInsight

@receiver(post_save, sender=InventoryInsight)
def update_forecast_and_dss(sender, instance, **kwargs):
    """
    After analytics update, trigger forecast and DSS update.
    """
    # Placeholder: In production, call Celery task or DSS service
    # e.g., DSSService.update_recommendations()
    pass
