from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Wishlist, WishlistItem
from products.models import Product
from .serializers import WishlistSerializer, WishlistItemSerializer

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def get_object(self):
        wishlist, created = Wishlist.objects.get_or_create(user=self.request.user)
        return wishlist

    def list(self, request):
        wishlist = self.get_object()
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        wishlist = self.get_object()
        product_id = request.data.get('product_id')

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'success': False, 'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        wishlist_item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist,
            product=product
        )

        serializer = self.get_serializer(wishlist)
        return Response({
            'success': True,
            'message': 'Added to wishlist' if created else 'Already in wishlist',
            'data': serializer.data
        })

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        wishlist = self.get_object()
        product_id = request.data.get('product_id')

        try:
            wishlist_item = WishlistItem.objects.get(
                wishlist=wishlist,
                product_id=product_id
            )
            wishlist_item.delete()
            return Response({
                'success': True,
                'message': 'Removed from wishlist'
            })
        except WishlistItem.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Item not found in wishlist'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        wishlist = self.get_object()
        wishlist.items.all().delete()
        return Response({
            'success': True,
            'message': 'Wishlist cleared'
        })

    @action(detail=False, methods=['get'])
    def check_item(self, request, pk=None):
        wishlist = self.get_object()
        product_id = request.query_params.get('product_id') or pk

        is_in_wishlist = WishlistItem.objects.filter(
            wishlist=wishlist,
            product_id=product_id
        ).exists()

        return Response({
            'success': True,
            'is_in_wishlist': is_in_wishlist
        })
