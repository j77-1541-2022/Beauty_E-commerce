from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F, Sum, Avg, Count
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Product, Dealer, StockMovement, ProductReview, CustomerWishlist
from .serializers import (
    ProductSerializer, DealerSerializer, StockMovementSerializer,
    ProductReviewSerializer, CustomerWishlistSerializer
)
from .permissions import IsDealerOrAdmin, IsOwnerOrAdmin
from .filters import ProductFilter

class ProductViewSet(viewsets.ModelViewSet):
    """
    Unified product viewset for all user types
    - Customers: See only IN_STOCK products
    - Dealers: See all their products
    - Admins: See all products
    """
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'brand', 'stock_status', 'is_active']
    search_fields = ['name', 'description', 'brand', 'sku']
    
    def get_queryset(self):
        """
        Dynamic queryset based on user role
        Single source of truth for all product data
        """
        user = self.request.user
        
        if not user.is_authenticated:
            # Unauthenticated users see only active, in-stock products
            return Product.objects.filter(
                is_active=True,
                stock_status='in_stock',
                stock_quantity__gt=0
            )
        
        if user.groups.filter(name='customers').exists():
            # Customers see only available products
            return Product.objects.filter(
                is_active=True,
                stock_status='in_stock',
                stock_quantity__gt=0
            )
        
        elif user.groups.filter(name='dealers').exists():
            # Dealers see all their products regardless of stock status
            try:
                dealer = Dealer.objects.get(user=user)
                return Product.objects.filter(dealer=dealer)
            except Dealer.DoesNotExist:
                return Product.objects.none()
        
        elif user.is_staff or user.is_superuser:
            # Admins see all products
            return Product.objects.all()
        
        return Product.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        """Get single product with stock status"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """
        Update stock status (for dealers/admins)
        Creates audit trail in StockMovement
        """
        product = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.is_staff or user.is_superuser or 
                  (user.groups.filter(name='dealers').exists() and 
                   product.dealer and product.dealer.user == user)):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get new stock data
        new_quantity = request.data.get('stock_quantity')
        reason = request.data.get('reason', 'Stock update')
        
        if new_quantity is None:
            return Response(
                {'error': 'Stock quantity is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Record previous quantity for audit
        previous_quantity = product.stock_quantity
        
        # Update product stock
        product.stock_quantity = int(new_quantity)
        product.last_stock_update = timezone.now()
        product.save()
        
        # Auto-update stock status
        product.update_stock_status()
        
        # Create stock movement record
        movement_type = 'adjustment'
        if new_quantity > previous_quantity:
            movement_type = 'in'
        elif new_quantity < previous_quantity:
            movement_type = 'out'
        
        StockMovement.objects.create(
            product=product,
            movement_type=movement_type,
            quantity=abs(new_quantity - previous_quantity),
            previous_quantity=previous_quantity,
            new_quantity=new_quantity,
            reason=reason,
            created_by=user
        )
        
        serializer = self.get_serializer(product)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        """
        Toggle product availability (for dealers/admins)
        """
        product = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.is_staff or user.is_superuser or 
                  (user.groups.filter(name='dealers').exists() and 
                   product.dealer and product.dealer.user == user)):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Toggle availability
        product.is_active = not product.is_active
        product.save()
        
        return Response({
            'is_active': product.is_active,
            'message': f'Product {"activated" if product.is_active else "deactivated"} successfully'
        })

class DealerViewSet(viewsets.ModelViewSet):
    """Dealer management for admins"""
    queryset = Dealer.objects.all()
    serializer_class = DealerSerializer
    permission_classes = [permissions.IsAuthenticated, IsDealerOrAdmin]
    
    @action(detail=True, methods=['get'])
    def inventory_summary(self, request, pk=None):
        """Get inventory summary for a dealer"""
        dealer = self.get_object()
        
        products = Product.objects.filter(dealer=dealer)
        summary = products.aggregate(
            total_products=Count('id'),
            in_stock=Count('id', filter=Q(stock_status='in_stock')),
            out_of_stock=Count('id', filter=Q(stock_status='out_of_stock')),
            low_stock=Count('id', filter=Q(stock_status='low_stock')),
            total_value=Sum('price'),
            avg_price=Avg('price')
        )
        
        return Response({
            'dealer': DealerSerializer(dealer).data,
            'summary': summary,
            'recent_movements': StockMovementSerializer(
                StockMovement.objects.filter(
                    product__in=products
                ).order_by('-created_at')[:10],
                many=True
            ).data
        })

class StockMovementViewSet(viewsets.ModelViewSet):
    """Stock movement audit trail"""
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'movement_type', 'created_by']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_staff or user.is_superuser:
            return StockMovement.objects.all()
        elif user.groups.filter(name='dealers').exists():
            try:
                dealer = Dealer.objects.get(user=user)
                return StockMovement.objects.filter(
                    product__dealer=dealer
                )
            except Dealer.DoesNotExist:
                return StockMovement.objects.none()
        
        return StockMovement.objects.none()

class CustomerWishlistViewSet(viewsets.ModelViewSet):
    """Customer wishlist management"""
    serializer_class = CustomerWishlistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return CustomerWishlist.objects.filter(customer=user)
    
    def create(self, request, *args, **kwargs):
        """Add product to wishlist"""
        user = request.user
        product_id = request.data.get('product')
        
        # Check if product exists and is available
        try:
            product = Product.objects.get(
                id=product_id,
                is_active=True,
                stock_status='in_stock',
                stock_quantity__gt=0
            )
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not available or out of stock'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already in wishlist
        if CustomerWishlist.objects.filter(customer=user, product=product).exists():
            return Response(
                {'error': 'Product already in wishlist'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add to wishlist
        wishlist_item = CustomerWishlist.objects.create(
            customer=user,
            product=product
        )
        
        serializer = self.get_serializer(wishlist_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProductReviewViewSet(viewsets.ModelViewSet):
    """Customer product reviews"""
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ProductReview.objects.filter(customer=user)
    
    def create(self, request, *args, **kwargs):
        """Add product review"""
        user = request.user
        product_id = request.data.get('product')
        
        # Check if user has purchased the product (simplified check)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create review
        review = ProductReview.objects.create(
            product=product,
            customer=user,
            rating=request.data.get('rating'),
            comment=request.data.get('comment', '')
        )
        
        serializer = self.get_serializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# API Views for specific functionality
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def live_inventory_status(request):
    """Get real-time inventory status for frontend"""
    user = request.user
    
    if not user.is_authenticated:
        # Public inventory stats
        stats = Product.objects.filter(
            is_active=True,
            stock_status='in_stock'
        ).aggregate(
            total_products=Count('id'),
            categories=Count('category', distinct=True),
            avg_price=Avg('price')
        )
    else:
        stats = {}
        
        if user.groups.filter(name='customers').exists():
            # Customer-specific stats
            stats = Product.objects.filter(
                is_active=True,
                stock_status='in_stock'
            ).aggregate(
                available_products=Count('id'),
                categories=Count('category', distinct=True)
            )
        
        elif user.groups.filter(name='dealers').exists():
            # Dealer-specific stats
            try:
                dealer = Dealer.objects.get(user=user)
                stats = Product.objects.filter(dealer=dealer).aggregate(
                    total_products=Count('id'),
                    in_stock=Count('id', filter=Q(stock_status='in_stock')),
                    out_of_stock=Count('id', filter=Q(stock_status='out_of_stock')),
                    low_stock=Count('id', filter=Q(stock_status='low_stock'))
                )
            except Dealer.DoesNotExist:
                stats = {'total_products': 0, 'in_stock': 0, 'out_of_stock': 0, 'low_stock': 0}
        
        elif user.is_staff or user.is_superuser:
            # Admin stats
            stats = Product.objects.all().aggregate(
                total_products=Count('id'),
                in_stock=Count('id', filter=Q(stock_status='in_stock')),
                out_of_stock=Count('id', filter=Q(stock_status='out_of_stock')),
                low_stock=Count('id', filter=Q(stock_status='low_stock')),
                total_value=Sum('price')
            )
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def low_stock_alerts(request):
    """Get low stock alerts for dealers"""
    user = request.user
    
    if not (user.is_staff or user.is_superuser or 
              user.groups.filter(name='dealers').exists()):
        return Response(
            {'error': 'Permission denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if user.is_staff or user.is_superuser:
        # Admin sees all low stock products
        products = Product.objects.filter(
            stock_status='low_stock',
            is_active=True
        )
    else:
        # Dealer sees only their low stock products
        try:
            dealer = Dealer.objects.get(user=user)
            products = Product.objects.filter(
                dealer=dealer,
                stock_status='low_stock',
                is_active=True
            )
        except Dealer.DoesNotExist:
            products = Product.objects.none()
    
    serializer = ProductSerializer(products, many=True)
    return Response({
        'low_stock_products': serializer.data,
        'count': products.count(),
        'alert_threshold': 5  # Products below this quantity trigger alerts
    })
