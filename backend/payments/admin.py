"""
Payments Admin Configuration - Section B
Professional admin setup for Payment and PaymentCallback.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from .models import Payment, PaymentCallback


class PaymentCallbackInline(admin.TabularInline):
    model = PaymentCallback
    extra = 0
    readonly_fields = ['received_at']
    fields = ['received_at']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Payment admin with status badges and financial summaries.
    """
    list_display = [
        'order_link', 'amount_display', 
        'method_badge', 'status_badge', 'created_at'
    ]
    list_filter = [
        'status',
        ('created_at', admin.DateFieldListFilter)
    ]
    search_fields = ['order__order_number', 'mpesa_receipt_number']
    ordering = ['-created_at']
    readonly_fields = [
        'order', 'amount', 'status',
        'created_at', 'updated_at', 'mpesa_receipt_number', 
        'checkout_request_id'
    ]
    inlines = [PaymentCallbackInline]
    
    def order_link(self, obj):
        if obj.order:
            return format_html(
                '<a href="/admin/orders/order/{}/change/">{}</a>',
                obj.order.id, obj.order.order_number
            )
        return '-'
    order_link.short_description = 'Order'
    
    def amount_display(self, obj):
        return format_html('<span style="font-weight:bold;color:#22c55e;">KES {:.2f}</span>', obj.amount)
    amount_display.short_description = 'Amount'
    
    def method_badge(self, obj):
        return format_html(
            '<span style="background:#22c55e;color:white;padding:2px 8px;border-radius:9999px;font-size:11px;text-transform:uppercase;">M-PESA</span>'
        )
    method_badge.short_description = 'Method'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#f59e0b',
            'completed': '#22c55e',
            'failed': '#ef4444',
            'cancelled': '#6b7280',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;text-transform:uppercase;">{}</span>',
            color, obj.status
        )
    status_badge.short_description = 'Status'
    
    def has_add_permission(self, request):
        return False
    
    def changelist_view(self, request, extra_context=None):
        qs = self.get_queryset(request)
        extra_context = extra_context or {}
        extra_context['payment_summary'] = {
            'total_payments': qs.count(),
            'total_amount': qs.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0,
            'pending_count': qs.filter(status='pending').count(),
            'failed_count': qs.filter(status='failed').count(),
        }
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(PaymentCallback)
class PaymentCallbackAdmin(admin.ModelAdmin):
    list_display = ['payment', 'received_at']
    list_filter = [('received_at', admin.DateFieldListFilter)]
    search_fields = ['payment__mpesa_receipt_number']
    readonly_fields = ['payment', 'raw_response', 'received_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
