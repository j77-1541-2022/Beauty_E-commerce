"""
Root URL Configuration with API Versioning - Section G2
Supports both /api/v1/ (versioned) and /api/ (legacy) endpoints.
"""
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib import admin

# Section G4 - drf-spectacular imports
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

# Admin branding and top-right navigation target.
admin.site.site_header = "Glow Beyond Beauty Administration"
admin.site.site_title = "Glow Beyond Beauty Admin"
admin.site.index_title = "Welcome to Glow Beyond Beauty Administration"
admin.site.site_url = getattr(settings, 'ADMIN_SITE_URL', '/api/docs/')


def health_check(request):
    """
    Health check endpoint - Section M1
    Returns service status and health information.
    """
    from django.db import connection
    
    services = {
        'database': 'connected',
        'cache': 'connected'
    }
    
    # Check database
    try:
        connection.ensure_connection()
    except Exception:
        services['database'] = 'disconnected'
    
    # Check cache
    try:
        from django.core.cache import cache
        cache.set('health_check', 'ok', 1)
        if cache.get('health_check') != 'ok':
            services['cache'] = 'disconnected'
    except Exception:
        services['cache'] = 'disconnected'
    
    all_healthy = all(s == 'connected' for s in services.values())
    
    return JsonResponse({
        'status': 'healthy' if all_healthy else 'unhealthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
        'api_version': 'v1',
        'services': services
    }, status=200 if all_healthy else 503)


# V1 API URL configuration
v1_patterns = [
    path('auth/', include([
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    ])),
    path('users/', include('users.urls')),
    path('products/', include('products.urls')),
    path('inventory/', include('inventory.urls')),
    path('orders/', include('orders.urls')),
    path('audit/', include('audit.urls')),
    path('analytics/', include('analytics.urls')),
    path('cart/', include('cart.urls')),
    path('wishlist/', include('wishlist.urls')),
    path('reviews/', include('reviews.urls')),
    path('payments/', include('payments.urls')),
    path('notifications/', include('notifications.urls')),
    path('dealer/', include('dealer.urls')),
    path('loyalty/', include('loyalty.urls')),
]

# Legacy API patterns (backwards compatibility)
legacy_patterns = [
    path('auth/token/', TokenObtainPairView.as_view()),
    path('auth/token/refresh/', TokenRefreshView.as_view()),
    path('users/', include('users.urls')),
    path('products/', include('products.urls')),
    path('inventory/', include('inventory.urls')),
    path('orders/', include('orders.urls')),
    path('audit/', include('audit.urls')),
    path('analytics/', include('analytics.urls')),
    path('cart/', include('cart.urls')),
    path('wishlist/', include('wishlist.urls')),
    path('reviews/', include('reviews.urls')),
    path('payments/', include('payments.urls')),
    path('notifications/', include('notifications.urls')),
    path('dealer/', include('dealer.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(v1_patterns)),      # Versioned API - Section G2
    path('api/', include(legacy_patterns)),       # Legacy compatibility
    path('api/health/', health_check, name='health_check'),  # Section M1
    # Section G4 - Swagger/OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
