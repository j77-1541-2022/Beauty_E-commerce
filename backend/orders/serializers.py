from rest_framework import serializers
from django.db import transaction
from decimal import Decimal

from .models import Order, OrderItem, OrderStatusHistory
from products.serializers import ProductListSerializer
from products.models import Product
from inventory.models import Inventory
from .utils import calculate_shipping_cost

# Import Inventory at module level to avoid UnboundLocalError
# when using it inside the create method

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    receipt_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number', 'total_amount', 'created_by', 'deleted_by_customer', 'deleted_at']
    
    def get_receipt_url(self, obj):
        """Generate receipt URL for the order"""
        from django.conf import settings
        return f"/api/v1/orders/{obj.id}/receipt/"
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        
        total_amount = Decimal('0')
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            total_amount += item_data['total_price']
        
        order.total_amount = total_amount + validated_data.get('tax_amount', 0) + validated_data.get('shipping_cost', 0)
        order.save()
        
        return order

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    shipping_zone = serializers.CharField(required=False, default='nairobi_cbd')
    
    class Meta:
        model = Order
        fields = ['customer_name', 'customer_email', 'customer_phone', 'shipping_address', 
                 'shipping_zone', 'subtotal', 'tax_amount', 'shipping_cost', 'notes', 'items']
    
    def create(self, validated_data):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            items_data = validated_data.pop('items', [])
            user = self.context['request'].user
            created_by = validated_data.pop('created_by', user)

            if not items_data:
                raise serializers.ValidationError({'items': ['At least one item is required to place an order.']})

            # Merge duplicate product lines from client payload before validation.
            quantity_by_product = {}
            for item in items_data:
                try:
                    product_id = item.get('product_id')
                    if not product_id:
                        raise serializers.ValidationError({'items': ['Each item must have a product_id.']})
                    quantity_by_product[product_id] = quantity_by_product.get(product_id, 0) + int(item.get('quantity', 1))
                except (ValueError, TypeError) as e:
                    logger.error(f"Error processing item: {item}, Error: {e}")
                    raise serializers.ValidationError({'items': ['Invalid item data.']})

            product_ids = list(quantity_by_product.keys())

            # Fast validation without row locks (locks cause slowdown)
            products = Product.objects.filter(id__in=product_ids)
            products_by_id = {product.id: product for product in products}

            if len(products_by_id) != len(product_ids):
                invalid_ids = [pid for pid in product_ids if pid not in products_by_id]
                logger.warning(f"Invalid product IDs: {invalid_ids}")
                raise serializers.ValidationError({'items': ['One or more products are invalid or no longer available.']})

            inventories = Inventory.objects.filter(product_id__in=product_ids)
            inventories_by_product_id = {inv.product_id: inv for inv in inventories}

            missing_inventory = [pid for pid in product_ids if pid not in inventories_by_product_id]
            if missing_inventory:
                logger.warning(f"Missing inventory for products: {missing_inventory}. Will create inventory automatically.")
                # Create missing inventory records with 0 quantity
                for pid in missing_inventory:
                    Inventory.objects.get_or_create(
                        product_id=pid,
                        defaults={'quantity': 0}
                    )
                # Refresh inventory lookup
                inventories = Inventory.objects.filter(product_id__in=product_ids)
                inventories_by_product_id = {inv.product_id: inv for inv in inventories}

            # Quick stock check (advisory only, log warning but don't block order)
            for product_id, required_qty in quantity_by_product.items():
                inventory = inventories_by_product_id.get(product_id)
                if inventory and inventory.quantity < required_qty:
                    product_name = products_by_id[product_id].name
                    logger.warning(
                        f'Low stock for {product_name} (ID: {product_id}). '
                        f'Requested: {required_qty}, Available: {inventory.quantity}. '
                        f'Allowing order to proceed.'
                    )

            # Compute trusted totals from server-side prices.
            subtotal = Decimal('0.00')
            for product_id, qty in quantity_by_product.items():
                price = products_by_id[product_id].selling_price
                if price is None:
                    raise serializers.ValidationError({'items': [f'Product {products_by_id[product_id].name} has no valid price.']})
                subtotal += Decimal(str(price)) * Decimal(str(qty))

            tax_amount = Decimal('0.00')
            provided_shipping_address = validated_data.get('shipping_address', '')
            shipping_zone = validated_data.pop('shipping_zone', 'nairobi_cbd')
            
            # Validate shipping zone and get expected cost
            from .utils import get_shipping_cost_by_zone
            expected_shipping_cost = get_shipping_cost_by_zone(shipping_zone)
            provided_shipping_cost = Decimal(str(validated_data.get('shipping_cost', '0')))
            
            # Use zone-based cost if available, otherwise fallback to provided cost
            shipping_cost = expected_shipping_cost if expected_shipping_cost else provided_shipping_cost
            
            # Remove fields that will be set explicitly
            validated_data.pop('subtotal', None)
            validated_data.pop('tax_amount', None)
            validated_data.pop('shipping_cost', None)
            total_amount = subtotal + tax_amount + Decimal(str(shipping_cost))

            with transaction.atomic():
                order = Order.objects.create(
                    created_by=created_by,
                    shipping_zone=shipping_zone,
                    subtotal=subtotal,
                    tax_amount=tax_amount,
                    shipping_cost=shipping_cost,
                    total_amount=total_amount,
                    **validated_data,
                )

                # Create order items quickly - inventory deduction handled by signal
                for product_id, qty in quantity_by_product.items():
                    product = products_by_id[product_id]
                    unit_price = Decimal(str(product.selling_price))

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=qty,
                        unit_price=unit_price,
                        total_price=unit_price * Decimal(str(qty)),
                    )
            
            logger.info(f"Order {order.order_number} created successfully for user {user.id}")
            return order
        except serializers.ValidationError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating order: {str(e)}", exc_info=True)
            raise serializers.ValidationError({'detail': f'Failed to create order: {str(e)}'})
