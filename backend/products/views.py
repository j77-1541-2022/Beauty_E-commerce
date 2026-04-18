"""
Products Views with Role-Based Permissions - Section D
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
import logging

from utils.permissions import IsAdminUser, IsVerifiedDealer, ReadOnly
from utils.api_response import APIResponseMixin

from .models import Category, Brand, Product, ProductVariant, ProductImage
from .serializers import (
    CategorySerializer, BrandSerializer, ProductSerializer,
    ProductListSerializer, ProductVariantSerializer, ProductImageSerializer,
    ProductDetailWithDealerSerializer, ProductListWithDealerSerializer
)

logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ModelViewSet, APIResponseMixin):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser | ReadOnly]


class BrandViewSet(viewsets.ModelViewSet, APIResponseMixin):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAdminUser | ReadOnly]


class ProductViewSet(viewsets.ModelViewSet, APIResponseMixin):
    """Product ViewSet with role-based access and dealer integration"""
    
    filterset_fields = ['category', 'brand', 'product_type', 'is_active', 'dealer']
    search_fields = ['name', 'sku', 'description', 'brand__name', 'category__name']
    ordering_fields = ['name', 'created_at', 'selling_price', 'cost_price', 'rating']
    filter_backends = [DjangoFilterBackend]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        """Determine permissions based on action"""
        if self.action in ['list', 'retrieve', 'search', 'by_category', 'by_dealer', 'by_brand']:
            return [ReadOnly()]
        elif self.action in ['create']:
            return [IsAdminUser | IsVerifiedDealer]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser]
        return [IsAdminUser | IsVerifiedDealer]

    def get_serializer_class(self):
        """Select serializer based on action and user role"""
        if self.action == 'list':
            return ProductListWithDealerSerializer
        elif self.action == 'retrieve':
            return ProductDetailWithDealerSerializer
        return ProductSerializer

    def get_queryset(self):
        """Get products based on user role and filters"""
        queryset = Product.objects.select_related(
            'category', 'brand', 'dealer'
        ).prefetch_related('images', 'variants')
        
        user = self.request.user

        if not user.is_authenticated:
            return queryset.filter(is_active=True)

        if user.role == 'admin':
            return queryset

        # Customers and dealers see only active products
        queryset = queryset.filter(is_active=True)
        
        # Filter by dealer if specified
        dealer_id = self.request.query_params.get('dealer_id')
        if dealer_id:
            queryset = queryset.filter(dealer_id=dealer_id)
        
        return queryset

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get all products by a specific category with dealer info"""
        category_id = request.query_params.get('category_id')

        if not category_id:
            return Response(
                {'error': 'category_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            queryset = self.get_queryset().filter(category_id=category_id)
            serializer = ProductListWithDealerSerializer(queryset, many=True)
            return Response({
                'count': len(queryset),
                'category_id': category_id,
                'products': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def by_dealer(self, request):
        """Get all products from a specific dealer"""
        dealer_id = request.query_params.get('dealer_id')
        
        if not dealer_id:
            return Response(
                {'error': 'dealer_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            queryset = self.get_queryset().filter(dealer_id=dealer_id)
            serializer = ProductListWithDealerSerializer(queryset, many=True)
            return Response({
                'count': len(queryset),
                'dealer_id': dealer_id,
                'products': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def by_brand(self, request):
        """Get all products by a specific brand"""
        brand_id = request.query_params.get('brand_id')
        
        if not brand_id:
            return Response(
                {'error': 'brand_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            queryset = self.get_queryset().filter(brand_id=brand_id)
            serializer = ProductListWithDealerSerializer(queryset, many=True)
            return Response({
                'count': len(queryset),
                'brand_id': brand_id,
                'products': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search products across categories by name or description"""
        query = request.query_params.get('q', '').strip()
        category = request.query_params.get('category')
        dealer_id = request.query_params.get('dealer_id')
        
        if not query or len(query) < 2:
            return Response(
                {'error': 'Search query must be at least 2 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset()
        
        # Search in name, description, category, and brand
        queryset = queryset.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query) |
            Q(brand__name__icontains=query)
        )
        
        if category:
            queryset = queryset.filter(category_id=category)
        
        if dealer_id:
            queryset = queryset.filter(dealer_id=dealer_id)
        
        serializer = ProductListWithDealerSerializer(queryset, many=True)
        return Response({
            'query': query,
            'count': len(queryset),
            'results': serializer.data
        })

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """Upload image for a product"""
        product = self.get_object()

        # Ensure dealers can upload only to their own products.
        if hasattr(request.user, 'role') and request.user.role == 'dealer':
            dealer_profile = getattr(request.user, 'dealer_profile', None)
            if not dealer_profile or product.dealer_id != dealer_profile.id:
                return Response({'error': 'You can only upload images for your own products.'}, status=status.HTTP_403_FORBIDDEN)

        image_data = request.FILES.get('image') or request.data.get('image')
        if not image_data:
            return Response({'error': 'No image provided. Use multipart/form-data with field name "image".'}, status=status.HTTP_400_BAD_REQUEST)

        content_type = getattr(image_data, 'content_type', '')
        if content_type and not str(content_type).startswith('image/'):
            return Response({'error': f'Invalid file type "{content_type}". Please upload an image.'}, status=status.HTTP_400_BAD_REQUEST)

        alt_text = request.data.get('alt_text', '')
        is_primary_raw = request.data.get('is_primary', False)
        if isinstance(is_primary_raw, str):
            is_primary = is_primary_raw.lower() in ['true', '1', 'yes', 'on']
        else:
            is_primary = bool(is_primary_raw)

        payload = {
            'image': image_data,
            'alt_text': alt_text,
            'is_primary': is_primary,
        }

        serializer = ProductImageSerializer(data=payload)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            if is_primary:
                ProductImage.objects.filter(product=product, is_primary=True).update(is_primary=False)

            serializer.save(product=product)
            return Response({'message': 'Image uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception('Product image upload failed for product_id=%s: %s', product.id, str(exc))
            payload = {
                'error': 'Image upload failed on server. Please verify file type/size and try again.'
            }
            if settings.DEBUG:
                payload['details'] = str(exc)
            return Response(
                payload,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def variants(self, request, pk=None):
        """Get product variants"""
        product = self.get_object()
        variants = product.variants.filter(is_active=True)
        
        data = [
            {
                'id': v.id,
                'size': v.size,
                'color': v.color,
                'sku': v.sku,
                'additional_cost': float(v.additional_cost)
            }
            for v in variants
        ]
        
        return Response(data)

        return Response({'message': 'Image uploaded successfully'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def add_variant(self, request, pk=None):
        product = self.get_object()
        serializer = ProductVariantSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.GET.get('q', '')
        if not query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)

        products = self.get_queryset().filter(
            Q(name__icontains=query) |
            Q(sku__icontains=query) |
            Q(description__icontains=query) |
            Q(brand__name__icontains=query) |
            Q(category__name__icontains=query)
        )

        page = self.paginate_queryset(products)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
