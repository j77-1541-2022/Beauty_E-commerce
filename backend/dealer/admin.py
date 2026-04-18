from django.contrib import admin
from .models import (
    DealerInventory, DealerStockMovement, DealerSalesAnalytics,
    DealerReport, DecisionSupportMetric
)


@admin.register(DealerInventory)
class DealerInventoryAdmin(admin.ModelAdmin):
    list_display = ['dealer', 'product', 'stock_quantity', 'stock_status', 'last_stock_update']
    list_filter = ['dealer', 'last_stock_update']
    search_fields = ['dealer__business_name', 'product__name']
    readonly_fields = ['last_stock_update', 'stock_status']
    fieldsets = (
        ('Basic Information', {
            'fields': ('dealer', 'product')
        }),
        ('Stock Information', {
            'fields': ('stock_quantity', 'reorder_level', 'reorder_quantity', 'stock_status')
        }),
        ('Timestamps', {
            'fields': ('last_stock_update', 'last_reordered'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DealerStockMovement)
class DealerStockMovementAdmin(admin.ModelAdmin):
    list_display = ['dealer_inventory', 'movement_type', 'quantity', 'created_at']
    list_filter = ['movement_type', 'created_at', 'dealer_inventory__dealer']
    search_fields = ['dealer_inventory__product__name', 'reference']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Movement Information', {
            'fields': ('dealer_inventory', 'movement_type', 'quantity')
        }),
        ('Stock Tracking', {
            'fields': ('quantity_before', 'quantity_after')
        }),
        ('Details', {
            'fields': ('reason', 'reference'),
        }),
        ('Timestamp', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(DealerSalesAnalytics)
class DealerSalesAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['dealer', 'date', 'total_orders', 'total_items_sold', 'total_revenue']
    list_filter = ['date', 'dealer']
    search_fields = ['dealer__business_name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('dealer', 'date')
        }),
        ('Order Metrics', {
            'fields': ('total_orders', 'unique_customers', 'average_order_value')
        }),
        ('Sales Metrics', {
            'fields': ('total_items_sold', 'total_revenue', 'total_profit')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DealerReport)
class DealerReportAdmin(admin.ModelAdmin):
    list_display = ['dealer', 'report_type', 'period_start', 'period_end', 'status']
    list_filter = ['report_type', 'status', 'period_end', 'dealer']
    search_fields = ['dealer__business_name']
    readonly_fields = ['generated_at', 'created_at']
    fieldsets = (
        ('Report Information', {
            'fields': ('dealer', 'report_type', 'status')
        }),
        ('Period', {
            'fields': ('period_start', 'period_end')
        }),
        ('Order Metrics', {
            'fields': ('total_orders', 'total_items_sold', 'unique_customers', 'returning_customers')
        }),
        ('Financial Metrics', {
            'fields': ('total_revenue', 'total_profit', 'average_order_value')
        }),
        ('Inventory Metrics', {
            'fields': ('current_inventory_value', 'low_stock_count', 'out_of_stock_count')
        }),
        ('Top Products', {
            'fields': ('top_products',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('generated_at', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DecisionSupportMetric)
class DecisionSupportMetricAdmin(admin.ModelAdmin):
    list_display = ['dealer', 'metric_type', 'metric_value', 'trend_direction', 'calculated_at']
    list_filter = ['metric_type', 'trend_direction', 'calculated_at', 'dealer']
    search_fields = ['dealer__business_name', 'product__name', 'metric_label']
    readonly_fields = ['calculated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('dealer', 'metric_type', 'product')
        }),
        ('Metric Value', {
            'fields': ('metric_value', 'metric_label', 'period_average', 'trend_direction')
        }),
        ('Details', {
            'fields': ('description', 'recommendation'),
        }),
        ('Timestamp', {
            'fields': ('calculated_at',),
            'classes': ('collapse',)
        }),
    )
