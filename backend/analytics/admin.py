"""
Analytics Admin Configuration - Section B
Professional admin setup for SalesAnalytics, ProductAnalytics, InventoryInsight.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Avg
from .models import SalesAnalytics, ProductAnalytics, InventoryInsight


@admin.register(SalesAnalytics)
class SalesAnalyticsAdmin(admin.ModelAdmin):
    """
    Section B6 - Analytics dashboard with sales data.
    """
    list_display = [
        'date', 'total_sales_display', 'total_orders', 
        'total_products_sold', 'average_order_value_display'
    ]
    list_filter = [
        ('date', admin.DateFieldListFilter),
    ]
    ordering = ['-date']
    readonly_fields = ['date', 'total_sales', 'total_orders', 'total_products_sold', 'average_order_value']
    date_hierarchy = 'date'
    
    def total_sales_display(self, obj):
        value = float(obj.total_sales or 0)
        return format_html('<span style="font-weight:bold;color:#22c55e;">${}</span>', f'{value:,.2f}')
    total_sales_display.short_description = 'Total Sales'
    
    def average_order_value_display(self, obj):
        value = float(obj.average_order_value or 0)
        return format_html('<span style="color:#3b82f6;">${}</span>', f'{value:,.2f}')
    average_order_value_display.short_description = 'AOV'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def changelist_view(self, request, extra_context=None):
        """Add summary stats to analytics changelist"""
        from django.db.models import Sum, Avg
        qs = self.get_queryset(request)
        
        extra_context = extra_context or {}
        extra_context['analytics_summary'] = {
            'total_sales': qs.aggregate(total=Sum('total_sales'))['total'] or 0,
            'total_orders': qs.aggregate(total=Sum('total_orders'))['total'] or 0,
            'avg_order_value': qs.aggregate(avg=Avg('average_order_value'))['avg'] or 0,
            'total_products': qs.aggregate(total=Sum('total_products_sold'))['total'] or 0,
        }
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(ProductAnalytics)
class ProductAnalyticsAdmin(admin.ModelAdmin):
    """
    Product-level analytics with performance metrics.
    """
    list_display = [
        'product_name', 'total_sold_display', 'total_revenue_display',
        'average_daily_sales', 'last_updated'
    ]
    search_fields = ['product__name', 'product__sku']
    ordering = ['-total_revenue']
    readonly_fields = ['product', 'total_sold', 'total_revenue', 'average_daily_sales', 'last_updated']
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def total_sold_display(self, obj):
        return format_html(
            '<span style="font-weight:bold;{};padding:2px 6px;border-radius:4px;">{}</span>',
            'background:#22c55e;color:white' if obj.total_sold > 50 else 'color:#6b7280',
            obj.total_sold
        )
    total_sold_display.short_description = 'Sold'
    
    def total_revenue_display(self, obj):
        value = float(obj.total_revenue or 0)
        return format_html('<span style="font-weight:bold;color:#22c55e;">${}</span>', f'{value:,.2f}')
    total_revenue_display.short_description = 'Revenue'
    
    def has_add_permission(self, request):
        return False


@admin.register(InventoryInsight)
class InventoryInsightAdmin(admin.ModelAdmin):
    """
    Read-only admin for AI-generated inventory insights.
    """
    list_display = [
        'insight_badge', 'product_name', 'priority_badge',
        'message_preview', 'is_active', 'created_at'
    ]
    list_filter = [
        'insight_type', 'priority', 'is_active',
        ('created_at', admin.DateFieldListFilter)
    ]
    search_fields = ['product__name', 'message']
    readonly_fields = [
        'product', 'insight_type', 'message', 'priority',
        'is_active', 'created_at'
    ]
    actions = ['resolve_insights']
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def insight_badge(self, obj):
        colors = {
            'low_stock': '#f59e0b',
            'out_of_stock': '#ef4444',
            'overstock': '#3b82f6',
            'slow_moving': '#6b7280',
            'fast_moving': '#22c55e',
            'reorder_recommendation': '#8b5cf6',
        }
        color = colors.get(obj.insight_type, '#6b7280')
        display = obj.get_insight_type_display()
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;">{}</span>',
            color, display
        )
    insight_badge.short_description = 'Type'
    
    def priority_badge(self, obj):
        colors = {
            'low': '#22c55e',
            'medium': '#f59e0b',
            'high': '#ef4444',
        }
        color = colors.get(obj.priority, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;text-transform:uppercase;">{}</span>',
            color, obj.priority
        )
    priority_badge.short_description = 'Priority'
    
    def message_preview(self, obj):
        return obj.message[:60] + ('...' if len(obj.message) > 60 else '')
    message_preview.short_description = 'Message'
    
    @admin.action(description='Resolve selected insights')
    def resolve_insights(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} insights resolved.')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
