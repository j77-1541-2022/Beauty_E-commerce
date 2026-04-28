"""
Order Status State Machine - Section E
Implements state transitions with validation and atomic transactions.
"""
from django.db import transaction
from django.db.models import F, Sum
from django.utils import timezone
from typing import List, Dict, Optional


# Allowed order status transitions
# Format: current_status -> [allowed_next_statuses]
ALLOWED_TRANSITIONS = {
    'pending': ['paid', 'confirmed', 'cancelled'],
    'paid': ['approval_pending', 'approved', 'processing', 'cancelled'],
    'approval_pending': ['approved', 'cancelled'],
    'approved': ['processing', 'cancelled'],
    'confirmed': ['paid', 'processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': ['returned'],  # Can't go back, only return
    'cancelled': [],  # Terminal state
    'returned': ['pending_refund'],  # Can trigger refund
    'pending_refund': ['refunded'],
    'refunded': [],  # Terminal state
}


class OrderStatusValidator:
    """
    Validates order status transitions and manages state machine logic.
    """
    
    @classmethod
    def can_transition(cls, current_status: str, new_status: str) -> bool:
        """
        Check if a status transition is allowed.
        
        Args:
            current_status: Current order status
            new_status: Desired new status
        
        Returns:
            True if transition is allowed, False otherwise
        """
        allowed = ALLOWED_TRANSITIONS.get(current_status, [])
        return new_status in allowed
    
    @classmethod
    def validate_transition(cls, current_status: str, new_status: str) -> Optional[str]:
        """
        Validate a status transition and return error message if invalid.
        
        Args:
            current_status: Current order status
            new_status: Desired new status
        
        Returns:
            Error message if invalid, None if valid
        """
        if current_status == new_status:
            return "New status must be different from current status."
        
        if not cls.can_transition(current_status, new_status):
            allowed = ALLOWED_TRANSITIONS.get(current_status, [])
            allowed_str = ', '.join(allowed) if allowed else 'none (terminal state)'
            return f"Cannot transition from '{current_status}' to '{new_status}'. Allowed: {allowed_str}"
        
        return None
    
    @classmethod
    def get_allowed_transitions(cls, current_status: str) -> List[str]:
        """Get list of allowed next statuses from current status."""
        return ALLOWED_TRANSITIONS.get(current_status, [])
    
    @classmethod
    def is_terminal_status(cls, status: str) -> bool:
        """Check if status is terminal (no further transitions allowed)."""
        return status in ['cancelled', 'refunded', 'delivered']


class OrderStatusManager:
    """
    Manages order status changes with validation and history tracking.
    """
    
    @staticmethod
    @transaction.atomic
    def update_status(order, new_status: str, changed_by=None, notes: str = "") -> Dict:
        """
        Update order status with validation and history tracking.
        
        Args:
            order: Order instance
            new_status: New status to set
            changed_by: User who made the change
            notes: Optional notes about the change
        
        Returns:
            Dict with success flag and message
        """
        from orders.models import OrderStatusHistory
        
        current_status = order.status
        
        # Validate transition
        error = OrderStatusValidator.validate_transition(current_status, new_status)
        if error:
            return {
                'success': False,
                'error': error,
                'code': 'INVALID_STATUS_TRANSITION'
            }
        
        # Lock the order row to prevent concurrent modifications
        order = type(order).objects.select_for_update().get(pk=order.pk)
        
        old_status = order.status
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        
        # Create status history record
        history = OrderStatusHistory.objects.create(
            order=order,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            notes=notes or f'Status changed from {old_status} to {new_status}'
        )
        
        # Notify customer of status update
        try:
            from notifications.models import Notification
            status_messages = {
                'confirmed': f'Your order #{order.order_number} has been confirmed and is being prepared.',
                'processing': f'Your order #{order.order_number} is now being processed.',
                'shipped': f'Great news! Your order #{order.order_number} has been shipped and is on its way.',
                'delivered': f'Your order #{order.order_number} has been delivered. Enjoy your purchase!',
                'cancelled': f'Your order #{order.order_number} has been cancelled.',
            }
            
            if new_status in status_messages and order.created_by:
                Notification.objects.create(
                    user=order.created_by,
                    title=f'Order {new_status.title()} - #{order.order_number}',
                    message=status_messages[new_status],
                    notification_type='order_update',
                    reference_id=str(order.id)
                )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create customer notification for order {order.id}: {e}")
        
        return {
            'success': True,
            'order_id': order.id,
            'old_status': old_status,
            'new_status': new_status,
            'history_id': history.id
        }
    
    @staticmethod
    @transaction.atomic
    def cancel_order(order, cancelled_by=None, reason: str = "") -> Dict:
        """
        Cancel an order with proper validation and inventory restoration.
        
        Args:
            order: Order instance
            cancelled_by: User who cancelled
            reason: Cancellation reason
        
        Returns:
            Dict with success flag and message
        """
        from inventory.models import Inventory
        
        current_status = order.status
        
        # Validate cancellation is allowed
        if current_status in ['delivered', 'cancelled', 'refunded']:
            return {
                'success': False,
                'error': f'Cannot cancel order in {current_status} status.',
                'code': 'CANCEL_NOT_ALLOWED'
            }
        
        # Lock the order
        order = type(order).objects.select_for_update().get(pk=order.pk)
        
        # Restore inventory for each item
        for item in order.items.select_related('product').all():
            try:
                inventory = Inventory.objects.select_for_update().get(product=item.product)
                inventory.quantity = F('quantity') + item.quantity
                inventory.save()
                inventory.refresh_from_db()
            except Inventory.DoesNotExist:
                pass  # Product might not have inventory tracking
        
        # Update order status
        result = OrderStatusManager.update_status(
            order,
            'cancelled',
            changed_by=cancelled_by,
            notes=f'Order cancelled. Reason: {reason}' if reason else 'Order cancelled'
        )
        
        if result['success']:
            result['inventory_restored'] = True
        
        return result


class InventoryManager:
    """
    Manages inventory operations with atomic transactions.
    """
    
    @staticmethod
    @transaction.atomic
    def reserve_stock(product, quantity: int, order_id: str = None) -> Dict:
        """
        Reserve stock for an order.
        
        Args:
            product: Product instance
            quantity: Quantity to reserve
            order_id: Optional order reference
        
        Returns:
            Dict with success flag and available quantity
        """
        from inventory.models import Inventory, StockMovement
        
        try:
            inventory = Inventory.objects.select_for_update().get(product=product)
            
            if inventory.quantity < quantity:
                return {
                    'success': False,
                    'error': 'Insufficient stock',
                    'available': inventory.quantity,
                    'requested': quantity
                }
            
            # Decrease stock
            quantity_before = inventory.quantity
            inventory.quantity = F('quantity') - quantity
            inventory.save()
            inventory.refresh_from_db()
            
            # Record stock movement
            StockMovement.objects.create(
                inventory=inventory,
                movement_type='sale',
                quantity=-quantity,
                quantity_before=quantity_before,
                quantity_after=inventory.quantity,
                reference=f'ORDER_RESERVE:{order_id}' if order_id else 'ORDER_RESERVE',
                notes=f'Stock reserved for order {order_id}' if order_id else 'Stock reserved'
            )
            
            return {
                'success': True,
                'remaining_stock': inventory.quantity
            }
            
        except Inventory.DoesNotExist:
            return {
                'success': False,
                'error': 'Product not found in inventory',
                'code': 'INVENTORY_NOT_FOUND'
            }
    
    @staticmethod
    @transaction.atomic
    def release_stock(product, quantity: int, order_id: str = None) -> Dict:
        """
        Release reserved stock back to inventory (e.g., order cancelled).
        
        Args:
            product: Product instance
            quantity: Quantity to release
            order_id: Optional order reference
        
        Returns:
            Dict with success flag
        """
        from inventory.models import Inventory, StockMovement
        
        try:
            inventory = Inventory.objects.select_for_update().get(product=product)
            
            # Increase stock
            quantity_before = inventory.quantity
            inventory.quantity = F('quantity') + quantity
            inventory.save()
            inventory.refresh_from_db()
            
            # Record stock movement
            StockMovement.objects.create(
                inventory=inventory,
                movement_type='return',
                quantity=quantity,
                quantity_before=quantity_before,
                quantity_after=inventory.quantity,
                reference=f'ORDER_CANCEL:{order_id}' if order_id else 'ORDER_CANCEL',
                notes=f'Stock released from cancelled order {order_id}' if order_id else 'Stock released'
            )
            
            return {
                'success': True,
                'new_stock': inventory.quantity
            }
            
        except Inventory.DoesNotExist:
            return {
                'success': False,
                'error': 'Product not found in inventory',
                'code': 'INVENTORY_NOT_FOUND'
            }


def get_order_summary(order) -> Dict:
    """
    Get comprehensive order summary with item details.
    
    Args:
        order: Order instance
    
    Returns:
        Dict with order summary
    """
    items_summary = []
    for item in order.items.select_related('product').all():
        items_summary.append({
            'product_id': item.product.id,
            'product_name': item.product.name,
            'quantity': item.quantity,
            'unit_price': float(item.unit_price),
            'total': float(item.total_price)
        })
    
    return {
        'order_id': order.id,
        'order_number': order.order_number,
        'status': order.status,
        'customer': {
            'name': order.customer_name,
            'email': order.customer_email,
            'phone': order.customer_phone
        },
        'items': items_summary,
        'totals': {
            'subtotal': float(order.subtotal) if order.subtotal else 0,
            'tax': float(order.tax_amount) if order.tax_amount else 0,
            'shipping': float(order.shipping_cost) if order.shipping_cost else 0,
            'total': float(order.total_amount)
        },
        'shipping_address': order.shipping_address,
        'created_at': order.created_at.isoformat() if order.created_at else None,
        'updated_at': order.updated_at.isoformat() if order.updated_at else None
    }
