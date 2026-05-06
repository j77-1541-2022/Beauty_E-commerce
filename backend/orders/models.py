from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from products.models import Product

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Payment Received'),
        ('approval_pending', 'Awaiting Approval'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    SHIPPING_ZONE_CHOICES = [
        ('nairobi_cbd', 'Nairobi (CBD)'),
        ('nairobi_other', 'Nairobi (Other)'),
        ('machakos', 'Machakos Town'),
        ('athi_river', 'Athi River'),
        ('other', 'Other Locations'),
    ]
    
    order_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True)
    shipping_address = models.TextField()
    shipping_zone = models.CharField(max_length=20, choices=SHIPPING_ZONE_CHOICES, default='nairobi_cbd')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_by_customer = models.BooleanField(default=False, help_text="True if customer deleted this order from their view")
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_number} - {self.customer_name}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            try:
                last_order = Order.objects.all().order_by('id').last()
                if last_order:
                    # Try to extract number from existing order number
                    try:
                        order_num = int(last_order.order_number[3:]) + 1
                    except (ValueError, IndexError):
                        # If order number format is unexpected, use default
                        order_num = 1001
                else:
                    order_num = 1001
                self.order_number = f"ORD{order_num}"
            except Exception:
                # Fallback to UUID-based order number if there's any error
                import uuid
                self.order_number = f"ORD{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        unique_together = ['order', 'product']
    
    def __str__(self):
        return f"{self.product.name} - {self.quantity} units"
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    changed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"Order {self.order.order_number} - {self.old_status} to {self.new_status}"
