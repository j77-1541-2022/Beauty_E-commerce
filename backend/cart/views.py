from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from utils.permissions import IsCustomerUser
from utils.api_response import APIResponseMixin

from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product
from .services import get_guest_cart_from_session, save_guest_cart_to_session
import logging

logger = logging.getLogger(__name__)

class CartViewSet(viewsets.ModelViewSet, APIResponseMixin):
    serializer_class = CartSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Cart.objects.filter(user=self.request.user)
        return Cart.objects.none()
    
    def get_object(self):
        if not self.request.user.is_authenticated:
            return None
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart

    def _guest_response(self, request):
        guest_items = get_guest_cart_from_session(request)
        items = []
        total_price = 0
        total_items = 0

        for row in guest_items:
            try:
                product = Product.objects.get(id=row['product_id'], is_active=True)
            except (Product.DoesNotExist, KeyError, TypeError):
                continue

            quantity = int(row.get('quantity', 1) or 1)
            quantity = max(1, quantity)
            line_total = product.selling_price * quantity
            total_price += line_total
            total_items += quantity

            items.append({
                'id': f"guest-{product.id}",
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'selling_price': product.selling_price,
                    'price': product.selling_price,
                    'primary_image': product.primary_image.url if getattr(product, 'primary_image', None) else None,
                },
                'quantity': quantity,
                'total_price': line_total,
            })

        return Response({
            'id': 'guest',
            'items': items,
            'total_price': total_price,
            'total_items': total_items,
        })
    
    def list(self, request):
        try:
            if not request.user.is_authenticated:
                return self._guest_response(request)
            cart = self.get_object()
            if cart is None:
                return self._guest_response(request)
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching cart: {str(e)}")
            return Response({'error': 'Failed to fetch cart', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        try:
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
            
            if request.user.is_authenticated:
                cart = self.get_object()
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

            guest_items = get_guest_cart_from_session(request)
            merged = False
            for row in guest_items:
                if row.get('product_id') == product.id:
                    row['quantity'] = int(row.get('quantity', 1)) + quantity
                    merged = True
                    break
            if not merged:
                guest_items.append({'product_id': product.id, 'quantity': quantity})
            save_guest_cart_to_session(request, guest_items)
            return self._guest_response(request)
        except Exception as e:
            logger.error(f"Error adding item to cart: {str(e)}")
            return Response({'error': 'Failed to add item to cart', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        try:
            product_id = request.data.get('product_id')
            
            if not product_id:
                return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if request.user.is_authenticated:
                cart = self.get_object()
                try:
                    cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
                    cart_item.delete()
                except CartItem.DoesNotExist:
                    return Response({'error': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)

                serializer = CartSerializer(cart)
                return Response(serializer.data)

            guest_items = [
                row for row in get_guest_cart_from_session(request)
                if str(row.get('product_id')) != str(product_id)
            ]
            save_guest_cart_to_session(request, guest_items)
            return self._guest_response(request)
        except Exception as e:
            logger.error(f"Error removing item from cart: {str(e)}")
            return Response({'error': 'Failed to remove item', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        try:
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
            
            if request.user.is_authenticated:
                cart = self.get_object()
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

            guest_items = get_guest_cart_from_session(request)
            updated = []
            for row in guest_items:
                if str(row.get('product_id')) == str(product_id):
                    if quantity > 0:
                        row['quantity'] = quantity
                        updated.append(row)
                else:
                    updated.append(row)
            save_guest_cart_to_session(request, updated)
            return self._guest_response(request)
        except Exception as e:
            logger.error(f"Error updating cart quantity: {str(e)}")
            return Response({'error': 'Failed to update quantity', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        try:
            if request.user.is_authenticated:
                cart = self.get_object()
                cart.items.all().delete()
                serializer = CartSerializer(cart)
                return Response(serializer.data)

            save_guest_cart_to_session(request, [])
            return self._guest_response(request)
        except Exception as e:
            logger.error(f"Error clearing cart: {str(e)}")
            return Response({'error': 'Failed to clear cart', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
