from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Product
from inventory.models import Inventory, StockMovement
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Product)
def product_updated(sender, instance, created, **kwargs):
    """Send WebSocket update when product is created or updated"""
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not available - WebSocket updates disabled")
            return
        
        # Prepare product data
        product_data = {
            'id': instance.id,
            'name': instance.name,
            'sku': instance.sku,
            'description': instance.description,
            'price': float(instance.selling_price),
            'is_active': instance.is_active,
            'category': {
                'id': instance.category.id,
                'name': instance.category.name
            } if instance.category else None,
            'brand': {
                'id': instance.brand.id,
                'name': instance.brand.name
            } if instance.brand else None,
            'created_at': instance.created_at.isoformat(),
            'updated_at': instance.updated_at.isoformat()
        }
        
        # Get inventory info
        try:
            inventory = Inventory.objects.get(product=instance)
            product_data.update({
                'stock_quantity': inventory.quantity,
                'stock_status': 'in_stock' if inventory.quantity > 0 else 'out_of_stock'
            })
        except Inventory.DoesNotExist:
            product_data.update({
                'stock_quantity': 0,
                'stock_status': 'out_of_stock'
            })
        
        # Send update to product group
        async_to_sync(channel_layer.group_send)(
            'product_updates',
            {
                'type': 'product_update',
                'action': 'created' if created else 'updated',
                'product': product_data,
                'timestamp': timezone.now().isoformat()
            }
        )
        
        # If product is out of stock, send stock update
        if product_data['stock_quantity'] <= 0:
            async_to_sync(channel_layer.group_send)(
                'inventory_updates',
                {
                    'type': 'stock_update',
                    'product_id': instance.id,
                    'quantity': 0,
                    'stock_status': 'out_of_stock',
                    'timestamp': timezone.now().isoformat()
                }
            )
            
    except Exception as e:
        logger.error(f"Failed to send WebSocket update for product {instance.id}: {e}")
        # Don't raise the exception - admin functionality should continue without WebSocket

@receiver(post_delete, sender=Product)
def product_deleted(sender, instance, **kwargs):
    """Send WebSocket update when product is deleted"""
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not available - WebSocket updates disabled")
            return
        
        # Send update to product group
        async_to_sync(channel_layer.group_send)(
            'product_updates',
            {
                'type': 'product_update',
                'action': 'deleted',
                'product_id': instance.id,
                'timestamp': timezone.now().isoformat()
            }
        )
            
    except Exception as e:
        logger.error(f"Failed to send WebSocket delete update for product {instance.id}: {e}")
        # Don't raise the exception - admin functionality should continue without WebSocket

@receiver(post_save, sender=Inventory)
def inventory_updated(sender, instance, created, **kwargs):
    """Send WebSocket update when inventory is updated"""
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not available - WebSocket updates disabled")
            return
        
        # Get old quantity if updating
        old_quantity = 0
        if not created:
            try:
                old_instance = sender.objects.get(pk=instance.pk)
                old_quantity = old_instance.quantity
            except sender.DoesNotExist:
                old_quantity = 0
        
        # Determine stock status
        if instance.quantity <= 0:
            stock_status = 'out_of_stock'
        elif instance.quantity <= instance.reorder_level:
            stock_status = 'low_stock'
        else:
            stock_status = 'in_stock'
        
        # Send inventory update
        async_to_sync(channel_layer.group_send)(
            'inventory_updates',
            {
                'type': 'inventory_update',
                'product_id': instance.product.id,
                'quantity': instance.quantity,
                'old_quantity': old_quantity,
                'timestamp': timezone.now().isoformat()
            }
        )
        
        # Send stock update
        async_to_sync(channel_layer.group_send)(
            'inventory_updates',
            {
                'type': 'stock_update',
                'product_id': instance.product.id,
                'quantity': instance.quantity,
                'stock_status': stock_status,
                'timestamp': timezone.now().isoformat()
            }
        )
        
        # Send to specific product group
        product_group = f'product_{instance.product.id}'
        async_to_sync(channel_layer.group_send)(
            product_group,
            {
                'type': 'stock_update',
                'product_id': instance.product.id,
                'quantity': instance.quantity,
                'stock_status': stock_status,
                'timestamp': timezone.now().isoformat()
            }
        )
            
    except Exception as e:
        logger.error(f"Failed to send WebSocket inventory update for product {instance.product.id}: {e}")
        # Don't raise the exception - admin functionality should continue without WebSocket

@receiver(post_save, sender=StockMovement)
def stock_movement_created(sender, instance, created, **kwargs):
    """Send WebSocket update when stock movement is recorded"""
    try:
        if created:
            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning("Channel layer not available - WebSocket updates disabled")
                return
            
            # Get current inventory
            try:
                inventory = instance.inventory
                stock_status = 'in_stock' if inventory.quantity > 0 else 'out_of_stock'
                
                # Send stock update
                async_to_sync(channel_layer.group_send)(
                    'inventory_updates',
                    {
                        'type': 'stock_update',
                        'product_id': inventory.product.id,
                        'quantity': inventory.quantity,
                        'stock_status': stock_status,
                        'movement_type': instance.movement_type,
                        'movement_quantity': instance.quantity,
                        'timestamp': timezone.now().isoformat()
                    }
                )
                
            except Inventory.DoesNotExist:
                pass
                
    except Exception as e:
        logger.error(f"Failed to send WebSocket stock movement update: {e}")
        # Don't raise the exception - admin functionality should continue without WebSocket
