from django.contrib import admin
from .models import Forecast, ABCAnalysis, InventoryAlert


@admin.register(Forecast)
class ForecastAdmin(admin.ModelAdmin):
    list_display = ('product', 'period_type', 'forecasted_demand', 'mae', 'updated_at')
    list_filter = ('period_type', 'updated_at')
    search_fields = ('product__name',)
    readonly_fields = ('created_at', 'updated_at', 'mae', 'rmse')


@admin.register(ABCAnalysis)
class ABCAnalysisAdmin(admin.ModelAdmin):
    list_display = ('product', 'classification', 'annual_consumption_value', 'inventory_turnover')
    list_filter = ('classification', 'updated_at')
    search_fields = ('product__name',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Product Info', {
            'fields': ('product', 'dealer', 'classification')
        }),
        ('Demand Metrics', {
            'fields': ('annual_demand', 'unit_cost', 'annual_consumption_value')
        }),
        ('Reorder Recommendations', {
            'fields': ('reorder_quantity', 'reorder_point', 'safety_stock', 'lead_time_days')
        }),
        ('Turnover Analysis', {
            'fields': ('inventory_turnover', 'days_inventory_outstanding')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InventoryAlert)
class InventoryAlertAdmin(admin.ModelAdmin):
    list_display = ('product', 'alert_type', 'is_resolved', 'created_at')
    list_filter = ('alert_type', 'is_resolved', 'created_at')
    search_fields = ('product__name', 'message')
    readonly_fields = ('created_at', 'resolved_at')
    actions = ['mark_resolved']
    
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(is_resolved=False).update(is_resolved=True, resolved_at=timezone.now())
        self.message_user(request, f'{updated} alert(s) marked as resolved.')
    
    mark_resolved.short_description = 'Mark selected alerts as resolved'
