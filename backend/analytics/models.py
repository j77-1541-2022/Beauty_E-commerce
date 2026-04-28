from django.db import models
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

class SalesAnalytics(models.Model):
    date = models.DateField()
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.IntegerField(default=0)
    total_products_sold = models.IntegerField(default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ['date']
        ordering = ['-date']
    
    def __str__(self):
        return f"Sales Analytics - {self.date}"

class ProductAnalytics(models.Model):
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE, related_name='analytics')
    total_sold = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_daily_sales = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_revenue']
    
    def __str__(self):
        return f"Analytics - {self.product.name}"

class InventoryInsight(models.Model):
    INSIGHT_TYPES = [
        ('low_stock', 'Low Stock Alert'),
        ('out_of_stock', 'Out of Stock Alert'),
        ('overstock', 'Overstock Alert'),
        ('slow_moving', 'Slow Moving Product'),
        ('fast_moving', 'Fast Moving Product'),
        ('reorder_recommendation', 'Reorder Recommendation'),
    ]
    
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='insights')
    insight_type = models.CharField(max_length=30, choices=INSIGHT_TYPES)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.insight_type} - {self.product.name}"


class Forecast(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='forecasts')
    forecast_date = models.DateField()
    forecast_quantity = models.DecimalField(max_digits=12, decimal_places=2)
    alpha = models.DecimalField(max_digits=4, decimal_places=2, default=0.30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['product', 'forecast_date']
        ordering = ['-forecast_date']

    def __str__(self):
        return f"Forecast {self.product.name} - {self.forecast_date}"


class ABCResult(models.Model):
    CLASS_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
    ]

    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='abc_results')
    classification = models.CharField(max_length=1, choices=CLASS_CHOICES)
    sales_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cumulative_percentage = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    period_start = models.DateField()
    period_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"ABC {self.product.name} - {self.classification}"
