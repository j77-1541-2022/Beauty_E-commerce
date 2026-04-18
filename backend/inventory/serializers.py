from rest_framework import serializers
from .models import Supplier, Inventory, StockMovement, StockAlert
from products.serializers import ProductListSerializer

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class InventorySerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    stock_status = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Inventory
        fields = '__all__'

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='inventory.product.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['created_by']

class StockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='inventory.product.name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.username', read_only=True)
    
    class Meta:
        model = StockAlert
        fields = '__all__'
