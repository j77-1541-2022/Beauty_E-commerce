from rest_framework import serializers
from .models import Category, Brand, Product, ProductVariant, ProductImage

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'created_at']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'color', 'sku', 'additional_cost', 'is_active']


# ========== DEALER INFORMATION SERIALIZERS ==========
class DealerBasicSerializer(serializers.Serializer):
    """Basic dealer info for product listings"""
    id = serializers.IntegerField()
    business_name = serializers.CharField()
    location = serializers.CharField()
    is_verified = serializers.BooleanField()


# ========== CUSTOMER-FACING PRODUCT SERIALIZERS ==========
class ProductDetailWithDealerSerializer(serializers.ModelSerializer):
    """Product detail with dealer information for customers"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    dealer_info = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'product_type',
            'category', 'category_name', 'brand', 'brand_name',
            'selling_price', 'original_price', 'discount', 'price',
            'has_discount', 'weight', 'dimensions', 'ingredients',
            'how_to_use', 'primary_image', 'images', 'variants',
            'rating', 'review_count', 'dealer_info', 'is_active', 'created_at'
        ]
    
    def get_dealer_info(self, obj):
        """Get dealer information"""
        if obj.dealer:
            return {
                'id': obj.dealer.id,
                'business_name': obj.dealer.business_name,
                'location': obj.dealer.location,
                'is_verified': obj.dealer.is_verified,
            }
        return None
    
    def get_primary_image(self, obj):
        """Get primary image URL or first image"""
        if obj.primary_image:
            return obj.primary_image.url
        if obj.images.exists():
            return obj.images.first().image.url
        return None


class ProductListWithDealerSerializer(serializers.ModelSerializer):
    """Product list for customers with dealer info"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    dealer_business_name = serializers.CharField(source='dealer.business_name', read_only=True)
    dealer_id = serializers.CharField(source='dealer.id', read_only=True)
    dealer_info = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    stock_quantity = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'selling_price', 'original_price', 'discount',
            'price', 'has_discount', 'rating', 'review_count', 'primary_image',
            'category_name', 'brand_name', 'dealer_business_name', 'dealer_id',
            'dealer_info', 'stock_quantity', 'stock_status', 'product_type', 'created_at'
        ]
    
    def get_primary_image(self, obj):
        """Get primary image URL"""
        if obj.primary_image:
            return obj.primary_image.url
        if obj.images.exists():
            return obj.images.first().image.url
        return None
    
    def get_dealer_info(self, obj):
        """Get dealer information with enhanced fields"""
        if obj.dealer:
            return {
                'id': obj.dealer.id,
                'business_name': obj.dealer.business_name,
                'location': obj.dealer.location,
                'is_verified': obj.dealer.is_verified,
                'whatsapp_number': obj.dealer.whatsapp_number if hasattr(obj.dealer, 'whatsapp_number') else None,
                'business_email': obj.dealer.business_email if hasattr(obj.dealer, 'business_email') else None,
            }
        return {
            'business_name': 'Glow Beyond Store',
            'is_verified': True,
            'location': 'Nairobi, Kenya'
        }
    
    def get_stock_quantity(self, obj):
        """Get stock quantity from dealer inventory if available"""
        if hasattr(obj, 'stock_quantity'):
            return obj.stock_quantity
        # Try to get from dealer inventory
        try:
            from dealer.models import DealerInventory
            inventory = DealerInventory.objects.filter(product=obj).first()
            if inventory:
                return inventory.stock_quantity
        except:
            pass
        return 10  # Default stock
    
    def get_stock_status(self, obj):
        """Calculate stock status"""
        quantity = self.get_stock_quantity(obj)
        if quantity == 0:
            return 'out_of_stock'
        elif quantity <= 5:
            return 'low_stock'
        return 'in_stock'


# ========== ADMIN/INTERNAL SERIALIZERS ==========
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    profit_margin = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = '__all__'
    
    def get_image_url(self, obj):
        """Return primary image URL or first image from images array"""
        if obj.primary_image:
            return obj.primary_image.url
        if obj.images.exists():
            return obj.images.first().image.url
        return None
    
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
            elif validated_data.get('primary_image'):
                # Handle single primary image
                ProductImage.objects.create(
                    product=product,
                    image=validated_data['primary_image'],
                    is_primary=True
                )
            
            return product
            
        except Exception as e:
            raise serializers.ValidationError(f"Error creating product: {str(e)}")

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    dealer_business_name = serializers.CharField(source='dealer.business_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'selling_price', 'discount', 'price',
            'category_name', 'brand_name', 'is_active', 'primary_image',
            'rating', 'review_count', 'dealer_business_name', 'created_at'
        ]
    
    def get_primary_image(self, obj):
        if obj.primary_image:
            return obj.primary_image.url
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return primary_image.image.url
        return None
