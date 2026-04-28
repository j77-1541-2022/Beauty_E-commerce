from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Inventory
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Inventory)
def sync_inventory_to_product(sender, instance, **kwargs):
    """
    Keep dealer inventory aligned with the canonical Inventory record.
    Product stock fields are not used in this codebase, so we do not
    touch them here to avoid extra writes and AttributeError noise.
    """
    try:
        product = instance.product

        if not getattr(product, 'dealer', None):
            return

        try:
            from dealer.models import DealerInventory
            dealer_inv = DealerInventory.objects.filter(product=product, dealer=product.dealer).first()
            if dealer_inv and dealer_inv.stock_quantity != instance.quantity:
                dealer_inv.stock_quantity = instance.quantity
                dealer_inv.save(update_fields=['stock_quantity'])
                logger.info(f"DealerInventory sync: Product {product.id} updated to {instance.quantity}")
        except Exception as e:
            logger.warning(f"DealerInventory sync failed: {e}")
    except Exception as e:
        logger.error(f"Error syncing Inventory to Product: {e}")
