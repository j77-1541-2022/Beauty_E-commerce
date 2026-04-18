from rest_framework import serializers
from users.models import DealerProfile, User
from products.models import Product, Category, Brand, ProductImage
from dealer.models import (
    DealerInventory, DealerSalesAnalytics, DealerReport, 
    DecisionSupportMetric, DealerStockMovement
)
from orders.models import Order, OrderItem


class DealerProfileSerializer(serializers.ModelSerializer):
    """Serializer for dealer profile information"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    member_since = serializers.DateTimeField(source='created_at', read_only=True)
    total_products = serializers.SerializerMethodField()
    full_address = serializers.CharField(read_only=True)
    contact_phone = serializers.CharField(read_only=True)
    whatsapp_link = serializers.CharField(read_only=True)
    email_link = serializers.CharField(read_only=True)

    class Meta:
        model = DealerProfile
        fields = [
            'id', 'user_email', 'email', 'phone', 'member_since', 'business_name', 'business_phone', 'whatsapp_number',
            'business_email', 'location', 'city', 'state', 'country', 'postal_code',
            'latitude', 'longitude', 'full_address', 'contact_phone',
            'commission_rate', 'is_verified', 'verified_at', 'total_earnings',
            'pending_payout', 'created_at', 'user_phone', 'total_products',
            'whatsapp_link', 'email_link'
        ]
        read_only_fields = ['id', 'user_email', 'is_verified', 'verified_at',
                           'total_earnings', 'pending_payout', 'created_at',
                           'full_address', 'contact_phone', 'whatsapp_link', 'email_link']

    def get_total_products(self, obj):
        """Get count of active products"""
        return obj.products.filter(is_active=True).count()

    def get_email(self, obj):
        return obj.business_email or obj.user.email

    def get_phone(self, obj):
        return obj.business_phone or obj.user.phone


class DealerInventorySerializer(serializers.ModelSerializer):
    """Serializer for dealer inventory management"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    unit_price = serializers.DecimalField(source='product.cost_price', max_digits=10, decimal_places=2, read_only=True)
    stock_value = serializers.SerializerMethodField()
    stock_status = serializers.CharField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DealerInventory
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'stock_quantity',
            'unit_price', 'stock_value', 'reorder_level', 'reorder_quantity', 'stock_status', 'is_low_stock',
            'last_stock_update', 'last_reordered'
        ]
        read_only_fields = ['id', 'product_name', 'product_sku', 'stock_status', 
                           'is_low_stock', 'last_stock_update', 'last_reordered']

    def get_stock_value(self, obj):
        unit_price = obj.product.cost_price or 0
        return obj.stock_quantity * unit_price


class DealerStockMovementSerializer(serializers.ModelSerializer):
    """Serializer for stock movement history"""
    product_name = serializers.CharField(source='dealer_inventory.product.name', read_only=True)
    
    class Meta:
        model = DealerStockMovement
        fields = [
            'id', 'movement_type', 'quantity', 'quantity_before', 'quantity_after',
            'reason', 'reference', 'product_name', 'created_at'
        ]
        read_only_fields = ['id', 'quantity_before', 'quantity_after', 'product_name', 'created_at']


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images"""
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'created_at']


class DealerProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for dealers to create and update their products"""
    images = ProductImageSerializer(many=True, read_only=True)
    expiry_status = serializers.CharField(read_only=True)
    unit_price = serializers.DecimalField(source='cost_price', max_digits=10, decimal_places=2, read_only=True)
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'barcode', 'product_type',
            'category', 'category_name', 'brand', 'unit_price', 'cost_price', 'selling_price', 'original_price',
            'discount', 'weight', 'dimensions', 'ingredients', 'how_to_use',
            'primary_image', 'is_active', 'images', 'expiry_date', 'batch_number',
            'manufactured_date', 'expiry_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'dealer', 'images', 'expiry_status', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Accept either category id or category_name and enforce create-time requirements."""
        category_name = (attrs.pop('category_name', '') or '').strip()

        if category_name and not attrs.get('category'):
            category, _ = Category.objects.get_or_create(
                name=category_name,
                defaults={'description': f'Auto-created category: {category_name}'}
            )
            attrs['category'] = category

        description_value = attrs.get('description')
        is_create = self.instance is None
        if is_create and not description_value:
            raise serializers.ValidationError({'description': 'Description is required.'})
        if description_value is not None and not str(description_value).strip():
            raise serializers.ValidationError({'description': 'Description cannot be blank.'})

        return attrs
    
    def create(self, validated_data):
        """Create product with current dealer"""
        dealer = self.context['request'].user.dealer_profile
        validated_data['dealer'] = dealer
        return super().create(validated_data)


class DealerProductListSerializer(serializers.ModelSerializer):
    """Serialier for listing dealer products"""
    primary_image = serializers.SerializerMethodField()
    stock_quantity = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'selling_price', 'cost_price', 'unit_price', 'discount',
            'primary_image', 'is_active', 'rating', 'review_count', 
            'stock_quantity', 'stock_status', 'created_at', 'updated_at'
        ]
    
    def get_primary_image(self, obj):
        """Get primary image URL"""
        if obj.primary_image:
            return obj.primary_image.url
        return None
    
    def get_stock_quantity(self, obj):
        """Get current stock for this dealer"""
        dealer = self.context['request'].user.dealer_profile
        try:
            inv = DealerInventory.objects.get(dealer=dealer, product=obj)
            return inv.stock_quantity
        except DealerInventory.DoesNotExist:
            return 0
    
    def get_stock_status(self, obj):
        """Get stock status for this dealer"""
        dealer = self.context['request'].user.dealer_profile
        try:
            inv = DealerInventory.objects.get(dealer=dealer, product=obj)
            return inv.stock_status
        except DealerInventory.DoesNotExist:
            return 'out_of_stock'

    def get_unit_price(self, obj):
        return obj.cost_price


class DealerProductDetailSerializer(serializers.ModelSerializer):
    """Detailed product serializer for dealers"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    inventory = serializers.SerializerMethodField()
    unit_price = serializers.DecimalField(source='cost_price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'barcode', 'product_type',
            'category', 'category_name', 'brand', 'brand_name',
            'unit_price', 'cost_price', 'selling_price', 'original_price', 'discount',
            'weight', 'dimensions', 'ingredients', 'how_to_use',
            'primary_image', 'images', 'is_active', 'rating', 'review_count',
            'profit_margin', 'price', 'has_discount', 'inventory',
            'created_at', 'updated_at'
        ]
    
    def get_inventory(self, obj):
        """Get inventory data"""
        dealer = self.context['request'].user.dealer_profile
        try:
            inv = DealerInventory.objects.get(dealer=dealer, product=obj)
            return DealerInventorySerializer(inv).data
        except DealerInventory.DoesNotExist:
            return None


class DealerSalesAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for daily sales analytics"""
    class Meta:
        model = DealerSalesAnalytics
        fields = [
            'id', 'date', 'total_orders', 'total_items_sold', 'total_revenue',
            'total_profit', 'average_order_value', 'unique_customers', 'created_at'
        ]
        read_only_fields = fields


class DealerReportSerializer(serializers.ModelSerializer):
    """Serializer for dealer reports"""
    class Meta:
        model = DealerReport
        fields = [
            'id', 'report_type', 'period_start', 'period_end', 'status',
            'total_orders', 'total_items_sold', 'total_revenue', 'total_profit',
            'average_order_value', 'current_inventory_value', 'low_stock_count',
            'out_of_stock_count', 'unique_customers', 'returning_customers',
            'top_products', 'generated_at'
        ]
        read_only_fields = fields


class DecisionSupportMetricSerializer(serializers.ModelSerializer):
    """Serializer for decision support metrics"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = DecisionSupportMetric
        fields = [
            'id', 'metric_type', 'product', 'product_name', 'metric_value',
            'metric_label', 'description', 'recommendation', 'period_average',
            'trend_direction', 'calculated_at'
        ]
        read_only_fields = fields


# Customer-facing serializers
class DealerPublicSerializer(serializers.ModelSerializer):
    """Public dealer information for customers"""
    class Meta:
        model = DealerProfile
        fields = ['id', 'business_name', 'location', 'created_at']


class ProductVariantSerializer(serializers.Serializer):
    """Serializer for product variants"""
    size = serializers.CharField()
    color = serializers.CharField(allow_blank=True)
    sku = serializers.CharField()
    additional_cost = serializers.DecimalField(max_digits=10, decimal_places=2)


class CustomerProductDetailSerializer(serializers.ModelSerializer):
    """Product detail for customers including dealer info"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    dealer_info = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'product_type',
            'category', 'category_name', 'brand', 'brand_name',
            'selling_price', 'original_price', 'discount', 'price',
            'has_discount', 'weight', 'dimensions', 'ingredients',
            'how_to_use', 'primary_image', 'images',
            'rating', 'review_count', 'dealer_info', 'created_at'
        ]
    
    def get_dealer_info(self, obj):
        """Get dealer information"""
        if obj.dealer:
            return {
                'id': obj.dealer.id,
                'business_name': obj.dealer.business_name,
                'location': obj.dealer.location,
                'is_verified': obj.dealer.is_verified,
                'rating': 4.5  # Can be calculated from reviews
            }
        return None


class CustomerProductListSerializer(serializers.ModelSerializer):
    """Product list for customers"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    dealer_business_name = serializers.CharField(source='dealer.business_name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'selling_price', 'original_price', 'discount',
            'price', 'has_discount', 'rating', 'review_count', 'primary_image',
            'category_name', 'brand_name', 'dealer_business_name', 'created_at'
        ]
    
    def get_primary_image(self, obj):
        """Get primary image URL"""
        if obj.primary_image:
            return obj.primary_image.url
        return None
