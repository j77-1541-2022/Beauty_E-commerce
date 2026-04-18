from rest_framework import serializers
from django.db import transaction
from decimal import Decimal

from .models import Order, OrderItem, OrderStatusHistory
from products.serializers import ProductListSerializer
from products.models import Product
from inventory.models import Inventory, StockMovement

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
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number', 'total_amount', 'created_by']
    
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
    
    class Meta:
        model = Order
        fields = ['customer_name', 'customer_email', 'customer_phone', 'shipping_address', 
                 'subtotal', 'tax_amount', 'shipping_cost', 'notes', 'items']
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        created_by = validated_data.pop('created_by', user)

        if not items_data:
            raise serializers.ValidationError({'items': ['At least one item is required to place an order.']})

        # Merge duplicate product lines from client payload before validation.
        quantity_by_product = {}
        for item in items_data:
            product_id = item['product_id']
            quantity_by_product[product_id] = quantity_by_product.get(product_id, 0) + int(item['quantity'])

        product_ids = list(quantity_by_product.keys())

        with transaction.atomic():
            products = Product.objects.select_for_update().filter(id__in=product_ids)
            products_by_id = {product.id: product for product in products}

            if len(products_by_id) != len(product_ids):
                raise serializers.ValidationError({'items': ['One or more products are invalid.']})

            inventories = Inventory.objects.select_for_update().filter(product_id__in=product_ids)
            inventories_by_product_id = {inv.product_id: inv for inv in inventories}

            missing_inventory = [str(pid) for pid in product_ids if pid not in inventories_by_product_id]
            if missing_inventory:
                raise serializers.ValidationError({'items': ['Some products are not available in inventory.']})

            # Validate stock while rows are locked.
            for product_id, required_qty in quantity_by_product.items():
                inventory = inventories_by_product_id[product_id]
                if inventory.quantity < required_qty:
                    product_name = products_by_id[product_id].name
                    raise serializers.ValidationError(
                        {'items': [f'Insufficient stock for {product_name}. Available: {inventory.quantity}']}
                    )

            # Compute trusted totals from server-side prices.
            subtotal = Decimal('0.00')
            for product_id, qty in quantity_by_product.items():
                subtotal += products_by_id[product_id].selling_price * qty

            tax_amount = Decimal(validated_data.pop('tax_amount', 0) or 0)
            shipping_cost = Decimal(validated_data.pop('shipping_cost', 0) or 0)
            validated_data.pop('subtotal', None)
            total_amount = subtotal + tax_amount + shipping_cost

            order = Order.objects.create(
                created_by=created_by,
                subtotal=subtotal,
                tax_amount=tax_amount,
                shipping_cost=shipping_cost,
                total_amount=total_amount,
                **validated_data,
            )

            # Create order lines atomically. Inventory deduction is handled by existing
            # OrderItem post_save signal, while rows remain locked in this transaction.
            for product_id, qty in quantity_by_product.items():
                product = products_by_id[product_id]
                inventory = inventories_by_product_id[product_id]
                unit_price = product.selling_price
                quantity_before = inventory.quantity

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=qty,
                    unit_price=unit_price,
                    total_price=unit_price * qty,
                )

                inventory.refresh_from_db(fields=['quantity'])

                StockMovement.objects.create(
                    inventory=inventory,
                    movement_type='sale',
                    quantity=-qty,
                    quantity_before=quantity_before,
                    quantity_after=inventory.quantity,
                    reference=order.order_number,
                    notes=f'Stock deducted for order {order.order_number}',
                    created_by=user,
                )

            return order
