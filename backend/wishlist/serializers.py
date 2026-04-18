from rest_framework import serializers
from .models import Wishlist, WishlistItem
from products.serializers import ProductSerializer

class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'added_at']
        read_only_fields = ['id', 'added_at']

class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'items', 'total_items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_total_items(self, obj):
        return obj.items.count()
