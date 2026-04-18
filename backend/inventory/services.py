"""
Inventory Service - Section E4
Service functions for stock management with automatic movement logging.
All inventory updates go through these functions to ensure proper tracking.
"""
from django.db import transaction
from .models import Inventory, StockMovement


class InventoryService:
    """
    Service class for managing inventory operations.
    All stock changes create StockMovement records automatically.
    """

    @staticmethod
    @transaction.atomic
    def deduct_stock(product_id, quantity, order=None, user=None, notes=''):
        """
        Deduct stock from inventory for a sale/order.
        """
        try:
            inventory = Inventory.objects.select_for_update().get(product_id=product_id)
            
            if inventory.quantity < quantity:
                return False, f'Insufficient stock. Available: {inventory.quantity}, Requested: {quantity}', inventory
            
            quantity_before = inventory.quantity
            inventory.quantity -= quantity
            inventory.save()
            
            reference = f'ORDER-{order.order_number}' if order else 'SALE'
            StockMovement.objects.create(
                inventory=inventory,
                movement_type='sale',
                quantity=-quantity,
                quantity_before=quantity_before,
                quantity_after=inventory.quantity,
                reference=reference,
                notes=notes or f'Stock deducted for {reference}',
                created_by=user
            )
            
            return True, f'Successfully deducted {quantity} units', inventory
            
        except Inventory.DoesNotExist:
            return False, f'No inventory found for product {product_id}', None
        except Exception as e:
            return False, f'Error deducting stock: {str(e)}', None

    @staticmethod
    @transaction.atomic
    def restock(product_id, quantity, user=None, notes='', reference='RESTOCK'):
        """
        Add stock to inventory (restock/return).
        """
        try:
            inventory, created = Inventory.objects.select_for_update().get_or_create(
                product_id=product_id,
                defaults={'quantity': quantity, 'reorder_level': 10, 'reorder_quantity': 50}
            )
            
            quantity_before = inventory.quantity if not created else 0
            if not created:
                inventory.quantity += quantity
                inventory.save()
            
            StockMovement.objects.create(
                inventory=inventory,
                movement_type='in',
                quantity=quantity,
                quantity_before=quantity_before,
                quantity_after=inventory.quantity,
                reference=reference,
                notes=notes or f'Restock: {quantity} units added',
                created_by=user
            )
            
            action = 'created' if created else 'restocked'
            return True, f'Successfully {action} with {quantity} units', inventory
            
        except Exception as e:
            return False, f'Error restocking: {str(e)}', None

    @staticmethod
    @transaction.atomic
    def adjust_stock(product_id, new_quantity, user=None, notes=''):
        """
        Adjust stock to a specific quantity (for corrections/damage).
        """
        try:
            inventory = Inventory.objects.select_for_update().get(product_id=product_id)
            
            quantity_before = inventory.quantity
            difference = new_quantity - quantity_before
            
            inventory.quantity = new_quantity
            inventory.save()
            
            StockMovement.objects.create(
                inventory=inventory,
                movement_type='adjustment',
                quantity=difference,
                quantity_before=quantity_before,
                quantity_after=new_quantity,
                reference='ADJUSTMENT',
                notes=notes or f'Stock adjusted from {quantity_before} to {new_quantity}',
                created_by=user
            )
            
            return True, f'Stock adjusted from {quantity_before} to {new_quantity}', inventory
            
        except Inventory.DoesNotExist:
            return False, f'No inventory found for product {product_id}', None
        except Exception as e:
            return False, f'Error adjusting stock: {str(e)}', None

    @staticmethod
    @transaction.atomic
    def process_return(product_id, quantity, order=None, user=None, notes=''):
        """
        Process a return and add stock back.
        """
        try:
            inventory = Inventory.objects.select_for_update().get(product_id=product_id)
            
            quantity_before = inventory.quantity
            inventory.quantity += quantity
            inventory.save()
            
            reference = f'RETURN-ORDER-{order.order_number}' if order else 'RETURN'
            StockMovement.objects.create(
                inventory=inventory,
                movement_type='return',
                quantity=quantity,
                quantity_before=quantity_before,
                quantity_after=inventory.quantity,
                reference=reference,
                notes=notes or f'Customer return: {quantity} units',
                created_by=user
            )
            
            return True, f'Return processed: {quantity} units added back to stock', inventory
            
        except Inventory.DoesNotExist:
            return InventoryService.restock(product_id, quantity, user, notes, 'RETURN-NEW')
        except Exception as e:
            return False, f'Error processing return: {str(e)}', None

    @staticmethod
    def check_availability(product_id, quantity):
        """
        Check if sufficient stock is available without modifying inventory.
        
        Args:
            product_id: Product ID to check
            quantity: Required quantity
            
        Returns:
            tuple: (available: bool, current_stock: int)
        """
        try:
            inventory = Inventory.objects.get(product_id=product_id)
            return inventory.quantity >= quantity, inventory.quantity
        except Inventory.DoesNotExist:
            return False, 0

    @staticmethod
    def get_stock_status(product_id):
        """
        Get detailed stock status for a product.
        
        Args:
            product_id: Product ID to check
            
        Returns:
            dict: Stock status information
        """
        try:
            inventory = Inventory.objects.get(product_id=product_id)
            return {
                'product_id': product_id,
                'quantity': inventory.quantity,
                'reorder_level': inventory.reorder_level,
                'status': inventory.stock_status,
                'is_low_stock': inventory.is_low_stock,
                'last_updated': inventory.last_stock_update
            }
        except Inventory.DoesNotExist:
            return {
                'product_id': product_id,
                'quantity': 0,
                'reorder_level': 10,
                'status': 'out_of_stock',
                'is_low_stock': True,
                'last_updated': None
            }


# Convenience functions for direct import
deduct_stock = InventoryService.deduct_stock
restock = InventoryService.restock
adjust_stock = InventoryService.adjust_stock
process_return = InventoryService.process_return
check_availability = InventoryService.check_availability
get_stock_status = InventoryService.get_stock_status
