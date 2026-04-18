from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from products.models import Product

class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='inventory')
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    reorder_level = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    reorder_quantity = models.IntegerField(default=50, validators=[MinValueValidator(0)])
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    last_stock_update = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Inventory"
        ordering = ['product__name']
    
    def __str__(self):
        return f"{self.product.name} - {self.quantity} units"
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level
    
    @property
    def stock_status(self):
        if self.quantity == 0:
            return 'out_of_stock'
        elif self.is_low_stock:
            return 'low_stock'
        else:
            return 'in_stock'

class StockMovement(models.Model):
    """
    Inventory Movement Log - Section E4
    Tracks all inventory changes with before/after quantities.
    """
    MOVEMENT_TYPES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
        ('return', 'Return'),
        ('sale', 'Sale'),
    ]
    
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    quantity_before = models.IntegerField(null=True, blank=True, help_text="Stock level before this movement")
    quantity_after = models.IntegerField(null=True, blank=True, help_text="Stock level after this movement")
    reference = models.CharField(max_length=100, blank=True, help_text="Order ID, Invoice #, etc.")
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Inventory Movement'
        verbose_name_plural = 'Inventory Movements'
    
    def __str__(self):
        return f"{self.movement_type} - {abs(self.quantity)} units of {self.inventory.product.name}"

class StockAlert(models.Model):
    ALERT_TYPES = [
        ('low_stock', 'Low Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('overstock', 'Overstock'),
    ]
    
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.alert_type} - {self.inventory.product.name}"
