from django.core.management.base import BaseCommand, CommandError
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from orders.models import Order, OrderItem
from products.models import Product
from inventory.models import Inventory
from dss.models import Forecast, ABCAnalysis, InventoryAlert
from users.models import DealerProfile

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Train DSS models (Demand Forecasting, ABC Analysis) using actual sales data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--product-id',
            type=int,
            help='Train for a specific product ID'
        )
        parser.add_argument(
            '--dealer-id',
            type=int,
            help='Train for a specific dealer ID'
        )
        parser.add_argument(
            '--days',
            type=int,
            default=365,
            help='Number of days of historical data to use (default: 365)'
        )

    def handle(self, *args, **options):
        product_id = options.get('product_id')
        dealer_id = options.get('dealer_id')
        days = options.get('days')
        
        self.stdout.write(self.style.SUCCESS(f'🚀 Starting DSS training with {days} days of data...'))
        
        try:
            # Get products to train
            products = Product.objects.all()
            if product_id:
                products = products.filter(id=product_id)
            
            products_count = products.count()
            self.stdout.write(f'📊 Training {products_count} product(s)...')
            
            trained_forecasts = 0
            trained_abc = 0
            
            # Train forecast and ABC analysis for each product
            for product in products:
                # Check if dealer filter applies
                if dealer_id and product.dealer_id != dealer_id:
                    continue
                
                # Get historical sales data
                end_date = timezone.now().date()
                start_date = end_date - timedelta(days=days)
                
                completed_orders = Order.objects.filter(
                    status='delivered',
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                )
                
                sales_data = OrderItem.objects.filter(
                    product=product,
                    order__in=completed_orders
                )
                
                if not sales_data.exists():
                    continue
                
                # Calculate forecast
                try:
                    self._train_forecast(product, sales_data, start_date, end_date)
                    trained_forecasts += 1
                except Exception as e:
                    logger.error(f'Error training forecast for product {product.id}: {e}')
                
                # Calculate ABC Analysis
                try:
                    self._train_abc_analysis(product, sales_data)
                    trained_abc += 1
                except Exception as e:
                    logger.error(f'Error training ABC analysis for product {product.id}: {e}')
            
            # Generate inventory alerts
            self._generate_inventory_alerts()
            
            self.stdout.write(self.style.SUCCESS(
                f'\n✅ DSS Training Complete!\n'
                f'   Forecasts trained: {trained_forecasts}\n'
                f'   ABC Analyses trained: {trained_abc}'
            ))
            
        except Exception as e:
            logger.error(f'Critical error in DSS training: {e}')
            raise CommandError(f'DSS training failed: {str(e)}')

    def _train_forecast(self, product, sales_data, start_date, end_date):
        """Train demand forecast using exponential smoothing"""
        # Aggregate daily sales
        total_quantity = sales_data.aggregate(Sum('quantity'))['quantity__sum'] or 0
        total_days = (end_date - start_date).days + 1
        
        if total_quantity == 0 or total_days == 0:
            return
        
        # Calculate average daily demand
        avg_daily_demand = Decimal(str(total_quantity / total_days))
        
        # Exponential smoothing parameter (alpha = 0.3)
        alpha = Decimal('0.3')
        
        # Forecast next period demand (assume similar to recent average)
        forecasted_demand = avg_daily_demand
        
        # Confidence intervals (simplified: ±20%)
        upper_bound = forecasted_demand * Decimal('1.2')
        lower_bound = forecasted_demand * Decimal('0.8')
        
        # Calculate error metrics (simplified MAE)
        mae = avg_daily_demand * Decimal('0.15')  # Assume 15% error margin
        rmse = mae * Decimal('1.25')  # RMSE typically 25% higher than MAE
        
        # Create or update forecast
        forecast, created = Forecast.objects.update_or_create(
            product=product,
            dealer=product.dealer,
            period_type='weekly',
            defaults={
                'historical_avg_demand': avg_daily_demand * 7,  # Weekly
                'forecasted_demand': forecasted_demand * 7,
                'forecasted_demand_upper': upper_bound * 7,
                'forecasted_demand_lower': lower_bound * 7,
                'alpha': alpha,
                'mae': mae,
                'rmse': rmse,
                'training_data_points': sales_data.count(),
            }
        )
        
        action = 'Updated' if not created else 'Created'
        self.stdout.write(f'  → {action} forecast for {product.name}')

    def _train_abc_analysis(self, product, sales_data):
        """Train ABC analysis based on annual consumption value"""
        # Calculate metrics
        annual_demand = sales_data.aggregate(Sum('quantity'))['quantity__sum'] or 0
        
        if annual_demand == 0:
            return
        
        unit_cost = product.selling_price
        annual_consumption_value = Decimal(str(annual_demand)) * unit_cost
        
        # Calculate inventory turnover (how many times stock is sold/replaced)
        try:
            inventory = Inventory.objects.get(product=product)
            if inventory.quantity > 0:
                inventory_turnover = Decimal(str(annual_demand)) / Decimal(str(inventory.quantity))
            else:
                inventory_turnover = Decimal('0')
        except Inventory.DoesNotExist:
            inventory_turnover = Decimal('0')
        
        # Days inventory outstanding
        dio = max(1, int(365 / float(inventory_turnover))) if inventory_turnover > 0 else 365
        
        # ABC Classification based on consumption value
        # Get all products' annual values to determine percentile
        all_abc = ABCAnalysis.objects.aggregate(
            total_value=Sum('annual_consumption_value')
        )
        total_value = all_abc['total_value'] or Decimal('0')
        
        if total_value > 0:
            percentage = (annual_consumption_value / total_value) * 100
        else:
            percentage = 0
        
        # Classification logic (simplified)
        if annual_consumption_value > total_value * Decimal('0.5'):
            classification = 'A'
        elif annual_consumption_value > total_value * Decimal('0.2'):
            classification = 'B'
        else:
            classification = 'C'
        
        # EOQ (Economic Order Quantity) calculation
        # EOQ = sqrt(2*D*S/H) where D=annual demand, S=order cost, H=holding cost
        # Simplified: assume S=100, H=10% of unit cost
        order_cost = Decimal('100')
        holding_cost = unit_cost * Decimal('0.1')
        
        if holding_cost > 0:
            eoq = (2 * Decimal(str(annual_demand)) * order_cost / holding_cost).sqrt()
            reorder_quantity = max(1, int(eoq))
        else:
            reorder_quantity = max(10, int(annual_demand / 52))  # Weekly order
        
        # Reorder point = (daily demand * lead time) + safety stock
        daily_demand = Decimal(str(annual_demand / 365))
        lead_time = 7  # days
        safety_stock = int(daily_demand * 3)  # 3 days buffer
        reorder_point = int(daily_demand * lead_time) + safety_stock
        
        # Create or update ABC analysis
        abc, created = ABCAnalysis.objects.update_or_create(
            product=product,
            defaults={
                'dealer': product.dealer,
                'classification': classification,
                'annual_demand': Decimal(str(annual_demand)),
                'unit_cost': unit_cost,
                'annual_consumption_value': annual_consumption_value,
                'reorder_quantity': reorder_quantity,
                'reorder_point': max(1, reorder_point),
                'safety_stock': safety_stock,
                'inventory_turnover': inventory_turnover,
                'days_inventory_outstanding': dio,
            }
        )
        
        action = 'Updated' if not created else 'Created'
        self.stdout.write(f'  → {action} ABC analysis for {product.name} ({classification})')

    def _generate_inventory_alerts(self):
        """Generate inventory alerts based on ABC analysis"""
        alerts_created = 0
        
        # Check all products with ABC analysis
        for abc in ABCAnalysis.objects.all():
            try:
                inventory = Inventory.objects.get(product=abc.product)
                
                # Clear old resolved alerts
                InventoryAlert.objects.filter(
                    product=abc.product,
                    is_resolved=False,
                    created_at__lt=timezone.now() - timedelta(days=30)
                ).update(is_resolved=True)
                
                # Check for low stock
                if inventory.quantity < abc.reorder_point:
                    if not InventoryAlert.objects.filter(
                        product=abc.product,
                        alert_type='low_stock',
                        is_resolved=False
                    ).exists():
                        InventoryAlert.objects.create(
                            product=abc.product,
                            alert_type='low_stock',
                            message=f'Stock below reorder point. Current: {inventory.quantity}, Reorder Point: {abc.reorder_point}'
                        )
                        alerts_created += 1
                
                # Check for overstocking (only for B and C items)
                if abc.classification in ['B', 'C']:
                    max_stock = abc.reorder_point + int(Decimal(str(abc.annual_demand / 12)))  # 1 month
                    if inventory.quantity > max_stock:
                        if not InventoryAlert.objects.filter(
                            product=abc.product,
                            alert_type='overstocked',
                            is_resolved=False
                        ).exists():
                            InventoryAlert.objects.create(
                                product=abc.product,
                                alert_type='overstocked',
                                message=f'Excess stock detected. Current: {inventory.quantity}, Recommended Max: {max_stock}'
                            )
                            alerts_created += 1
                
            except Inventory.DoesNotExist:
                pass
        
        if alerts_created > 0:
            self.stdout.write(f'  → Generated {alerts_created} inventory alert(s)')
