from django.db import models
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from decimal import Decimal
from users.models import DealerProfile
from products.models import Product
from orders.models import Order, OrderItem
from inventory.models import Inventory
from datetime import timedelta


class DealerInventory(models.Model):
    """
    Dealer-specific inventory management
    Tracks per-product stock for each dealer
    """
    dealer = models.ForeignKey(DealerProfile, on_delete=models.CASCADE, related_name='inventories')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='dealer_inventories')
    stock_quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10)
    reorder_quantity = models.PositiveIntegerField(default=50)
    last_stock_update = models.DateTimeField(auto_now=True)
    last_reordered = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('dealer', 'product')
        verbose_name_plural = 'Dealer Inventories'
        ordering = ['product__name']
    
    def __str__(self):
        return f"{self.dealer.business_name} - {self.product.name} ({self.stock_quantity})"
    
    @property
    def is_low_stock(self):
        """Check if stock is below reorder level"""
        return self.stock_quantity <= self.reorder_level
    
    @property
    def stock_status(self):
        """Get current stock status"""
        if self.stock_quantity == 0:
            return 'out_of_stock'
        elif self.is_low_stock:
            return 'low_stock'
        else:
            return 'in_stock'
    
    def adjust_stock(self, quantity_change, reason=''):
        """Adjust stock quantity and create movement record"""
        old_quantity = self.stock_quantity
        self.stock_quantity = max(0, self.stock_quantity + quantity_change)
        self.save()
        
        DealerStockMovement.objects.create(
            dealer_inventory=self,
            movement_type='adjustment' if quantity_change > 0 else 'out',
            quantity=abs(quantity_change),
            quantity_before=old_quantity,
            quantity_after=self.stock_quantity,
            reason=reason
        )


class DealerStockMovement(models.Model):
    """
    Track all stock movements for dealer products
    """
    MOVEMENT_TYPES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('adjustment', 'Adjustment'),
        ('sale', 'Sale'),
        ('return', 'Return'),
        ('damage', 'Damaged'),
    ]
    
    dealer_inventory = models.ForeignKey(DealerInventory, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.PositiveIntegerField()
    quantity_before = models.PositiveIntegerField()
    quantity_after = models.PositiveIntegerField()
    reason = models.TextField(blank=True)
    reference = models.CharField(max_length=100, blank=True, help_text="Order ID, Invoice, etc.")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Dealer Stock Movement'
        verbose_name_plural = 'Dealer Stock Movements'
    
    def __str__(self):
        return f"{self.dealer_inventory.dealer.business_name} - {self.movement_type} ({self.quantity} units)"


class DealerSalesAnalytics(models.Model):
    """
    Daily sales analytics for dealers
    """
    dealer = models.ForeignKey(DealerProfile, on_delete=models.CASCADE, related_name='daily_analytics')
    date = models.DateField()
    total_orders = models.PositiveIntegerField(default=0)
    total_items_sold = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unique_customers = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('dealer', 'date')
        ordering = ['-date']
        verbose_name_plural = 'Dealer Sales Analytics'
    
    def __str__(self):
        return f"{self.dealer.business_name} - {self.date.strftime('%Y-%m-%d')}"
    
    @classmethod
    def calculate_daily_stats(cls, dealer, date=None):
        """Calculate and update daily statistics for a dealer"""
        if date is None:
            date = timezone.now().date()
        
        # Get dealer products
        dealer_products = dealer.products.all()
        
        # Get order items for this dealer on this date
        start = timezone.make_aware(timezone.datetime.combine(date, timezone.datetime.min.time()))
        end = start + timedelta(days=1)
        
        order_items = OrderItem.objects.filter(
            product__in=dealer_products,
            order__created_at__gte=start,
            order__created_at__lt=end
        )
        
        # Calculate metrics
        total_orders = Order.objects.filter(
            items__in=order_items,
            created_at__gte=start,
            created_at__lt=end
        ).distinct().count()
        
        total_items = order_items.aggregate(Sum('quantity'))['quantity__sum'] or 0
        total_revenue = order_items.aggregate(Sum(models.F('quantity') * models.F('price')))['quantity__price__sum'] or 0
        
        unique_customers = Order.objects.filter(
            items__in=order_items,
            created_at__gte=start,
            created_at__lt=end
        ).values('user').distinct().count()
        
        # Calculate profit (total selling price - cost price)
        total_profit = Decimal('0')
        for item in order_items:
            profit = (item.price - item.product.cost_price) * item.quantity
            total_profit += profit
        
        average_order_value = (total_revenue / total_orders) if total_orders > 0 else 0
        
        # Create or update analytics record
        analytics, created = cls.objects.update_or_create(
            dealer=dealer,
            date=date,
            defaults={
                'total_orders': total_orders,
                'total_items_sold': total_items,
                'total_revenue': total_revenue,
                'total_profit': total_profit,
                'average_order_value': average_order_value,
                'unique_customers': unique_customers,
            }
        )
        
        return analytics


class DealerReport(models.Model):
    """
    Generated reports for dealers with period-based analytics
    """
    REPORT_PERIODS = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    REPORT_STATUS = [
        ('draft', 'Draft'),
        ('generated', 'Generated'),
        ('archived', 'Archived'),
    ]
    
    dealer = models.ForeignKey(DealerProfile, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=REPORT_PERIODS)
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=20, choices=REPORT_STATUS, default='draft')
    
    # Key metrics
    total_orders = models.PositiveIntegerField(default=0)
    total_items_sold = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Inventory metrics
    current_inventory_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    low_stock_count = models.PositiveIntegerField(default=0)
    out_of_stock_count = models.PositiveIntegerField(default=0)
    
    # Customer metrics
    unique_customers = models.PositiveIntegerField(default=0)
    returning_customers = models.PositiveIntegerField(default=0)
    
    # Top performers
    top_products = models.JSONField(default=list)  # List of top 5 products with sales data
    
    generated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-period_end']
        verbose_name_plural = 'Dealer Reports'
    
    def __str__(self):
        return f"{self.dealer.business_name} - {self.get_report_type_display()} ({self.period_start})"
    
    @classmethod
    def generate_report(cls, dealer, report_type='monthly', period_start=None, period_end=None):
        """Generate a comprehensive report for a dealer"""
        if period_end is None:
            period_end = timezone.now().date()
        
        if period_start is None:
            if report_type == 'daily':
                period_start = period_end
            elif report_type == 'weekly':
                period_start = period_end - timedelta(days=7)
            elif report_type == 'monthly':
                period_start = period_end - timedelta(days=30)
            elif report_type == 'quarterly':
                period_start = period_end - timedelta(days=90)
            else:  # yearly
                period_start = period_end - timedelta(days=365)
        
        # Get dealer products
        dealer_products = dealer.products.all()
        
        # Calculate time range
        start_dt = timezone.make_aware(timezone.datetime.combine(period_start, timezone.datetime.min.time()))
        end_dt = timezone.make_aware(timezone.datetime.combine(period_end, timezone.datetime.max.time()))
        
        # Get relevant orders
        order_items = OrderItem.objects.filter(
            product__in=dealer_products,
            order__created_at__gte=start_dt,
            order__created_at__lte=end_dt
        )
        
        orders = Order.objects.filter(
            items__in=order_items,
            created_at__gte=start_dt,
            created_at__lte=end_dt
        ).distinct()
        
        # Calculate metrics
        total_orders = orders.count()
        total_items_sold = order_items.aggregate(Sum('quantity'))['quantity__sum'] or 0
        total_revenue = (order_items.aggregate(
            total=Sum(models.F('quantity') * models.F('price'), output_field=models.DecimalField())
        )['total'] or 0)
        
        # Calculate profit
        total_profit = Decimal('0')
        for item in order_items:
            profit = (item.price - item.product.cost_price) * item.quantity
            total_profit += profit
        
        average_order_value = (total_revenue / total_orders) if total_orders > 0 else 0
        
        # Inventory metrics
        dealer_inventories = DealerInventory.objects.filter(dealer=dealer)
        current_inventory_value = sum(
            inv.stock_quantity * inv.product.selling_price 
            for inv in dealer_inventories
        )
        low_stock_count = dealer_inventories.filter(models.Q(stock_quantity__lte=models.F('reorder_level'))).count()
        out_of_stock_count = dealer_inventories.filter(stock_quantity=0).count()
        
        # Customer metrics
        unique_customers = orders.values('user').distinct().count()
        
        # Top 5 products
        top_products_data = []
        top_products_qs = (
            order_items.values('product__id', 'product__name')
            .annotate(
                sold=Sum('quantity'),
                revenue=Sum(models.F('quantity') * models.F('price'), output_field=models.DecimalField())
            )
            .order_by('-sold')[:5]
        )
        for item in top_products_qs:
            top_products_data.append({
                'product_id': item['product__id'],
                'product_name': item['product__name'],
                'quantity_sold': item['sold'],
                'revenue': float(item['revenue'])
            })
        
        # Create report
        report = cls.objects.create(
            dealer=dealer,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            status='generated',
            total_orders=total_orders,
            total_items_sold=total_items_sold,
            total_revenue=total_revenue,
            total_profit=total_profit,
            average_order_value=average_order_value,
            current_inventory_value=current_inventory_value,
            low_stock_count=low_stock_count,
            out_of_stock_count=out_of_stock_count,
            unique_customers=unique_customers,
            top_products=top_products_data
        )
        
        return report


class DecisionSupportMetric(models.Model):
    """
    Strategic metrics to help dealers make business decisions
    """
    METRIC_TYPES = [
        ('demand_forecast', 'Demand Forecast'),
        ('inventory_turnover', 'Inventory Turnover Rate'),
        ('profit_margin', 'Profit Margin Analysis'),
        ('customer_trend', 'Customer Buying Trends'),
        ('seasonal_pattern', 'Seasonal Pattern'),
        ('bestseller_analysis', 'Bestseller Analysis'),
    ]
    
    dealer = models.ForeignKey(DealerProfile, on_delete=models.CASCADE, related_name='decision_metrics')
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPES)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    
    # Metric data
    metric_value = models.DecimalField(max_digits=10, decimal_places=2)
    metric_label = models.CharField(max_length=200)
    description = models.TextField()
    recommendation = models.TextField()
    
    # Comparison
    period_average = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    trend_direction = models.CharField(max_length=10, choices=[('up', 'Up'), ('down', 'Down'), ('stable', 'Stable')])
    
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-calculated_at']
        verbose_name_plural = 'Decision Support Metrics'
    
    def __str__(self):
        return f"{self.dealer.business_name} - {self.get_metric_type_display()}"
    
    @classmethod
    def calculate_all_metrics(cls, dealer):
        """Calculate all decision support metrics for a dealer"""
        # Get dealer data from last 30 days
        period_start = timezone.now() - timedelta(days=30)
        
        dealer_products = dealer.products.all()
        order_items = OrderItem.objects.filter(
            product__in=dealer_products,
            order__created_at__gte=period_start
        )
        
        # 1. Inventory Turnover per product
        for product in dealer_products:
            product_items = order_items.filter(product=product)
            if product_items.exists():
                items_sold = product_items.aggregate(Sum('quantity'))['quantity__sum'] or 0
                try:
                    inv = DealerInventory.objects.get(dealer=dealer, product=product)
                    turnover_rate = (items_sold / inv.stock_quantity * 100) if inv.stock_quantity > 0 else 0
                    
                    cls.objects.update_or_create(
                        dealer=dealer,
                        metric_type='inventory_turnover',
                        product=product,
                        defaults={
                            'metric_value': Decimal(str(turnover_rate)),
                            'metric_label': f'{product.name} - {items_sold} units sold',
                            'description': f'Product has turned over {items_sold} times in the last 30 days',
                            'recommendation': 'High turnover shows strong demand. Consider increasing stock.' if turnover_rate > 50 else 'Low turnover. Review pricing or promotion strategy.',
                            'trend_direction': 'up' if turnover_rate > 50 else 'down'
                        }
                    )
                except DealerInventory.DoesNotExist:
                    pass
        
        # 2. Profit margin analysis
        if order_items.exists():
            total_selling = 0
            total_cost = 0
            for item in order_items:
                total_selling += item.price * item.quantity
                total_cost += item.product.cost_price * item.quantity
            
            if total_selling > 0:
                margin = ((total_selling - total_cost) / total_selling * 100)
                cls.objects.update_or_create(
                    dealer=dealer,
                    metric_type='profit_margin',
                    defaults={
                        'metric_value': Decimal(str(margin)),
                        'metric_label': f'Overall Profit Margin: {margin:.1f}%',
                        'description': f'Last 30 days profit margin analysis',
                        'recommendation': 'Healthy margin. Continue current pricing strategy.' if margin > 30 else 'Low margin. Review costs and pricing.',
                        'trend_direction': 'up'
                    }
                )
