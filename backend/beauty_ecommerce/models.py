from django.db import models
from django.contrib.auth.models import User

class Dealer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    business_name = models.CharField(max_length=200)
    business_license = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.business_name

class Product(models.Model):
    DEALER_CHOICES = [
        ('individual', 'Individual Seller'),
        ('company', 'Company'),
        ('distributor', 'Distributor'),
    ]
    
    STOCK_STATUS_CHOICES = [
        ('in_stock', 'In Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('low_stock', 'Low Stock'),
        ('discontinued', 'Discontinued'),
    ]
    
    CATEGORY_CHOICES = [
        ('skincare', 'Skincare'),
        ('makeup', 'Makeup'),
        ('bodycare', 'Body Care'),
        ('haircare', 'Hair Care'),
        ('treatment', 'Treatment'),
        ('fragrance', 'Fragrance'),
    ]
    
    # Basic Product Information
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    brand = models.CharField(max_length=100)
    
    # Pricing (in KSH - Kenyan Shillings)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount_percentage = models.IntegerField(default=0)
    
    # Inventory Management (Single Source of Truth)
    stock_quantity = models.IntegerField(default=0)
    stock_status = models.CharField(
        max_length=20, 
        choices=STOCK_STATUS_CHOICES, 
        default='out_of_stock'
    )
    low_stock_threshold = models.IntegerField(default=5)
    reorder_level = models.IntegerField(default=10)
    
    # Dealer Information
    dealer_type = models.CharField(max_length=20, choices=DEALER_CHOICES, default='individual')
    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, null=True, blank=True)
    
    # Product Visibility Control
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Media
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    additional_images = models.JSONField(default=list, blank=True)
    
    # Metadata
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, blank=True)
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    dimensions = models.CharField(max_length=100, blank=True)
    
    # Timestamps for Real-time Updates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_stock_update = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stock_status']),
            models.Index(fields=['is_active']),
            models.Index(fields=['category']),
            models.Index(fields=['dealer']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_stock_status_display()})"
    
    @property
    def current_price(self):
        """Calculate current price with discount"""
        if self.discount_percentage > 0:
            return self.price * (1 - self.discount_percentage / 100)
        return self.price
    
    @property
    def is_available_for_customers(self):
        """Check if product should be visible to customers"""
        return (
            self.is_active and 
            self.stock_status == 'in_stock' and 
            self.stock_quantity > 0
        )
    
    @property
    def stock_level_percentage(self):
        """Calculate stock level as percentage"""
        if self.reorder_level == 0:
            return 100
        return min(100, (self.stock_quantity / self.reorder_level) * 100)
    
    def update_stock_status(self):
        """Automatically update stock status based on quantity"""
        if self.stock_quantity <= 0:
            self.stock_status = 'out_of_stock'
        elif self.stock_quantity <= self.low_stock_threshold:
            self.stock_status = 'low_stock'
        else:
            self.stock_status = 'in_stock'
        self.save(update_fields=['stock_status', 'last_stock_update'])

class StockMovement(models.Model):
    """Track all stock movements for audit trail"""
    MOVEMENT_TYPES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Stock Adjustment'),
        ('return', 'Customer Return'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    previous_quantity = models.IntegerField()
    new_quantity = models.IntegerField()
    reason = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.get_movement_type_display()}"

class ProductReview(models.Model):
    """Customer product reviews"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['product', 'customer']
    
    def __str__(self):
        return f"{self.product.name} - {self.rating} stars"

class CustomerWishlist(models.Model):
    """Customer wishlist items"""
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-added_at']
        unique_together = ['customer', 'product']
    
    def __str__(self):
        return f"{self.customer.username} - {self.product.name}"
