from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Category, Brand, Product, ProductVariant, ProductImage
from .serializers import (
    CategorySerializer, BrandSerializer, ProductSerializer, 
    ProductListSerializer, ProductVariantSerializer, ProductImageSerializer
)
from .admin_serializers import AdminProductSerializer, AdminProductListSerializer

class AdminProductViewSet(viewsets.ModelViewSet):
    """
    Admin Product ViewSet - Handles admin product management
    Includes customer view filtering and inventory status integration
    """
    queryset = Product.objects.select_related('category', 'brand').prefetch_related('images', 'variants')
    serializer_class = AdminProductSerializer
    permission_classes = [AllowAny]  # Allow anyone to view products, but restrict write operations
    filterset_fields = ['category', 'brand', 'product_type', 'is_active']
    search_fields = ['name', 'sku', 'description', 'brand__name', 'category__name']
    ordering_fields = ['name', 'created_at', 'selling_price', 'cost_price']
    
    def get_permissions(self):
        """
        Allow read access for anyone, but require authentication for write operations
        """
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AdminProductListSerializer
        return AdminProductSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Handle customer_view parameter
        customer_view = self.request.GET.get('customer_view')
        if customer_view == 'true':
            queryset = queryset.filter(is_active=True)
            
            # Filter out out-of-stock products for customer view
            from inventory.models import Inventory
            product_ids_with_stock = Inventory.objects.filter(quantity__gt=0).values_list('product_id', flat=True)
            queryset = queryset.filter(id__in=product_ids_with_stock)
            
            # Handle stock_status filter
            stock_status = self.request.GET.get('stock_status')
            if stock_status == 'in_stock':
                queryset = queryset.filter(
                    id__in=Inventory.objects.filter(quantity__gt=0).values_list('product_id', flat=True)
                )
        elif stock_status == 'low_stock':
                queryset = queryset.filter(
                    id__in=Inventory.objects.filter(quantity__lte=5, quantity__gt=0).values_list('product_id', flat=True)
                )
        
        return queryset
    
    def perform_create(self, serializer):
        """Handle product creation with proper error handling"""
        try:
            serializer.save()
        except Exception as e:
            raise serializers.ValidationError(f"Error creating product: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        """Upload image for product"""
        product = self.get_object()
        image_data = request.FILES.get('image')
        alt_text = request.data.get('alt_text', '')
        is_primary = request.data.get('is_primary', 'false').lower() == 'true'
        
        if not image_data:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if is_primary:
                ProductImage.objects.filter(product=product, is_primary=True).update(is_primary=False)
            
            ProductImage.objects.create(
                product=product,
                image=image_data,
                alt_text=alt_text,
                is_primary=is_primary
            )
            
            return Response({'message': 'Image uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f'Error uploading image: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get product statistics"""
        try:
            total_products = self.get_queryset().count()
            active_products = self.get_queryset().filter(is_active=True).count()
            inactive_products = total_products - active_products
            
            return Response({
                'total_products': total_products,
                'active_products': active_products,
                'inactive_products': inactive_products
            })
        except Exception as e:
            return Response({'error': f'Error getting stats: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
