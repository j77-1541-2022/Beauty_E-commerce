from rest_framework import serializers
from .models import SalesAnalytics, ProductAnalytics, InventoryInsight
from products.serializers import ProductListSerializer

class SalesAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesAnalytics
        fields = '__all__'

class ProductAnalyticsSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = ProductAnalytics
        fields = '__all__'

class InventoryInsightSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = InventoryInsight
        fields = '__all__'
