
# ================= SECTION C: CSV EXPORT ENDPOINT =================
import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

class ExportInventoryCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Export any inventory report as CSV"""
        report_type = request.query_params.get('report', 'status')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = (
            f'attachment; filename="glow_beyond_{report_type}_report.csv"'
        )
        writer = csv.writer(response)
        if report_type == 'status':
            writer.writerow([
                'Product Name', 'SKU', 'Category', 'Current Stock',
                'Reorder Level', 'Status', 'Unit Price (KSH)', 
                'Stock Value (KSH)', 'Days of Stock', 'Units Sold (30d)'
            ])
            status_view = InventoryStatusReportView()
            data = status_view.get(request).data['data']['products']
            for row in data:
                writer.writerow([
                    row['product_name'], row['sku'], row['category'],
                    row['current_stock'], row['reorder_level'],
                    row['status'], row['unit_price_ksh'],
                    row['stock_value_ksh'], row['days_of_stock'],
                    row['units_sold_30d']
                ])
        elif report_type == 'low_stock':
            writer.writerow([
                'Product Name', 'SKU', 'Category', 'Current Stock',
                'Reorder Level', 'Urgency', 'Days Until Stockout',
                'Recommended Reorder Qty', 'Estimated Cost (KSH)'
            ])
            low_view = LowStockReportView()
            data = low_view.get(request).data['data']['items']
            for row in data:
                writer.writerow([
                    row['product_name'], row['sku'], row['category'],
                    row['current_stock'], row['reorder_level'],
                    row['urgency'], row['days_until_stockout'],
                    row['recommended_reorder_qty'], row['estimated_reorder_cost_ksh']
                ])
        elif report_type == 'movement':
            writer.writerow([
                'Date', 'Product Name', 'SKU', 'Transaction Type',
                'Quantity Change', 'Previous Stock', 'New Stock', 'Notes'
            ])
            move_view = StockMovementReportView()
            data = move_view.get(request).data['data']['movements']
            for row in data:
                writer.writerow([
                    row['created_at_display'], row['product_name'],
                    row['sku'], row['transaction_type_display'],
                    row['quantity_change'], row['previous_stock'],
                    row['new_stock'], row['notes']
                ])
        elif report_type == 'valuation':
            writer.writerow([
                'Product Name', 'SKU', 'Category', 'Unit Price (KSH)',
                'Units in Stock', 'Total Value (KSH)', '% of Total Portfolio'
            ])
            val_view = InventoryValuationReportView()
            data = val_view.get(request).data['data']['by_product']
            for row in data:
                writer.writerow([
                    row['product_name'], row['sku'], row['category'],
                    row['unit_price_ksh'], row['units_in_stock'],
                    row['total_value_ksh'], row['percentage_of_total']
                ])
        return response
# ================= SECTION B: DSS DECISION SUPPORT SYSTEM ENDPOINTS =================

class ABCAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        FR6 — DSS: ABC Analysis
        Classifies products by revenue contribution (Pareto principle).
        """
        from products.models import Product
        from orders.models import OrderItem
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Sum, F, FloatField, ExpressionWrapper

        user = request.user
        if hasattr(user, 'role') and user.role == 'dealer':
            try:
                dealer_profile = user.dealerprofile
                products = Product.objects.filter(dealer=dealer_profile)
            except:
                products = Product.objects.filter(added_by=user)
        else:
            products = Product.objects.all()

        ninety_days_ago = timezone.now() - timedelta(days=90)
        product_revenues = []
        for product in products:
            revenue = OrderItem.objects.filter(
                product=product,
                order__created_at__gte=ninety_days_ago,
                order__status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).aggregate(
                total_revenue=Sum(
                    ExpressionWrapper(
                        F('quantity') * F('unit_price'),
                        output_field=FloatField()
                    )
                ),
                total_units=Sum('quantity')
            )
            total_rev = float(revenue['total_revenue'] or 0)
            total_units = int(revenue['total_units'] or 0)
            try:
                current_stock = product.inventoryitem.quantity
            except:
                current_stock = getattr(product, 'stock_quantity', getattr(product, 'current_stock', 0))
            product_revenues.append({
                'product_id': product.id,
                'product_name': product.name,
                'sku': getattr(product, 'sku', f'SKU-{product.id}'),
                'category': product.category.name if product.category else 'N/A',
                'revenue_90d': total_rev,
                'units_sold_90d': total_units,
                'current_stock': current_stock,
                'unit_price': float(getattr(product, 'price', 0)),
            })
        product_revenues.sort(key=lambda x: x['revenue_90d'], reverse=True)
        total_revenue = sum(p['revenue_90d'] for p in product_revenues)
        if total_revenue == 0:
            for p in product_revenues:
                p['revenue_90d'] = p['current_stock'] * p['unit_price']
            product_revenues.sort(key=lambda x: x['revenue_90d'], reverse=True)
            total_revenue = sum(p['revenue_90d'] for p in product_revenues)
        cumulative = 0
        for p in product_revenues:
            p['revenue_percentage'] = round((p['revenue_90d'] / total_revenue * 100) if total_revenue > 0 else 0, 2)
            cumulative += p['revenue_percentage']
            p['cumulative_percentage'] = round(cumulative, 2)
            if cumulative <= 70:
                p['abc_class'] = 'A'
                p['abc_description'] = 'High Value — Manage closely, maintain stock'
                p['management_action'] = 'Priority stock monitoring and frequent reordering'
            elif cumulative <= 90:
                p['abc_class'] = 'B'
                p['abc_description'] = 'Medium Value — Regular monitoring'
                p['management_action'] = 'Standard reorder process with periodic review'
            else:
                p['abc_class'] = 'C'
                p['abc_description'] = 'Low Value — Minimal stock, consider discontinuing'
                p['management_action'] = 'Reduce stock levels, evaluate profitability'
        a_products = [p for p in product_revenues if p['abc_class'] == 'A']
        b_products = [p for p in product_revenues if p['abc_class'] == 'B']
        c_products = [p for p in product_revenues if p['abc_class'] == 'C']
        pareto_data = [
            {
                'name': p['product_name'][:20],
                'revenue': round(p['revenue_90d'], 2),
                'cumulative': p['cumulative_percentage'],
                'class': p['abc_class'],
            }
            for p in product_revenues[:20]
        ]
        return Response({
            'success': True,
            'data': {
                'summary': {
                    'total_products': len(product_revenues),
                    'total_revenue_90d': round(total_revenue, 2),
                    'class_a': {
                        'count': len(a_products),
                        'percentage_of_products': round(len(a_products)/len(product_revenues)*100, 1) if product_revenues else 0,
                        'percentage_of_revenue': 70,
                    },
                    'class_b': {
                        'count': len(b_products),
                        'percentage_of_products': round(len(b_products)/len(product_revenues)*100, 1) if product_revenues else 0,
                        'percentage_of_revenue': 20,
                    },
                    'class_c': {
                        'count': len(c_products),
                        'percentage_of_products': round(len(c_products)/len(product_revenues)*100, 1) if product_revenues else 0,
                        'percentage_of_revenue': 10,
                    },
                },
                'pareto_chart': pareto_data,
                'products': product_revenues,
            }
        })

class EOQCalculatorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        FR6 — DSS: Economic Order Quantity Calculator
        GET: returns EOQ suggestions for all dealer products
        """
        from products.models import Product
        from orders.models import OrderItem
        from django.utils import timezone
        from datetime import timedelta
        import math
        ordering_cost = float(request.query_params.get('ordering_cost', 500))
        holding_cost_rate = float(request.query_params.get('holding_cost_percent', 20)) / 100
        lead_time_days = int(request.query_params.get('lead_time', 7))
        safety_days = int(request.query_params.get('safety_days', 3))
        user = request.user
        if hasattr(user, 'role') and user.role == 'dealer':
            try:
                dealer_profile = user.dealerprofile
                products = Product.objects.filter(dealer=dealer_profile)
            except:
                products = Product.objects.filter(added_by=user)
        else:
            products = Product.objects.all()
        one_year_ago = timezone.now() - timedelta(days=365)
        eoq_results = []
        for product in products:
            price = float(getattr(product, 'price', 0))
            if price == 0:
                continue
            annual_demand = OrderItem.objects.filter(
                product=product,
                order__created_at__gte=one_year_ago,
                order__status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).aggregate(total=Sum('quantity'))['total'] or 0
            if annual_demand == 0:
                annual_demand = max(getattr(product, 'stock_quantity', getattr(product, 'current_stock', 0)) * 2, 12)
                data_source = 'estimated'
            else:
                data_source = 'historical'
            holding_cost_per_unit = price * holding_cost_rate
            if holding_cost_per_unit > 0:
                eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit)
            else:
                eoq = annual_demand / 12
            eoq = round(eoq)
            orders_per_year = round(annual_demand / eoq, 1) if eoq > 0 else 0
            total_ordering_cost = orders_per_year * ordering_cost
            total_holding_cost = (eoq / 2) * holding_cost_per_unit
            total_annual_cost = total_ordering_cost + total_holding_cost
            daily_demand = annual_demand / 365
            safety_stock = round(daily_demand * safety_days)
            reorder_point = round(daily_demand * lead_time_days) + safety_stock
            try:
                current_stock = product.inventoryitem.quantity
            except:
                current_stock = getattr(product, 'stock_quantity', getattr(product, 'current_stock', 0))
            eoq_results.append({
                'product_id': product.id,
                'product_name': product.name,
                'sku': getattr(product, 'sku', f'SKU-{product.id}'),
                'annual_demand': annual_demand,
                'data_source': data_source,
                'unit_price_ksh': price,
                'ordering_cost_ksh': ordering_cost,
                'holding_cost_rate': holding_cost_rate,
                'holding_cost_per_unit_ksh': round(holding_cost_per_unit, 2),
                'eoq': eoq,
                'orders_per_year': orders_per_year,
                'reorder_point': reorder_point,
                'safety_stock': safety_stock,
                'current_stock': current_stock,
                'should_reorder_now': current_stock <= reorder_point,
                'total_annual_cost_ksh': round(total_annual_cost, 2),
                'cost_breakdown': {
                    'ordering_cost_ksh': round(total_ordering_cost, 2),
                    'holding_cost_ksh': round(total_holding_cost, 2),
                }
            })
        eoq_results.sort(key=lambda x: x['should_reorder_now'], reverse=True)
        return Response({
            'success': True,
            'data': {
                'parameters_used': {
                    'ordering_cost_ksh': ordering_cost,
                    'holding_cost_rate_percent': holding_cost_rate * 100,
                    'lead_time_days': 7,
                },
                'products': eoq_results,
                'formula_explanation': {
                    'eoq': 'sqrt(2 × Annual Demand × Ordering Cost / Holding Cost per Unit)',
                    'reorder_point': 'Daily Demand × Lead Time Days + Safety Stock',
                    'safety_stock': 'Daily Demand × 3 days buffer',
                }
            }
        })

class ReorderRecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        FR6 — DSS: Reorder Recommendations
        Combines low-stock, EOQ, and demand forecast into actionable prioritised reorder list.
        """
        from products.models import Product
        from orders.models import OrderItem
        from django.utils import timezone
        from datetime import timedelta
        import math
        user = request.user
        if hasattr(user, 'role') and user.role == 'dealer':
            try:
                dealer_profile = user.dealerprofile
                products = Product.objects.filter(dealer=dealer_profile)
            except:
                products = Product.objects.filter(added_by=user)
        else:
            products = Product.objects.all()
        thirty_days_ago = timezone.now() - timedelta(days=30)
        year_ago = timezone.now() - timedelta(days=365)
        ordering_cost = 500
        holding_rate = 0.25
        recommendations = []
        for product in products:
            price = float(getattr(product, 'price', 0))
            try:
                current_stock = product.inventoryitem.quantity
                reorder_level = getattr(product.inventoryitem, 'reorder_level', 10)
            except:
                current_stock = getattr(product, 'stock_quantity', getattr(product, 'current_stock', 0))
                reorder_level = getattr(product, 'reorder_level', 10)
            sales_30d = OrderItem.objects.filter(
                product=product,
                order__created_at__gte=thirty_days_ago,
                order__status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).aggregate(total=Sum('quantity'))['total'] or 0
            annual_demand = OrderItem.objects.filter(
                product=product,
                order__created_at__gte=year_ago,
                order__status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).aggregate(total=Sum('quantity'))['total'] or max(sales_30d * 12, 12)
            avg_daily = sales_30d / 30
            days_until_stockout = (
                round(current_stock / avg_daily) 
                if avg_daily > 0 and current_stock > 0 
                else (0 if current_stock == 0 else 999)
            )
            holding_cost = price * holding_rate
            if holding_cost > 0 and annual_demand > 0:
                eoq = round(math.sqrt((2 * annual_demand * ordering_cost) / holding_cost))
            else:
                eoq = max(round(avg_daily * 30), reorder_level * 2)
            recommended_qty = max(eoq, reorder_level * 2)
            cost_to_reorder = recommended_qty * price
            needs_reorder = (
                current_stock <= reorder_level or 
                (days_until_stockout <= 14 and avg_daily > 0)
            )
            if not needs_reorder:
                continue
            if current_stock == 0:
                priority = 1
                priority_label = 'CRITICAL — Out of Stock'
                action = 'Order immediately — sales are being lost'
            elif days_until_stockout <= 3:
                priority = 2
                priority_label = 'URGENT — 3 days or less'
                action = 'Order today to prevent stockout'
            elif days_until_stockout <= 7:
                priority = 3
                priority_label = 'HIGH — 7 days or less'
                action = 'Order within 2 days'
            elif current_stock <= reorder_level:
                priority = 4
                priority_label = 'MEDIUM — Below reorder level'
                action = 'Schedule reorder this week'
            else:
                priority = 5
                priority_label = 'LOW — Approaching reorder level'
                action = 'Monitor and plan reorder'
            recommendations.append({
                'product_id': product.id,
                'product_name': product.name,
                'sku': getattr(product, 'sku', f'SKU-{product.id}'),
                'category': product.category.name if product.category else 'N/A',
                'current_stock': current_stock,
                'reorder_level': reorder_level,
                'days_until_stockout': days_until_stockout,
                'avg_daily_sales': round(avg_daily, 2),
                'recommended_order_qty': recommended_qty,
                'estimated_cost_ksh': round(cost_to_reorder, 2),
                'unit_price_ksh': price,
                'priority': priority,
                'priority_label': priority_label,
                'action': action,
                'eoq_quantity': eoq,
                'demand_trend': 'increasing' if sales_30d > annual_demand/12 else 'decreasing' if sales_30d < annual_demand/12 * 0.7 else 'stable',
            })
        recommendations.sort(key=lambda x: (x['priority'], x['days_until_stockout']))
        total_reorder_cost = sum(r['estimated_cost_ksh'] for r in recommendations)
        return Response({
            'success': True,
            'data': {
                'summary': {
                    'products_needing_reorder': len(recommendations),
                    'critical_count': len([r for r in recommendations if r['priority'] == 1]),
                    'urgent_count': len([r for r in recommendations if r['priority'] == 2]),
                    'total_estimated_reorder_cost_ksh': round(total_reorder_cost, 2),
                },
                'recommendations': recommendations,
            }
        })

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, F, Q, FloatField, ExpressionWrapper
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from .models import SalesAnalytics, ProductAnalytics, InventoryInsight
from .serializers import SalesAnalyticsSerializer, ProductAnalyticsSerializer, InventoryInsightSerializer
from products.models import Product
from inventory.models import Inventory
from orders.models import Order, OrderItem

# ================= SECTION A: INVENTORY REPORT ENDPOINTS =================

class InventoryStatusReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        FR5 — Inventory Status Report
        Returns current stock status for all products the requesting dealer owns (or all products if admin).
        """
        from products.models import Product
        from inventory.models import InventoryItem

        user = request.user
        if hasattr(user, 'role') and user.role == 'dealer':
            try:
                dealer_profile = user.dealerprofile
                products = Product.objects.filter(dealer=dealer_profile).select_related('category')
            except:
                products = Product.objects.filter(added_by=user).select_related('category')
        else:
            products = Product.objects.all().select_related('category')

        report_data = []
        total_sku_count = 0
        total_inventory_value = 0
        critical_count = 0
        low_count = 0
        healthy_count = 0

        for product in products:
            try:
                inv = product.inventoryitem
                current_stock = inv.quantity
                reorder_level = inv.reorder_level if hasattr(inv, 'reorder_level') else 10
            except:
                current_stock = getattr(product, 'stock_quantity', getattr(product, 'current_stock', 0))
                reorder_level = getattr(product, 'reorder_level', 10)

            price = float(getattr(product, 'price', 0))
            stock_value = current_stock * price
            total_inventory_value += stock_value
            total_sku_count += 1

            if current_stock == 0:
                status = 'out_of_stock'
                critical_count += 1
            elif current_stock <= reorder_level:
                status = 'low_stock'
                low_count += 1
            else:
                status = 'in_stock'
                healthy_count += 1

            from orders.models import OrderItem
            from django.utils import timezone
            from datetime import timedelta
            thirty_days_ago = timezone.now() - timedelta(days=30)
            units_sold_30d = OrderItem.objects.filter(
                product=product,
                order__created_at__gte=thirty_days_ago,
                order__status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).aggregate(total=Sum('quantity'))['total'] or 0
            avg_daily_sales = units_sold_30d / 30
            days_of_stock = (
                round(current_stock / avg_daily_sales)
                if avg_daily_sales > 0 else 999
            )

            report_data.append({
                'product_id': product.id,
                'product_name': product.name,
                'sku': getattr(product, 'sku', f'SKU-{product.id}'),
                'category': product.category.name if product.category else 'Uncategorized',
                'current_stock': current_stock,
                'reorder_level': reorder_level,
                'stock_value_ksh': round(stock_value, 2),
                'unit_price_ksh': price,
                'status': status,
                'days_of_stock': min(days_of_stock, 999),
                'units_sold_30d': units_sold_30d,
                'avg_daily_sales': round(avg_daily_sales, 2),
            })

        status_order = {'out_of_stock': 0, 'low_stock': 1, 'in_stock': 2}
        report_data.sort(key=lambda x: status_order.get(x['status'], 3))

        return Response({
            'success': True,
            'data': {
                'summary': {
                    'total_skus': total_sku_count,
                    'total_inventory_value_ksh': round(total_inventory_value, 2),
                    'out_of_stock_count': critical_count,
                    'low_stock_count': low_count,
                    'in_stock_count': healthy_count,
                    'generated_at': timezone.now().isoformat(),
                },
                'products': report_data,
            }
        })

class LowStockReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        FR5 — Low-Stock Report
        Products at or below reorder level with urgency scoring.
        """
        from products.models import Product
        from orders.models import OrderItem
        from django.utils import timezone
        from datetime import timedelta

        user = request.user
        if hasattr(user, 'role') and user.role == 'dealer':
            try:
                dealer_profile = user.dealerprofile
                products = Product.objects.filter(dealer=dealer_profile)
            except:
                products = Product.objects.filter(added_by=user)
        else:
            products = Product.objects.all()

        low_stock_items = []
        thirty_days_ago = timezone.now() - timedelta(days=30)

        for product in products:
            try:
                inv = product.inventoryitem
                current_stock = inv.quantity
                reorder_level = getattr(inv, 'reorder_level', 10)
            except:
                current_stock = getattr(product, 'stock_quantity', getattr(product, 'current_stock', 0))
                reorder_level = getattr(product, 'reorder_level', 10)

            if current_stock > reorder_level:
                continue

            units_sold_30d = OrderItem.objects.filter(
                product=product,
                order__created_at__gte=thirty_days_ago,
                order__status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).aggregate(total=Sum('quantity'))['total'] or 0

            avg_daily = units_sold_30d / 30
            days_until_stockout = (
                round(current_stock / avg_daily) 
                if avg_daily > 0 and current_stock > 0 else 0
            )

            if current_stock == 0:
                urgency = 'critical'
                urgency_score = 0
            elif days_until_stockout <= 3:
                urgency = 'high'
                urgency_score = 1
            elif days_until_stockout <= 7:
                urgency = 'medium'
                urgency_score = 2
            else:
                urgency = 'low'
                urgency_score = 3

            price = float(getattr(product, 'price', 0))
            recommended_qty = max(round(avg_daily * 30), reorder_level * 2)

            low_stock_items.append({
                'product_id': product.id,
                'product_name': product.name,
                'sku': getattr(product, 'sku', f'SKU-{product.id}'),
                'category': product.category.name if product.category else 'Uncategorized',
                'current_stock': current_stock,
                'reorder_level': reorder_level,
                'stock_deficit': max(0, reorder_level - current_stock),
                'days_until_stockout': days_until_stockout,
                'urgency': urgency,
                'urgency_score': urgency_score,
                'units_sold_30d': units_sold_30d,
                'avg_daily_sales': round(avg_daily, 2),
                'recommended_reorder_qty': recommended_qty,
                'estimated_reorder_cost_ksh': round(recommended_qty * price, 2),
            })

        low_stock_items.sort(key=lambda x: (x['urgency_score'], x['days_until_stockout']))

        return Response({
            'success': True,
            'data': {
                'count': len(low_stock_items),
                'generated_at': timezone.now().isoformat(),
                'items': low_stock_items,
            }
        })

class StockMovementReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        FR5 — Stock Movement Report
        History of all stock changes with filtering.
        """
        from inventory.models import InventoryTransaction
        from django.utils import timezone
        from datetime import timedelta
        days = int(request.query_params.get('days', 30))
        transaction_type = request.query_params.get('type', None)
        product_id = request.query_params.get('product_id', None)
        since = timezone.now() - timedelta(days=days)
        qs = InventoryTransaction.objects.filter(
            created_at__gte=since
        ).select_related('product').order_by('-created_at')
        user = request.user
        if hasattr(user, 'role') and user.role == 'dealer':
            try:
                dealer_profile = user.dealerprofile
                qs = qs.filter(product__dealer=dealer_profile)
            except:
                qs = qs.filter(product__added_by=user)
        if transaction_type:
            qs = qs.filter(transaction_type=transaction_type)
        if product_id:
            qs = qs.filter(product_id=product_id)
        movements = []
        for txn in qs[:500]:
            movements.append({
                'id': txn.id,
                'product_id': txn.product.id,
                'product_name': txn.product.name,
                'sku': getattr(txn.product, 'sku', f'SKU-{txn.product.id}'),
                'transaction_type': txn.transaction_type,
                'transaction_type_display': {
                    'sale': 'Sale (Stock Out)',
                    'restock': 'Restock (Stock In)',
                    'adjustment': 'Manual Adjustment',
                    'return': 'Customer Return',
                    'damage': 'Damage Write-off',
                }.get(txn.transaction_type, txn.transaction_type),
                'quantity_change': txn.quantity_change,
                'previous_stock': getattr(txn, 'previous_stock', 0),
                'new_stock': getattr(txn, 'new_stock', 0),
                'reference_id': getattr(txn, 'reference_id', None),
                'notes': getattr(txn, 'notes', ''),
                'created_at': txn.created_at.isoformat(),
                'created_at_display': txn.created_at.strftime('%d %b %Y, %I:%M %p'),
            })
        total_in = sum(m['quantity_change'] for m in movements if m['quantity_change'] > 0)
        total_out = sum(abs(m['quantity_change']) for m in movements if m['quantity_change'] < 0)
        from collections import defaultdict
        daily_movement = defaultdict(lambda: {'stock_in': 0, 'stock_out': 0})
        for m in movements:
            date_key = m['created_at'][:10]
            if m['quantity_change'] > 0:
                daily_movement[date_key]['stock_in'] += m['quantity_change']
            else:
                daily_movement[date_key]['stock_out'] += abs(m['quantity_change'])
        chart_data = [
            {'date': k, 'stock_in': v['stock_in'], 'stock_out': v['stock_out']}
            for k, v in sorted(daily_movement.items())
        ]
        return Response({
            'success': True,
            'data': {
                'period_days': days,
                'summary': {
                    'total_movements': len(movements),
                    'total_stock_in': total_in,
                    'total_stock_out': total_out,
                    'net_change': total_in - total_out,
                },
                'chart_data': chart_data,
                'movements': movements,
            }
        })

class InventoryValuationReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        FR5 — Inventory Valuation Report
        Total value of inventory at cost and selling price.
        """
        from products.models import Product
        user = request.user
        if hasattr(user, 'role') and user.role == 'dealer':
            try:
                dealer_profile = user.dealerprofile
                products = Product.objects.filter(dealer=dealer_profile).select_related('category')
            except:
                products = Product.objects.filter(added_by=user).select_related('category')
        else:
            products = Product.objects.all().select_related('category')

        category_breakdown = {}
        total_selling_value = 0
        total_units = 0
        product_valuations = []

        for product in products:
            try:
                current_stock = product.inventoryitem.quantity
            except:
                current_stock = getattr(product, 'stock_quantity', getattr(product, 'current_stock', 0))
            price = float(getattr(product, 'price', 0))
            selling_value = current_stock * price
            total_selling_value += selling_value
            total_units += current_stock
            cat_name = product.category.name if product.category else 'Uncategorized'
            if cat_name not in category_breakdown:
                category_breakdown[cat_name] = {
                    'category': cat_name,
                    'product_count': 0,
                    'total_units': 0,
                    'total_value_ksh': 0,
                }
            category_breakdown[cat_name]['product_count'] += 1
            category_breakdown[cat_name]['total_units'] += current_stock
            category_breakdown[cat_name]['total_value_ksh'] += selling_value
            product_valuations.append({
                'product_id': product.id,
                'product_name': product.name,
                'sku': getattr(product, 'sku', f'SKU-{product.id}'),
                'category': cat_name,
                'unit_price_ksh': price,
                'units_in_stock': current_stock,
                'total_value_ksh': round(selling_value, 2),
                'percentage_of_total': 0,
            })
        for pv in product_valuations:
            pv['percentage_of_total'] = (
                round((pv['total_value_ksh'] / total_selling_value * 100), 2)
                if total_selling_value > 0 else 0
            )
        product_valuations.sort(key=lambda x: x['total_value_ksh'], reverse=True)
        category_chart = [
            {
                'category': k,
                'value_ksh': round(v['total_value_ksh'], 2),
                'percentage': round(v['total_value_ksh'] / total_selling_value * 100, 1)
                              if total_selling_value > 0 else 0,
                'product_count': v['product_count'],
                'total_units': v['total_units'],
            }
            for k, v in category_breakdown.items()
        ]
        category_chart.sort(key=lambda x: x['value_ksh'], reverse=True)
        from django.utils import timezone
        return Response({
            'success': True,
            'data': {
                'summary': {
                    'total_inventory_value_ksh': round(total_selling_value, 2),
                    'total_units_in_stock': total_units,
                    'total_product_skus': len(product_valuations),
                    'highest_value_product': product_valuations[0]['product_name'] if product_valuations else None,
                    'generated_at': timezone.now().isoformat(),
                },
                'by_category': category_chart,
                'by_product': product_valuations,
            }
        })

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        today = timezone.now()
        thirty_days_ago = today - timedelta(days=30)
        
        total_products = Product.objects.filter(is_active=True).count()
        low_stock_items = Inventory.objects.filter(quantity__lte=F('reorder_level')).count()
        out_of_stock_items = Inventory.objects.filter(quantity=0).count()
        
        recent_orders = Order.objects.filter(created_at__gte=thirty_days_ago)
        total_orders = recent_orders.count()
        total_revenue = recent_orders.filter(status='delivered').aggregate(
            total=Sum('total_amount'))['total'] or Decimal('0')
        
        top_products = OrderItem.objects.filter(
            order__created_at__gte=thirty_days_ago,
            order__status='delivered'
        ).values('product__name', 'product__id').annotate(
            total_sold=Sum('quantity'),
            total_revenue=Sum('total_price')
        ).order_by('-total_sold')[:10]
        
        sales_data = Order.objects.filter(
            created_at__gte=thirty_days_ago,
            status='delivered'
        ).extra(
            {'date': "date(created_at)"}
        ).values('date').annotate(
            daily_sales=Sum('total_amount'),
            daily_orders=Count('id')
        ).order_by('date')
        
        return Response({
            'summary': {
                'total_products': total_products,
                'low_stock_items': low_stock_items,
                'out_of_stock_items': out_of_stock_items,
                'total_orders': total_orders,
                'total_revenue': float(total_revenue),
            },
            'top_products': list(top_products),
            'sales_data': list(sales_data),
        })
    
    @action(detail=False, methods=['get'])
    def inventory_insights(self, request):
        return Response(self._get_dss_data())
    
    def _get_dss_data(self):
        from datetime import datetime
        from django.db.models.functions import TruncMonth
        
        # Summary counts
        total_products = Product.objects.filter(is_active=True).count()
        critical_stock = Inventory.objects.filter(quantity=0).count()
        low_stock = Inventory.objects.filter(
            quantity__lte=F('reorder_level'), quantity__gt=0
        ).count()
        overstock = Inventory.objects.filter(
            quantity__gt=F('reorder_level') * 3
        ).count()
        healthy_stock = total_products - critical_stock - low_stock - overstock
        
        # Reorder recommendations
        recommendations = []
        low_inventory = Inventory.objects.filter(
            quantity__lte=F('reorder_level') * 2
        ).select_related('product', 'product__category')
        
        for inv in low_inventory:
            avg_daily = self._calculate_avg_daily_sales(inv.product)
            days_until = int(inv.quantity / avg_daily) if avg_daily > 0 else 999
            
            if days_until <= 7:
                urgency = 'critical'
            elif days_until <= 14:
                urgency = 'high'
            else:
                urgency = 'medium'
            
            recommended_qty = max(inv.reorder_quantity, int(avg_daily * 30)) if avg_daily > 0 else inv.reorder_quantity
            unit_cost = getattr(inv.product, 'cost_price', 0) or getattr(inv.product, 'price', 0) * 0.6
            
            recommendations.append({
                'product_id': inv.product.id,
                'product_name': inv.product.name,
                'category': getattr(inv.product.category, 'name', 'Uncategorized'),
                'current_stock': inv.quantity,
                'reorder_level': inv.reorder_level,
                'recommended_order_qty': recommended_qty,
                'days_until_stockout': days_until,
                'urgency': urgency,
                'estimated_cost_ksh': round(recommended_qty * float(unit_cost), 2)
            })
        
        recommendations.sort(key=lambda x: (x['urgency'] != 'critical', x['urgency'] != 'high', x['days_until_stockout']))
        
        # Slow movers (>90 days supply)
        slow_movers = []
        for inv in Inventory.objects.filter(quantity__gt=0).select_related('product'):
            avg_daily = self._calculate_avg_daily_sales(inv.product)
            if avg_daily > 0:
                days_supply = inv.quantity / float(avg_daily)
                if days_supply > 90:
                    last_sale = OrderItem.objects.filter(
                        product=inv.product, order__status='delivered'
                    ).order_by('-order__created_at').first()
                    days_since = (timezone.now() - last_sale.order.created_at).days if last_sale else 999
                    
                    if days_supply > 180:
                        action = 'return_to_supplier'
                    elif days_supply > 120:
                        action = 'bundle'
                    else:
                        action = 'discount'
                    
                    slow_movers.append({
                        'product_id': inv.product.id,
                        'product_name': inv.product.name,
                        'days_since_last_sale': days_since,
                        'stock_quantity': inv.quantity,
                        'suggested_action': action
                    })
        
        # Fast movers (<7 days supply, high velocity)
        fast_movers = []
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        for inv in Inventory.objects.filter(quantity__gt=0).select_related('product'):
            avg_daily = self._calculate_avg_daily_sales(inv.product)
            if avg_daily > 0:
                days_left = int(inv.quantity / float(avg_daily))
                if days_left < 14 and avg_daily > 1:
                    units_sold = OrderItem.objects.filter(
                        product=inv.product,
                        order__created_at__gte=thirty_days_ago,
                        order__status='delivered'
                    ).aggregate(total=Sum('quantity'))['total'] or 0
                    
                    fast_movers.append({
                        'product_id': inv.product.id,
                        'product_name': inv.product.name,
                        'units_sold_last_30_days': int(units_sold),
                        'stock_remaining': inv.quantity,
                        'days_of_stock_left': days_left
                    })
        
        fast_movers.sort(key=lambda x: x['units_sold_last_30_days'], reverse=True)
        
        # Monthly trend (last 6 months)
        monthly_trend = []
        for i in range(5, -1, -1):
            month_start = timezone.now().replace(day=1) - timedelta(days=i*30)
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            
            month_orders = Order.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                status='delivered'
            )
            
            revenue = month_orders.aggregate(total=Sum('total_amount'))['total'] or 0
            units = OrderItem.objects.filter(
                order__in=month_orders
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            monthly_trend.append({
                'month': month_start.strftime('%b'),
                'revenue_ksh': float(revenue),
                'units_sold': int(units),
                'orders': month_orders.count()
            })
        
        return {
            'summary': {
                'total_products': total_products,
                'critical_stock': critical_stock,
                'low_stock': low_stock,
                'overstock': overstock,
                'healthy_stock': healthy_stock
            },
            'reorder_recommendations': recommendations[:20],
            'slow_movers': slow_movers[:10],
            'fast_movers': fast_movers[:5],
            'monthly_trend': monthly_trend
        }
    
    @action(detail=False, methods=['get'])
    def sales_report(self, request):
        days = int(request.GET.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        orders = Order.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        daily_sales = orders.extra(
            {'date': "date(created_at)"}
        ).values('date').annotate(
            total_sales=Sum('total_amount'),
            order_count=Count('id'),
            avg_order_value=Avg('total_amount')
        ).order_by('date')
        
        category_sales = OrderItem.objects.filter(
            order__created_at__date__gte=start_date,
            order__created_at__date__lte=end_date
        ).values('product__category__name').annotate(
            total_revenue=Sum('total_price'),
            units_sold=Sum('quantity')
        ).order_by('-total_revenue')
        
        return Response({
            'daily_sales': list(daily_sales),
            'category_sales': list(category_sales),
            'summary': {
                'total_revenue': orders.aggregate(total=Sum('total_amount'))['total'] or 0,
                'total_orders': orders.count(),
                'avg_order_value': orders.aggregate(avg=Avg('total_amount'))['avg'] or 0,
            }
        })
    
    def _calculate_avg_daily_sales(self, product):
        thirty_days_ago = timezone.now() - timedelta(days=30)
        sales = OrderItem.objects.filter(
            product=product,
            order__created_at__gte=thirty_days_ago,
            order__status='delivered'
        ).aggregate(total_quantity=Sum('quantity'))['total_quantity'] or 0
        
        return Decimal(sales) / Decimal(30)
    
    def _identify_slow_moving_products(self):
        slow_moving = []
        products = Product.objects.filter(is_active=True)
        
        for product in products:
            avg_daily_sales = self._calculate_avg_daily_sales(product)
            inventory = getattr(product, 'inventory', None)
            
            if inventory and avg_daily_sales > 0:
                days_of_supply = inventory.quantity / float(avg_daily_sales)
                if days_of_supply > 90:
                    slow_moving.append({
                        'product': {
                            'id': product.id,
                            'name': product.name,
                            'sku': product.sku,
                            'current_stock': inventory.quantity,
                        },
                        'days_of_supply': int(days_of_supply),
                        'avg_daily_sales': float(avg_daily_sales),
                    })
        
        return slow_moving
    
    def _identify_fast_moving_products(self):
        fast_moving = []
        products = Product.objects.filter(is_active=True)
        
        for product in products:
            avg_daily_sales = self._calculate_avg_daily_sales(product)
            inventory = getattr(product, 'inventory', None)
            
            if inventory and avg_daily_sales > 0:
                days_of_supply = inventory.quantity / float(avg_daily_sales)
                if days_of_supply < 7 and inventory.quantity > 0:
                    fast_moving.append({
                        'product': {
                            'id': product.id,
                            'name': product.name,
                            'sku': product.sku,
                            'current_stock': inventory.quantity,
                        },
                        'days_of_supply': int(days_of_supply),
                        'avg_daily_sales': float(avg_daily_sales),
                    })
        
        return fast_moving
