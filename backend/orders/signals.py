from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order, OrderItem
from inventory.models import Inventory

@receiver(post_save, sender=OrderItem)
def reduce_inventory_on_purchase(sender, instance, created, **kwargs):
    """
    Automatically reduce inventory when an OrderItem is created (i.e., purchase happens).
    """
    if created:
        inventory = getattr(instance.product, 'inventory', None)
        if inventory:
            inventory.quantity = max(0, inventory.quantity - instance.quantity)
            inventory.save()
