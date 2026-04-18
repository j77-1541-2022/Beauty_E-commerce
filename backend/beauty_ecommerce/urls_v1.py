"""
API Versioning Configuration - Section G1/G2
Adds /api/v1/ prefix to all API endpoints with backwards compatibility.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.smart_login import smart_login, validate_user_role

def health_check(request):
    """Health check endpoint with service status - Section M1"""
    from django.db import connection
    from django.core.cache import cache
    
    services = {
        'database': 'connected',
        'cache': 'connected'
    }
    
    # Check database
    try:
        connection.ensure_connection()
    except Exception:
        services['database'] = 'disconnected'
    
    # Check cache (if configured)
    try:
        cache.set('health_check', 'ok', 1)
        if cache.get('health_check') != 'ok':
            services['cache'] = 'disconnected'
    except Exception:
        services['cache'] = 'disconnected'
    
    status_code = 200 if all(s == 'connected' for s in services.values()) else 503
    
    return JsonResponse({
        'status': 'healthy' if status_code == 200 else 'unhealthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
        'services': services
    }, status=status_code)


# Import timezone here to avoid circular imports
from django.utils import timezone

# V1 API URLs
v1_urlpatterns = [
    # Auth endpoints
    path('auth/', include([
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('register/', include('users.urls')),  # Custom registration
    ])),
    path('users/', include('users.urls')),
    path('products/', include('products.urls')),
    path('inventory/', include('inventory.urls')),
    path('orders/', include('orders.urls')),
    path('audit/', include('audit.urls')),
    path('cart/', include('cart.urls')),
    path('wishlist/', include('wishlist.urls')),
    path('reviews/', include('reviews.urls')),
    path('payments/', include('payments.urls')),
    path('notifications/', include('notifications.urls')),
    path('dealer/', include('dealer.urls')),
]

# Legacy compatibility URLs (redirect to v1)
legacy_urlpatterns = [
    path('auth/token/', TokenObtainPairView.as_view()),
    path('auth/token/refresh/', TokenRefreshView.as_view()),
    path('users/', include('users.urls')),
    path('products/', include('products.urls')),
    path('inventory/', include('inventory.urls')),
    path('orders/', include('orders.urls')),
    path('audit/', include('audit.urls')),
    path('cart/', include('cart.urls')),
    path('wishlist/', include('wishlist.urls')),
    path('reviews/', include('reviews.urls')),
    path('payments/', include('payments.urls')),
    path('notifications/', include('notifications.urls')),
    path('dealer/', include('dealer.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(v1_urlpatterns)),  # Versioned API
    path('api/', include(legacy_urlpatterns)),  # Legacy compatibility
    path('api/health/', health_check, name='health_check'),
    path('api/smart-login/', smart_login, name='smart_login'),
    path('api/validate-role/', validate_user_role, name='validate_user_role'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
