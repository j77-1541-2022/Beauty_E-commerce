from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Dealer, StockMovement, ProductReview, CustomerWishlist

class DealerSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Dealer
        fields = [
            'id', 'user', 'user_name', 'user_email', 'business_name',
            'business_license', 'phone', 'address', 'is_verified',
            'created_at'
        ]
        read_only_fields = ['id', 'user_name', 'user_email', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    dealer_name = serializers.CharField(source='dealer.business_name', read_only=True)
    current_price = serializers.DecimalField(read_only=True)
    is_available_for_customers = serializers.BooleanField(read_only=True)
    stock_level_percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'brand', 'price',
            'original_price', 'discount_percentage', 'current_price',
            'stock_quantity', 'stock_status', 'low_stock_threshold',
            'reorder_level', 'dealer', 'dealer_name', 'dealer_type',
            'is_active', 'is_featured', 'image', 'additional_images',
            'sku', 'barcode', 'weight', 'dimensions',
            'is_available_for_customers', 'stock_level_percentage',
            'created_at', 'updated_at', 'last_stock_update'
        ]
    
    def to_representation(self, instance):
        """Custom representation with stock status logic"""
        data = super().to_representation(instance)
        
        # Add stock status with context
        if not instance.is_available_for_customers:
            data['availability_status'] = 'unavailable'
            data['availability_message'] = 'Out of Stock'
        elif instance.stock_status == 'low_stock':
            data['availability_status'] = 'low_stock'
            data['availability_message'] = f'Only {instance.stock_quantity} left'
        else:
            data['availability_status'] = 'available'
            data['availability_message'] = 'In Stock'
        
        # Add formatted price
        if instance.discount_percentage > 0:
            data['discount_amount'] = instance.original_price - instance.current_price
            data['savings_percentage'] = instance.discount_percentage
        else:
            data['discount_amount'] = 0
            data['savings_percentage'] = 0
        
        return data

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    quantity_change = serializers.SerializerMethodField()
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'movement_type', 'quantity', 'previous_quantity',
            'new_quantity', 'quantity_change', 'reason',
            'created_by', 'created_by_name', 'created_at'
        ]
    
    def get_quantity_change(self, obj):
        """Calculate the change in quantity"""
        change = obj.new_quantity - obj.previous_quantity
        return f"+{change}" if change > 0 else str(change)

class ProductReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'product_name', 'customer', 'customer_name',
            'rating', 'comment', 'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'customer_name', 'created_at']

class CustomerWishlistSerializer(serializers.ModelSerializer):
    product_details = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerWishlist
        fields = [
            'id', 'product', 'product_details', 'is_available',
            'added_at'
        ]
    
    def get_product_details(self, obj):
        """Include full product details"""
        return ProductSerializer(obj.product).data
    
    def get_is_available(self, obj):
        """Check if wishlist item is still available"""
        return obj.product.is_available_for_customers

class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product lists"""
    current_price = serializers.DecimalField(read_only=True)
    is_available_for_customers = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'brand', 'price',
            'current_price', 'discount_percentage', 'image',
            'stock_status', 'is_available_for_customers',
            'rating', 'reviews_count'
        ]
    
    def get_rating(self, obj):
        """Get average rating from reviews"""
        reviews = ProductReview.objects.filter(product=obj)
        if reviews.exists():
            avg_rating = reviews.aggregate(avg_rating=serializers.Avg('rating'))['avg_rating']
            return round(avg_rating, 1) if avg_rating else 0
        return 0
    
    def get_reviews_count(self, obj):
        """Get total reviews count"""
        return ProductReview.objects.filter(product=obj).count()
