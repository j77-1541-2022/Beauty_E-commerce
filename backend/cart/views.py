from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from utils.permissions import IsCustomerUser
from utils.api_response import APIResponseMixin

from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product
import logging

logger = logging.getLogger(__name__)

class CartViewSet(viewsets.ModelViewSet, APIResponseMixin):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)
    
    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart
    
    def list(self, request):
        try:
            cart = self.get_object()
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching cart: {str(e)}")
            return Response({'error': 'Failed to fetch cart', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        try:
            cart = self.get_object()
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 1))
            
            if not product_id:
                return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                product = Product.objects.get(id=product_id, is_active=True)
            except Product.DoesNotExist:
                return Response({'error': 'Product not found or inactive'}, status=status.HTTP_404_NOT_FOUND)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid product ID'}, status=status.HTTP_400_BAD_REQUEST)
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error adding item to cart: {str(e)}")
            return Response({'error': 'Failed to add item to cart', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        try:
            cart = self.get_object()
            product_id = request.data.get('product_id')
            
            if not product_id:
                return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
                cart_item.delete()
            except CartItem.DoesNotExist:
                return Response({'error': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)
            
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error removing item from cart: {str(e)}")
            return Response({'error': 'Failed to remove item', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        try:
            cart = self.get_object()
            product_id = request.data.get('product_id')
            quantity = request.data.get('quantity')
            
            if not product_id or quantity is None:
                return Response({'error': 'Product ID and quantity are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                quantity = int(quantity)
                if quantity < 0:
                    return Response({'error': 'Quantity must be positive'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
                if quantity == 0:
                    cart_item.delete()
                else:
                    cart_item.quantity = quantity
                    cart_item.save()
            except CartItem.DoesNotExist:
                return Response({'error': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)
            
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating cart quantity: {str(e)}")
            return Response({'error': 'Failed to update quantity', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        try:
            cart = self.get_object()
            cart.items.all().delete()
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error clearing cart: {str(e)}")
            return Response({'error': 'Failed to clear cart', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
