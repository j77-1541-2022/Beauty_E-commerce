from django.contrib import admin
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import json

@api_view(['GET'])
@permission_classes([AllowAny])
def check_admin_session(request):
    """
    Check if user is authenticated in Django admin session
    Returns user info if authenticated, null otherwise
    """
    if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
        user_data = {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'role': 'admin' if request.user.is_superuser else 'staff',
            'is_authenticated': True
        }
        return JsonResponse({'success': True, 'user': user_data})
    
    return JsonResponse({'success': False, 'user': None})

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_session_login(request):
    """
    Login user for frontend admin dashboard using Django admin session
    """
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Not authenticated in admin session'})
    
    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse({'success': False, 'error': 'Not an admin user'})
    
    # Generate JWT tokens for frontend
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(request.user)
    access = str(refresh.access_token)
    
    user_data = {
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'role': 'admin' if request.user.is_superuser else 'staff',
    }
    
    return JsonResponse({
        'success': True,
        'access': access,
        'refresh': str(refresh),
        'user': user_data
    })

# Custom admin site to add session detection
class CustomAdminSite(admin.AdminSite):
    site_header = "Glow Beyond Beauty Administration"
    site_title = "Glow Beyond Beauty Admin"
    index_title = "Welcome to Glow Beyond Beauty Administration"
    
    def index(self, request, extra_context=None):
        # Add session detection script to admin template context
        extra_context = extra_context or {}
        extra_context['has_frontend_access'] = True
        return super().index(request, extra_context)

# Create custom admin site
custom_admin_site = CustomAdminSite(name='custom_admin')
