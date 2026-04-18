from django.contrib import admin
from .models import NotificationPreference

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'order_updates', 'promotions', 'low_stock_alerts', 'updated_at']
    list_filter = ['order_updates', 'promotions']
    search_fields = ['user__email', 'user__username']
