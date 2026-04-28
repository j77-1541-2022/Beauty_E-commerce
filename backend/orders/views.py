from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

from utils.permissions import IsAdminUser, IsCustomerUser, IsOwnerOrAdmin
from utils.api_response import APIResponseMixin

from .models import Order, OrderItem, OrderStatusHistory
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusHistorySerializer
from .receipt_service import get_receipt_response
from .services import OrderStatusManager, InventoryManager, get_order_summary
from .utils import calculate_shipping_cost

class OrderViewSet(viewsets.ModelViewSet, APIResponseMixin):
    queryset = Order.objects.prefetch_related('items', 'status_history')
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'created_by']
    search_fields = ['order_number', 'customer_name', 'customer_email']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    def create(self, request, *args, **kwargs):
        """Override create to wrap response properly"""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return self.error_response(
                message='Order validation failed',
                code='VALIDATION_ERROR',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            self.perform_create(serializer)
        except serializers.ValidationError as exc:
            detail = exc.detail if hasattr(exc, 'detail') else {'detail': [str(exc)]}
            errors = detail if isinstance(detail, dict) else {'detail': detail}
            return self.error_response(
                message='Order validation failed',
                code='VALIDATION_ERROR',
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        order = serializer.instance
        response_serializer = OrderSerializer(order, context=self.get_serializer_context())

        return self.success_response(
            data=response_serializer.data,
            message='Order created successfully',
            status_code=status.HTTP_201_CREATED
        )
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Order.objects.all()
        return Order.objects.filter(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_from_cart(self, request):
        from cart.models import Cart, CartItem
        from inventory.models import Inventory

        user = request.user

        with transaction.atomic():
            # Get user's cart with lock to prevent concurrent modifications
            try:
                cart = Cart.objects.select_for_update().get(user=user)
            except Cart.DoesNotExist:
                return self.error_response(
                    message='Cart not found',
                    code='NOT_FOUND',
                    status_code=404
                )

            cart_items = cart.items.select_related('product').all()
            if not cart_items.exists():
                return self.error_response(
                    message='Cart is empty',
                    code='VALIDATION_ERROR',
                    status_code=400
                )

            # Validate stock availability before creating order
            for cart_item in cart_items:
                try:
                    inventory = Inventory.objects.select_for_update().get(product=cart_item.product)
                    if inventory.quantity < cart_item.quantity:
                        return self.error_response(
                            message=f'Insufficient stock for {cart_item.product.name}. Available: {inventory.quantity}',
                            code='INSUFFICIENT_STOCK',
                            errors={'cart': [f'Insufficient stock for {cart_item.product.name}']},
                            status_code=400
                        )
                except Inventory.DoesNotExist:
                    return self.error_response(
                        message=f'Product {cart_item.product.name} not available in inventory',
                        code='INVENTORY_NOT_FOUND',
                        status_code=400
                    )

            shipping_address = ''
            if hasattr(user, 'profile') and getattr(user.profile, 'address', None):
                shipping_address = user.profile.address

            # Calculate totals
            subtotal = Decimal(cart.get_total())
            tax_amount = Decimal('0.00')
            shipping_cost = calculate_shipping_cost(address=shipping_address, city='')
            total_amount = subtotal + tax_amount + shipping_cost

            # Generate order number
            import uuid
            order_number = f"ORD{uuid.uuid4().hex[:8].upper()}"

            # Reserve inventory for each item
            reserved_items = []
            try:
                for cart_item in cart_items:
                    result = InventoryManager.reserve_stock(
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        order_id=order_number
                    )
                    if not result['success']:
                        raise Exception(f"Stock reservation failed: {result.get('error')}")
                    reserved_items.append(cart_item)
            except Exception as e:
                # Rollback will happen automatically due to transaction.atomic()
                return self.error_response(
                    message='Failed to reserve stock. Please try again.',
                    code='STOCK_RESERVATION_FAILED',
                    status_code=500
                )

            # Create order
            order = Order.objects.create(
                order_number=order_number,
                customer_name=user.get_full_name() or user.username,
                customer_email=user.email,
                customer_phone=getattr(user, 'phone', ''),
                shipping_address=shipping_address or 'Default Address',
                subtotal=subtotal,
                tax_amount=tax_amount,
                shipping_cost=shipping_cost,
                total_amount=total_amount,
                created_by=user,
                status='pending'
            )

            # Create order items
            for cart_item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product.selling_price,
                    total_price=cart_item.total_price
                )

            # Award loyalty points
            points_earned = int(total_amount // Decimal('10'))
            user.loyalty_points += points_earned
            user.save(update_fields=['loyalty_points'])

            # Clear cart
            cart_items.delete()

        serializer = OrderSerializer(order)
        return self.success_response(
            data={
                'order': serializer.data,
                'loyalty_points_earned': points_earned
            },
            message='Order placed successfully!',
            status_code=201
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Allow customers to remove old completed/cancelled orders from history."""
        order = self.get_object()

        if request.user.role != 'admin' and order.created_by_id != request.user.id:
            return self.error_response(
                message='You do not have permission to delete this order',
                code='PERMISSION_DENIED',
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # Keep active lifecycle orders from being deleted mid-fulfillment.
        if request.user.role != 'admin' and order.status not in ['delivered', 'cancelled', 'refunded']:
            return self.error_response(
                message='Only delivered or cancelled orders can be deleted from history.',
                code='INVALID_ORDER_STATE',
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        order_id = order.id
        order_number = order.order_number
        self.perform_destroy(order)

        return self.success_response(
            data={'order_id': order_id, 'order_number': order_number},
            message='Order deleted successfully',
            status_code=status.HTTP_200_OK,
        )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if not new_status:
            return self.error_response(
                message='New status is required',
                code='VALIDATION_ERROR',
                status_code=400
            )
        
        result = OrderStatusManager.update_status(
            order=order,
            new_status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        if result['success']:
            return self.success_response(
                data=result,
                message=f'Order status updated to {new_status}'
            )
        
        return self.error_response(
            message=result.get('error', 'Failed to update status'),
            code=result.get('code', 'STATUS_UPDATE_FAILED'),
            status_code=400
        )
    
    @action(detail=True, methods=['post'])
    def confirm_order(self, request, pk=None):
        order = self.get_object()
        
        if order.status != 'pending':
            return self.error_response(
                message='Only pending orders can be confirmed',
                code='INVALID_ORDER_STATE',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            for item in order.items.all():
                inventory = item.product.inventory
                if inventory.quantity < item.quantity:
                    return self.error_response(
                        message=f'Insufficient stock for {item.product.name}. Available: {inventory.quantity}',
                        code='INSUFFICIENT_STOCK',
                        status_code=status.HTTP_400_BAD_REQUEST
                    )
                
                inventory.quantity -= item.quantity
                inventory.save()
                
                from inventory.models import StockMovement
                StockMovement.objects.create(
                    inventory=inventory,
                    movement_type='out',
                    quantity=item.quantity,
                    reference=order.order_number,
                    notes=f"Order fulfillment - {order.customer_name}",
                    created_by=request.user
                )
            
            order.status = 'confirmed'
            order.save()
            
            OrderStatusHistory.objects.create(
                order=order,
                old_status='pending',
                new_status='confirmed',
                notes='Order confirmed and stock deducted',
                changed_by=request.user
            )
        
        return self.success_response(
            message='Order confirmed and stock updated',
            data={'order_id': order.id, 'status': order.status}
        )
    
    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """Download PDF receipt for an order"""
        order = self.get_object()
        return get_receipt_response(order)

    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        from cart.models import Cart, CartItem

        past_order = self.get_object()
        if past_order.status != 'delivered':
            return self.error_response(
                message='Only delivered orders can be reordered',
                code='INVALID_ORDER_STATE',
                status_code=400,
            )

        cart, _ = Cart.objects.get_or_create(user=request.user)
        for item in past_order.items.select_related('product').all():
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=item.product,
                defaults={'quantity': item.quantity},
            )
            if not created:
                cart_item.quantity += item.quantity
                cart_item.save(update_fields=['quantity'])

        return self.success_response(
            data={'order_id': past_order.id, 'cart_items': cart.get_total_items()},
            message='Items added to cart successfully',
        )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        orders = self.get_queryset()
        stats = {
            'total_orders': orders.count(),
            'pending_orders': orders.filter(status='pending').count(),
            'confirmed_orders': orders.filter(status='confirmed').count(),
            'shipped_orders': orders.filter(status='shipped').count(),
            'delivered_orders': orders.filter(status='delivered').count(),
            'cancelled_orders': orders.filter(status='cancelled').count(),
            'total_revenue': orders.filter(status='delivered').aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        }
        return self.success_response(data=stats, message='Order statistics fetched')

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Get order status timeline with full history"""
        from datetime import timedelta
        
        order = self.get_object()
        status_history = order.status_history.all().order_by('changed_at')
        
        # Calculate estimated delivery date (add 3 days if shipped)
        estimated_delivery = None
        if order.status == 'shipped' and status_history.exists():
            shipped_entry = status_history.filter(new_status='shipped').last()
            if shipped_entry:
                estimated_delivery = (shipped_entry.changed_at + timedelta(days=3)).date()
        
        serializer = OrderStatusHistorySerializer(status_history, many=True)
        
        return self.success_response(
            data={
                'order_id': order.id,
                'order_number': order.order_number,
                'current_status': order.status,
                'timeline': serializer.data,
                'estimated_delivery': estimated_delivery,
                'created_at': order.created_at
            },
            message='Order timeline fetched'
        )
