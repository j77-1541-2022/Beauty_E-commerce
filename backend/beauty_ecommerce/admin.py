"""
Django Admin Site Customization - Section B
Branded admin site for Glow Beyond Beauty with custom header, title, and index.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count, F


# Customize admin site branding
admin.site.site_header = 'Glow Beyond Beauty Admin'
admin.site.site_title = 'Glow Beyond Beauty'
admin.site.index_title = 'Dashboard'


class CustomAdminSite(admin.AdminSite):
    """
    Custom Admin Site with branded header and index page.
    Section B1 - Admin site customization.
    """
    site_header = 'Glow Beyond Beauty Admin'
    site_title = 'Glow Beyond Beauty'
    index_title = 'Admin Dashboard'
    site_url = '/'  # Link to frontend home
    
    def index(self, request, extra_context=None):
        """Custom index with dashboard widgets"""
        from django.db.models import Sum, Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Get app list with counts
        extra_context = extra_context or {}
        
        # Dashboard stats
        from orders.models import Order
        from products.models import Product
        from users.models import User
        from inventory.models import Inventory
        from django.db.models import Sum, Count, F
        
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        extra_context['dashboard_stats'] = {
            'total_users': User.objects.filter(is_active=True).count(),
            'new_users_today': User.objects.filter(date_joined__date=today).count(),
            'total_products': Product.objects.filter(is_active=True).count(),
            'total_orders': Order.objects.count(),
            'orders_today': Order.objects.filter(created_at__date=today).count(),
            'orders_week': Order.objects.filter(created_at__date__gte=week_ago).count(),
            'pending_orders': Order.objects.filter(status='pending').count(),
            'low_stock_items': Inventory.objects.filter(quantity__lte=F('reorder_level')).count(),
            'verified_dealers': User.objects.filter(role='dealer', dealer_profile__is_verified=True).count(),
        }
        
        # Recent orders
        extra_context['recent_orders'] = Order.objects.select_related('created_by').order_by('-created_at')[:10]
        
        # Low stock alerts
        extra_context['low_stock_alerts'] = Inventory.objects.filter(
            quantity__lte=F('reorder_level')
        ).select_related('product')[:5]
        
        return super().index(request, extra_context)


# Create custom admin site instance
custom_admin_site = CustomAdminSite(name='glow_admin')

# Alias for imports
admin_site = custom_admin_site


# Register models with custom admin
def get_admin_site():
    """Get the appropriate admin site"""
    return custom_admin_site
