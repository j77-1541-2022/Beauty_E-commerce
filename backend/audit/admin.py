"""
Audit Admin Configuration - Section F
Read-only admin for audit logs with filtering and search.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Read-only admin for audit trail.
    Provides filtering, searching, and detailed views.
    """
    list_display = [
        'action_badge', 'user_email', 'user_role', 'resource_info',
        'ip_address', 'success_badge', 'created_at'
    ]
    list_filter = [
        'action', 'success', 'resource_type', 
        'user_role', ('created_at', admin.DateFieldListFilter)
    ]
    search_fields = [
        'user_email', 'resource_type', 'resource_name', 
        'resource_id', 'notes', 'error_message'
    ]
    readonly_fields = [
        'user', 'user_email', 'user_role', 'action', 'resource_type',
        'resource_id', 'resource_name', 'ip_address', 'user_agent',
        'before_state', 'after_state', 'metadata', 'notes',
        'success', 'error_message', 'created_at'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'user_email', 'user_role', 'ip_address', 'user_agent')
        }),
        ('Action Details', {
            'fields': ('action', 'resource_type', 'resource_id', 'resource_name')
        }),
        ('Data Changes', {
            'fields': ('before_state', 'after_state'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata', 'notes'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('success', 'error_message', 'created_at')
        }),
    )
    
    def has_add_permission(self, request):
        """Audit logs are read-only."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Audit logs cannot be modified."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Audit logs cannot be deleted through admin."""
        return False
    
    def action_badge(self, obj):
        """Colored badge for action type."""
        colors = {
            'CREATE': '#22c55e',      # green
            'UPDATE': '#3b82f6',      # blue
            'DELETE': '#ef4444',      # red
            'VIEW': '#6b7280',        # gray
            'LOGIN': '#8b5cf6',       # violet
            'LOGOUT': '#a855f7',      # purple
            'REGISTER': '#22c55e',    # green
            'STATUS_CHANGE': '#f59e0b', # amber
            'PAYMENT': '#10b981',     # emerald
            'ADMIN_ACTION': '#dc2626', # red-600
            'OTHER': '#9ca3af',       # gray-400
        }
        color = colors.get(obj.action, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;text-transform:uppercase;">{}</span>',
            color, obj.action
        )
    action_badge.short_description = 'Action'
    
    def success_badge(self, obj):
        """Success/failure badge."""
        if obj.success:
            return format_html(
                '<span style="background:#22c55e;color:white;padding:2px 8px;border-radius:9999px;font-size:11px;">✓ Success</span>'
            )
        return format_html(
            '<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:9999px;font-size:11px;">✗ Failed</span>'
        )
    success_badge.short_description = 'Status'
    
    def resource_info(self, obj):
        """Formatted resource information."""
        return format_html(
            '<strong>{}</strong><br/><small style="color:#6b7280;">{}</small>',
            obj.resource_type, obj.resource_name or obj.resource_id or '-'
        )
    resource_info.short_description = 'Resource'
    
    def changelist_view(self, request, extra_context=None):
        """Add summary stats to audit log changelist."""
        qs = self.get_queryset(request)
        
        extra_context = extra_context or {}
        extra_context['audit_summary'] = {
            'total_logs': qs.count(),
            'today_logs': qs.filter(created_at__date=timezone.now().date()).count(),
            'failed_actions': qs.filter(success=False).count(),
            'login_attempts': qs.filter(action='LOGIN').count(),
        }
        
        return super().changelist_view(request, extra_context=extra_context)
