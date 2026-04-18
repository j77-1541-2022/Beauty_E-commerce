# ================= SECTION C2: MANUAL STOCK ADJUSTMENT ENDPOINT =================
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class ManualStockAdjustmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Allows dealer/admin to manually adjust stock.
        Records in InventoryTransaction with type='adjustment'
        """
        from inventory.models import InventoryTransaction
        from products.models import Product
        from django.db import transaction as db_transaction

        product_id = request.data.get('product_id')
        adjustment_qty = int(request.data.get('quantity_change', 0))
        notes = request.data.get('notes', 'Manual adjustment')
        adjustment_type = request.data.get('type', 'adjustment')

        if not product_id:
            return Response({'success': False, 'error': {'message': 'product_id required'}}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Product not found'}}, status=404)

        with db_transaction.atomic():
            try:
                inv_item = product.inventoryitem
                previous_stock = inv_item.quantity
                new_stock = max(0, previous_stock + adjustment_qty)
                inv_item.quantity = new_stock
                inv_item.save()
            except:
                previous_stock = getattr(product, 'stock_quantity', getattr(product, 'current_stock', 0))
                new_stock = max(0, previous_stock + adjustment_qty)
                if hasattr(product, 'stock_quantity'):
                    product.stock_quantity = new_stock
                elif hasattr(product, 'current_stock'):
                    product.current_stock = new_stock
                product.save()
            InventoryTransaction.objects.create(
                product=product,
                transaction_type=adjustment_type,
                quantity_change=adjustment_qty,
                previous_stock=previous_stock,
                new_stock=new_stock,
                notes=notes,
            )
        return Response({
            'success': True,
            'data': {
                'product_name': product.name,
                'previous_stock': previous_stock,
                'adjustment': adjustment_qty,
                'new_stock': new_stock,
                'message': f'Stock adjusted successfully. {product.name}: {previous_stock} → {new_stock}'
            }
        })
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F
from django.utils import timezone

from utils.permissions import IsAdminUser, IsDealerUser, IsVerifiedDealer, ReadOnly
from utils.api_response import APIResponseMixin

from .models import Supplier, Inventory, StockMovement, StockAlert
from .serializers import SupplierSerializer, InventorySerializer, StockMovementSerializer, StockAlertSerializer

class SupplierViewSet(viewsets.ModelViewSet, APIResponseMixin):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminUser | IsVerifiedDealer | ReadOnly]
    search_fields = ['name', 'contact_person', 'email']
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Supplier.objects.all()
        return Supplier.objects.filter(is_active=True)

class InventoryViewSet(viewsets.ModelViewSet, APIResponseMixin):
    queryset = Inventory.objects.select_related('product', 'supplier').prefetch_related('movements')
    serializer_class = InventorySerializer
    permission_classes = [IsAdminUser | IsVerifiedDealer]
    filterset_fields = ['supplier']
    search_fields = ['product__name', 'product__sku', 'supplier__name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        stock_status = self.request.query_params.get('stock_status', None)
        
        if stock_status == 'low_stock':
            queryset = queryset.filter(quantity__lte=F('reorder_level'))
        elif stock_status == 'out_of_stock':
            queryset = queryset.filter(quantity=0)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def stock_in(self, request, pk=None):
        inventory = self.get_object()
        quantity = int(request.data.get('quantity', 0))
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')
        
        if quantity <= 0:
            return Response({'error': 'Quantity must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        
        inventory.quantity += quantity
        inventory.save()
        
        StockMovement.objects.create(
            inventory=inventory,
            movement_type='in',
            quantity=quantity,
            reference=reference,
            notes=notes,
            created_by=request.user
        )
        
        return Response({'message': f'Stock added successfully. New quantity: {inventory.quantity}'})
    
    @action(detail=True, methods=['post'])
    def stock_out(self, request, pk=None):
        inventory = self.get_object()
        quantity = int(request.data.get('quantity', 0))
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')
        
        if quantity <= 0:
            return Response({'error': 'Quantity must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        
        if inventory.quantity < quantity:
            return Response({'error': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)
        
        inventory.quantity -= quantity
        inventory.save()
        
        StockMovement.objects.create(
            inventory=inventory,
            movement_type='out',
            quantity=quantity,
            reference=reference,
            notes=notes,
            created_by=request.user
        )
        
        return Response({'message': f'Stock removed successfully. New quantity: {inventory.quantity}'})
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        low_stock_items = self.get_queryset().filter(quantity__lte=F('reorder_level'))
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        out_of_stock_items = self.get_queryset().filter(quantity=0)
        serializer = self.get_serializer(out_of_stock_items, many=True)
        return Response(serializer.data)

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('inventory', 'created_by', 'inventory__product')
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['movement_type', 'inventory']
    search_fields = ['reference', 'notes', 'inventory__product__name']
    ordering = ['-created_at']

class StockAlertViewSet(viewsets.ModelViewSet):
    queryset = StockAlert.objects.select_related('inventory', 'resolved_by', 'inventory__product')
    serializer_class = StockAlertSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['alert_type', 'is_resolved']
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return StockAlert.objects.all()
        return StockAlert.objects.filter(is_resolved=False)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.is_resolved = True
        alert.resolved_by = request.user
        alert.resolved_at = timezone.now()
        alert.save()
        return Response({'message': 'Alert resolved successfully'})
