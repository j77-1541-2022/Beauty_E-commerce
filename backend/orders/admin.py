"""
Orders Admin Configuration - Section B
Professional admin setup for Order, OrderItem, OrderStatusHistory.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from django.utils import timezone
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']
    fields = ['product', 'quantity', 'unit_price', 'total_price']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['old_status', 'new_status', 'changed_by', 'changed_at', 'notes']
    fields = ['old_status', 'new_status', 'notes', 'changed_by', 'changed_at']
    ordering = ['-changed_at']
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """
    Section B4 - Order Admin with status badges, status history inline, and summary.
    """
    list_display = [
        'order_number', 'status_badge', 'customer_name', 'customer_email',
        'total_display', 'item_count', 'created_at', 'created_by'
    ]
    list_filter = [
        'status',
        ('created_at', admin.DateFieldListFilter),
    ]
    search_fields = ['order_number', 'customer_name', 'customer_email', 'customer_phone']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'status')
        }),
        ('Customer Details', {
            'fields': ('customer_name', 'customer_email', 'customer_phone', 'shipping_address')
        }),
        ('Financial', {
            'fields': ('subtotal', 'tax_amount', 'shipping_cost', 'total_amount')
        }),
        ('Additional', {
            'fields': ('notes', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    
    def status_badge(self, obj):
        colors = {
            'pending': '#f59e0b',
            'confirmed': '#3b82f6',
            'processing': '#8b5cf6',
            'shipped': '#06b6d4',
            'delivered': '#22c55e',
            'cancelled': '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 10px;border-radius:9999px;font-size:11px;text-transform:uppercase;">{}</span>',
            color, obj.status
        )
    status_badge.short_description = 'Status'
    
    def total_display(self, obj):
        value = float(obj.total_amount or 0)
        return format_html('<span style="font-weight:bold;">${}</span>', f'{value:.2f}')
    total_display.short_description = 'Total'
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Items'
    
    actions = ['mark_confirmed', 'mark_processing', 'mark_shipped', 'mark_delivered', 'mark_cancelled']
    
    @admin.action(description='Mark selected orders as Confirmed')
    def mark_confirmed(self, request, queryset):
        self._update_status(queryset, 'confirmed', request.user)
        self.message_user(request, f'{queryset.count()} orders confirmed.')
    
    @admin.action(description='Mark selected orders as Processing')
    def mark_processing(self, request, queryset):
        self._update_status(queryset, 'processing', request.user)
        self.message_user(request, f'{queryset.count()} orders now processing.')
    
    @admin.action(description='Mark selected orders as Shipped')
    def mark_shipped(self, request, queryset):
        self._update_status(queryset, 'shipped', request.user)
        self.message_user(request, f'{queryset.count()} orders shipped.')
    
    @admin.action(description='Mark selected orders as Delivered')
    def mark_delivered(self, request, queryset):
        self._update_status(queryset, 'delivered', request.user)
        self.message_user(request, f'{queryset.count()} orders delivered.')
    
    @admin.action(description='Cancel selected orders')
    def mark_cancelled(self, request, queryset):
        self._update_status(queryset, 'cancelled', request.user)
        self.message_user(request, f'{queryset.count()} orders cancelled.')
    
    def _update_status(self, queryset, new_status, user):
        for order in queryset:
            old_status = order.status
            order.status = new_status
            order.save()
            OrderStatusHistory.objects.create(
                order=order, old_status=old_status, new_status=new_status,
                changed_by=user, notes=f'Status changed via admin action'
            )
    
    def changelist_view(self, request, extra_context=None):
        qs = self.get_queryset(request)
        extra_context = extra_context or {}
        extra_context['order_summary'] = {
            'total_orders': qs.count(),
            'total_revenue': qs.aggregate(total=Sum('total_amount'))['total'] or 0,
            'pending_count': qs.filter(status='pending').count(),
            'today_orders': qs.filter(created_at__date=timezone.now().date()).count(),
        }
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'unit_price', 'total_price']
    list_filter = [('order__created_at', admin.DateFieldListFilter)]
    search_fields = ['order__order_number', 'product__name']
    readonly_fields = ['total_price']


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    """Read-only admin for status history audit trail"""
    list_display = ['order', 'status_change', 'changed_by', 'changed_at']
    list_filter = ['new_status', ('changed_at', admin.DateFieldListFilter)]
    search_fields = ['order__order_number', 'changed_by__email']
    readonly_fields = ['order', 'old_status', 'new_status', 'notes', 'changed_by', 'changed_at']
    
    def status_change(self, obj):
        old = obj.old_status or 'None'
        return format_html(
            '<span style="color:#9ca3af;">{}</span> → <span style="color:#22c55e;font-weight:bold;">{}</span>',
            old.title(), obj.new_status.title()
        )
    status_change.short_description = 'Status Change'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
