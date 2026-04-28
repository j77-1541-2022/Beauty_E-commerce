from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from products.models import Product
from users.models import DealerProfile


class Forecast(models.Model):
    """Demand forecasting model using exponential smoothing"""
    FORECAST_PERIODS = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='dss_forecasts')
    dealer = models.ForeignKey(DealerProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='forecasts')
    period_type = models.CharField(max_length=20, choices=FORECAST_PERIODS, default='weekly')
    
    # Forecast data points
    historical_avg_demand = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    forecasted_demand = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    forecasted_demand_upper = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])  # 95% confidence
    forecasted_demand_lower = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    
    # Smoothing parameter
    alpha = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0.3'))  # Exponential smoothing parameter
    
    # Metrics
    mae = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Mean Absolute Error
    rmse = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Root Mean Squared Error
    
    # Timeline
    training_data_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = ['product', 'dealer', 'period_type']
        verbose_name_plural = 'Forecasts'
    
    def __str__(self):
        return f"Forecast: {self.product.name} ({self.period_type})"


class ABCAnalysis(models.Model):
    """ABC analysis for inventory classification"""
    CLASSIFICATION_CHOICES = [
        ('A', 'A - High Value (70% revenue, 20% items)'),
        ('B', 'B - Medium Value (20% revenue, 30% items)'),
        ('C', 'C - Low Value (10% revenue, 50% items)'),
    ]
    
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='abc_analysis')
    dealer = models.ForeignKey(DealerProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='abc_analyses')
    
    # Classification
    classification = models.CharField(max_length=1, choices=CLASSIFICATION_CHOICES)
    
    # Metrics (last 365 days)
    annual_demand = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    annual_consumption_value = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])  # demand * unit_cost
    
    # Reorder recommendations
    reorder_quantity = models.IntegerField(validators=[MinValueValidator(1)])
    reorder_point = models.IntegerField(validators=[MinValueValidator(1)])
    safety_stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    lead_time_days = models.IntegerField(default=7, validators=[MinValueValidator(1)])
    
    # Turnover metrics
    inventory_turnover = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    days_inventory_outstanding = models.IntegerField(validators=[MinValueValidator(1)])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['classification', '-annual_consumption_value']
        verbose_name_plural = 'ABC Analyses'
    
    def __str__(self):
        return f"{self.product.name} - {self.get_classification_display()}"


class InventoryAlert(models.Model):
    """Alert for inventory management"""
    ALERT_TYPES = [
        ('low_stock', 'Low Stock'),
        ('overstocked', 'Overstocked'),
        ('slow_moving', 'Slow Moving'),
        ('dead_stock', 'Dead Stock'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product.name}: {self.get_alert_type_display()}"
