from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import math
from decimal import Decimal
from django.db.models import Sum

from orders.models import OrderItem
from products.models import Product
from analytics.models import Forecast, ABCResult
from inventory.models import Inventory


class Command(BaseCommand):
    help = 'Train DSS with 365-day sales data, exponential smoothing, and ABC classification'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=365,
            help='Number of days to look back for training data',
        )
        parser.add_argument(
            '--alpha',
            type=float,
            default=0.3,
            help='Exponential smoothing alpha (0-1)',
        )

    def handle(self, *args, **options):
        days = options['days']
        alpha = max(0.0, min(1.0, options['alpha']))

        self.stdout.write(self.style.SUCCESS(f'Starting DSS training ({days} days, alpha={alpha})'))

        # 1. Collect sales history (all products, last 365 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)

        products = Product.objects.filter(is_active=True)
        self.stdout.write(f'Found {products.count()} products')

        for product in products:
            try:
                daily_sales_list = []
                current = start_date.date()
                while current <= end_date.date():
                    day_start = timezone.make_aware(
                        timezone.datetime.combine(current, timezone.datetime.min.time())
                    )
                    day_end = day_start + timedelta(days=1)

                    qty = OrderItem.objects.filter(
                        product=product,
                        order__created_at__gte=day_start,
                        order__created_at__lt=day_end,
                        order__status__in=['completed', 'shipped', 'delivered'],
                    ).aggregate(total=Sum('quantity'))['total'] or 0

                    daily_sales_list.append({'date': current, 'qty': int(qty)})
                    current += timedelta(days=1)

                # 2. Exponential smoothing forecast
                if daily_sales_list:
                    smoothed = daily_sales_list[0]['qty']
                    for i, day in enumerate(daily_sales_list[1:], start=1):
                        smoothed = alpha * day['qty'] + (1 - alpha) * smoothed
                        daily_sales_list[i]['forecast'] = smoothed

                    last_date = daily_sales_list[-1]['date']
                    for future_days in range(1, 31):
                        forecast_date = last_date + timedelta(days=future_days)
                        current_forecast = smoothed
                        smoothed = alpha * smoothed + (1 - alpha) * current_forecast

                        Forecast.objects.update_or_create(
                            product=product,
                            forecast_date=forecast_date,
                            defaults={
                                'forecast_quantity': round(current_forecast, 2),
                                'alpha': round(alpha, 2),
                            },
                        )

                # 3. ABC classification (last 365 days)
                total_qty = sum(d['qty'] for d in daily_sales_list)
                total_value = sum(d['qty'] * (product.cost_price or 0) for d in daily_sales_list)

                # Collect all products with sales for ranking
                all_product_values = []
                for p in products:
                    p_qty = OrderItem.objects.filter(
                        product=p,
                        order__created_at__gte=start_date,
                        order__created_at__lt=end_date,
                        order__status__in=['completed', 'shipped', 'delivered'],
                    ).aggregate(total=Sum('quantity'))['total'] or 0

                    p_value = p_qty * (p.cost_price or 0)
                    all_product_values.append({'product': p, 'value': Decimal(str(p_value))})

                all_product_values.sort(key=lambda x: x['value'], reverse=True)
                portfolio_total = sum(x['value'] for x in all_product_values)
                cumulative = 0
                for item in all_product_values:
                    cumulative += item['value']
                    pct = (cumulative / portfolio_total * 100) if portfolio_total > 0 else 0
                    classification = 'A' if pct <= 80 else ('B' if pct <= 95 else 'C')

                    if item['product'].id == product.id:
                        ABCResult.objects.update_or_create(
                            product=product,
                            period_start=start_date.date(),
                            period_end=end_date.date(),
                            defaults={
                                'classification': classification,
                                'sales_value': Decimal(str(total_value)),
                                'cumulative_percentage': Decimal(str(round(pct, 2))),
                            },
                        )
                        break

                self.stdout.write(f'  [OK] {product.name}')

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  [ERROR] {product.name}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS('DSS training complete'))
