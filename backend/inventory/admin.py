"""
Inventory Admin Configuration - Section B
Professional admin setup for Inventory, Supplier, StockMovement, StockAlert.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count
from .models import Supplier, Inventory, StockMovement, StockAlert


class StockMovementInline(admin.TabularInline):
    model = StockMovement
    extra = 0
    fields = ['movement_type', 'quantity', 'reference', 'notes', 'created_by', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'email', 'phone', 'is_active', 'product_count']
    list_filter = ['is_active', ('created_at', admin.DateFieldListFilter)]
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering = ['name']
    
    def product_count(self, obj):
        return obj.inventory_set.count()
    product_count.short_description = 'Products Supplied'


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    """
    Section B5 - Inventory Admin with stock status, urgency badge, summary stats.
    """
    list_display = [
        'product_name', 'quantity', 'reorder_level', 'urgency_badge',
        'last_updated'
    ]
    list_filter = [
        'product__category', 'supplier'
    ]
    search_fields = ['product__name', 'product__sku']
    ordering = ['-quantity']
    list_editable = ['reorder_level']
    
    fieldsets = (
        ('Product', {
            'fields': ('product',)
        }),
        ('Stock Levels', {
            'fields': ('quantity', 'reorder_level', 'reorder_quantity')
        }),
        ('Supplier', {
            'fields': ('supplier',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_ordered']
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Product'
    
    def last_updated(self, obj):
        return obj.last_stock_update
    last_updated.short_description = 'Last Updated'
    
    def urgency_badge(self, obj):
        """Display urgency based on stock level vs reorder level"""
        if obj.quantity == 0:
            color = '#ef4444'
            text = 'CRITICAL'
        elif obj.quantity <= obj.reorder_level * 0.5:
            color = '#ef4444'
            text = 'URGENT'
        elif obj.quantity <= obj.reorder_level:
            color = '#f59e0b'
            text = 'LOW'
        elif obj.quantity <= obj.reorder_level * 2:
            color = '#3b82f6'
            text = 'NORMAL'
        else:
            color = '#22c55e'
            text = 'HEALTHY'
        
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;">{}</span>',
            color, text
        )
    urgency_badge.short_description = 'Urgency'
    
    @admin.action(description='Mark selected items as ordered')
    def mark_as_ordered(self, request, queryset):
        """Bulk action to mark items as ordered (creates movement record)"""
        for inventory in queryset:
            StockMovement.objects.create(
                inventory=inventory,
                movement_type='in',
                quantity=inventory.reorder_quantity,
                reference='ADMIN_ORDERED',
                notes=f'Marked as ordered by {request.user.email}',
                created_by=request.user
            )
        self.message_user(request, f'{queryset.count()} items marked as ordered.')
    
    def changelist_view(self, request, extra_context=None):
        """Add summary stats to changelist"""
        from django.db.models import F
        qs = self.get_queryset(request)
        
        extra_context = extra_context or {}
        total_skus = qs.count()
        critical_stock = qs.filter(quantity=0).count()
        low_stock = qs.filter(quantity__gt=0, quantity__lte=F('reorder_level')).count()
        
        # Calculate total inventory value (assuming cost_price exists on product)
        total_value = 0
        for inv in qs.select_related('product'):
            if hasattr(inv.product, 'cost_price'):
                total_value += inv.quantity * float(inv.product.cost_price)
        
        extra_context['inventory_summary'] = {
            'total_skus': total_skus,
            'critical_stock_count': critical_stock,
            'low_stock_count': low_stock,
            'total_value_ksh': total_value,
        }
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['inventory', 'movement_type_badge', 'quantity', 'reference', 'created_by', 'created_at']
    list_filter = ['movement_type', ('created_at', admin.DateFieldListFilter)]
    search_fields = ['inventory__product__name', 'reference', 'notes']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def movement_type_badge(self, obj):
        colors = {
            'in': '#22c55e',
            'out': '#ef4444',
            'adjustment': '#f59e0b',
            'return': '#3b82f6',
        }
        color = colors.get(obj.movement_type, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;text-transform:uppercase;">{}</span>',
            color, obj.movement_type
        )
    movement_type_badge.short_description = 'Type'


@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    list_display = ['inventory', 'alert_type_badge', 'is_resolved', 'created_at', 'resolved_at']
    list_filter = ['alert_type', 'is_resolved', ('created_at', admin.DateFieldListFilter)]
    search_fields = ['inventory__product__name', 'message']
    actions = ['mark_resolved']
    
    def alert_type_badge(self, obj):
        colors = {
            'low_stock': '#f59e0b',
            'out_of_stock': '#ef4444',
            'overstock': '#3b82f6',
        }
        color = colors.get(obj.alert_type, '#6b7280')
        display = obj.alert_type.replace('_', ' ').title()
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;">{}</span>',
            color, display
        )
    alert_type_badge.short_description = 'Type'
    
    @admin.action(description='Mark selected alerts as resolved')
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_resolved=True, resolved_at=timezone.now(), resolved_by=request.user)
        self.message_user(request, f'{queryset.count()} alerts resolved.')
