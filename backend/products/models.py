from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='brand_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Product(models.Model):
    PRODUCT_TYPES = [
        ('skincare', 'Skincare'),
        ('makeup', 'Makeup'),
        ('haircare', 'Haircare'),
        ('fragrance', 'Fragrance'),
        ('tools', 'Beauty Tools'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    sku = models.CharField(max_length=50)
    barcode = models.CharField(max_length=50, blank=True, null=True)
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, related_name='products')
    dealer = models.ForeignKey('users.DealerProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='products')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    # NEW: Add pricing fields for frontend compatibility
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0.00'))])
    discount = models.IntegerField(default=0, help_text="Discount percentage")
    weight = models.DecimalField(max_digits=8, decimal_places=3, blank=True, null=True, help_text="Weight in kg")
    dimensions = models.CharField(max_length=100, blank=True, help_text="Length x Width x Height")
    ingredients = models.TextField(blank=True)
    how_to_use = models.TextField(blank=True)
    # NEW: Add primary image field
    primary_image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, help_text="Average rating from reviews")
    review_count = models.PositiveIntegerField(default=0)
    # Expiry tracking fields
    expiry_date = models.DateField(null=True, blank=True, help_text="Product expiration date")
    batch_number = models.CharField(max_length=50, blank=True, help_text="Product batch/lot number")
    manufactured_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [['sku', 'dealer']]
    
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    def update_rating(self):
        """Update product rating based on approved reviews"""
        from reviews.models import Review
        reviews = Review.objects.filter(product=self, is_approved=True)
        if reviews.exists():
            avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0
            self.rating = round(avg_rating, 2)
            self.review_count = reviews.count()
        else:
            self.rating = 0
            self.review_count = 0
        self.save(update_fields=['rating', 'review_count'])
    
    @property
    def profit_margin(self):
        if self.selling_price and self.selling_price > 0:
            return ((self.selling_price - self.cost_price) / self.selling_price) * 100
        return 0
    
    @property
    def price(self):
        """Calculate price after discount"""
        if self.discount > 0 and self.original_price:
            return self.original_price * (1 - self.discount / 100)
        return self.selling_price or 0
    
    @property
    def has_discount(self):
        """Check if product has discount"""
        return self.discount > 0 and self.original_price
    
    def get_inventory_status(self):
        """Get current inventory status"""
        try:
            # Try to get from inventory app
            inventory = self.inventory_set.first()
            if inventory:
                return {
                    'stock_quantity': inventory.stock_quantity,
                    'stock_status': inventory.stock_status,
                    'low_stock_threshold': getattr(inventory, 'low_stock_threshold', 5),
                    'last_updated': getattr(inventory, 'last_updated', timezone.now())
                }
        except:
            pass
        return {
            'stock_quantity': 0,
            'stock_status': 'out_of_stock',
            'low_stock_threshold': 5,
            'last_updated': timezone.now()
        }
    
    @property
    def is_near_expiry(self):
        """Check if product expires within 3 months"""
        if not self.expiry_date:
            return False
        from datetime import timedelta
        three_months_from_now = timezone.now().date() + timedelta(days=90)
        return self.expiry_date <= three_months_from_now
    
    @property
    def expiry_status(self):
        """Get expiry status for display"""
        if not self.expiry_date:
            return 'no_expiry'
        from datetime import timedelta
        today = timezone.now().date()
        if self.expiry_date < today:
            return 'expired'
        days_until = (self.expiry_date - today).days
        if days_until <= 30:
            return 'critical'
        if days_until <= 90:
            return 'warning'
        return 'good'

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(max_length=50)
    color = models.CharField(max_length=50, blank=True)
    sku = models.CharField(max_length=50)
    additional_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['product', 'sku']
    
    def __str__(self):
        return f"{self.product.name} - {self.size} ({self.sku})"

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        return f"Image for {self.product.name}"
