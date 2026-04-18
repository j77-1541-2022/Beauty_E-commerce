from rest_framework import serializers
from django.utils import timezone
from .models import Category, Brand, Product, ProductVariant, ProductImage

class AdminProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'created_at']

class AdminProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'color', 'sku', 'additional_cost', 'is_active']

class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    images = AdminProductImageSerializer(many=True, read_only=True)
    variants = AdminProductVariantSerializer(many=True, read_only=True)
    profit_margin = serializers.ReadOnlyField()
    
    # Inventory fields
    stock_quantity = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    
    # Simplified fields to avoid 500 errors
    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = '__all__'
    
    def get_stock_quantity(self, obj):
        """Get stock quantity from inventory"""
        try:
            from inventory.models import Inventory
            inventory = Inventory.objects.get(product=obj)
            return inventory.quantity
        except Inventory.DoesNotExist:
            return 0
    
    def get_stock_status(self, obj):
        """Get stock status from inventory"""
        quantity = self.get_stock_quantity(obj)
        if quantity <= 0:
            return 'out_of_stock'
        elif quantity <= 5:
            return 'low_stock'
        else:
            return 'in_stock'
    
    def get_price(self, obj):
        """Calculate price after discount"""
        if obj.discount > 0 and obj.original_price:
            return obj.original_price * (1 - obj.discount / 100)
        return obj.selling_price
    
    def get_original_price(self, obj):
        """Get original price"""
        return obj.original_price or obj.selling_price
    
    def get_discount(self, obj):
        """Get discount percentage"""
        return obj.discount
    
    def create(self, validated_data):
        """Create product with proper error handling"""
        try:
            # Extract images from request
            request = self.context.get('request')
            images_data = request.FILES.getlist('images') if request else []
            
            # Create product
            product = Product.objects.create(**validated_data)
            
            # Handle images
            if images_data:
                for i, image_data in enumerate(images_data):
                    ProductImage.objects.create(
                        product=product,
                        image=image_data,
                        is_primary=(i == 0)
                    )
            
            return product
            
        except Exception as e:
            raise serializers.ValidationError(f"Error creating product: {str(e)}")

class AdminProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    # Inventory fields
    stock_quantity = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    
    # Simplified fields
    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'price', 'original_price', 'discount',
            'category_name', 'brand_name', 'is_active', 'primary_image',
            'stock_quantity', 'stock_status'
        ]
    
    def get_stock_quantity(self, obj):
        """Get stock quantity from inventory"""
        try:
            from inventory.models import Inventory
            inventory = Inventory.objects.get(product=obj)
            return inventory.quantity
        except Inventory.DoesNotExist:
            return 0
    
    def get_stock_status(self, obj):
        """Get stock status from inventory"""
        quantity = self.get_stock_quantity(obj)
        if quantity <= 0:
            return 'out_of_stock'
        elif quantity <= 5:
            return 'low_stock'
        else:
            return 'in_stock'
    
    def get_primary_image(self, obj):
        """Get primary image URL"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return primary_image.image.url
        # Fallback to first image
        first_image = obj.images.first()
        if first_image:
            return first_image.image.url
        return None
    
    def get_price(self, obj):
        """Calculate price after discount"""
        if obj.discount > 0 and obj.original_price:
            return obj.original_price * (1 - obj.discount / 100)
        return obj.selling_price
    
    def get_original_price(self, obj):
        """Get original price"""
        return obj.original_price or obj.selling_price
    
    def get_discount(self, obj):
        """Get discount percentage"""
        return obj.discount
