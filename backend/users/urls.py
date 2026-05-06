"""
URL configuration for users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, register_view, login_view, logout_view, token_refresh_view,
    profile_view, update_profile_view, dashboard_view, forgot_password_view, reset_password_view
)

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')

urlpatterns = [
    # Router URLs (includes auth/ endpoints)
    path('', include(router.urls)),
    
    # Standalone JWT-compatible endpoints
    path('auth/register/', register_view, name='register'),
    path('register/', register_view, name='register_alt'),  # Alternative direct path
    path('auth/token/', login_view, name='token_obtain_pair'),
    path('auth/token/refresh/', token_refresh_view, name='token_refresh'),
    path('auth/logout/', logout_view, name='logout'),
    
    # Profile endpoints
    path('profile/', profile_view, name='profile'),
    path('profile/update/', update_profile_view, name='update_profile'),
    
    # Dashboard endpoint
    path('dashboard/', dashboard_view, name='dashboard'),
    
    # Password reset endpoints
    path('auth/password/forgot/', forgot_password_view, name='forgot_password'),
    path('auth/password/reset/', reset_password_view, name='reset_password'),
]
