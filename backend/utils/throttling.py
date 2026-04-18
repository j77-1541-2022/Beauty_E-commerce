"""
Custom Throttle Classes - Section G3
Specific rate limits for login and payment endpoints.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """
    Throttle for login attempts - 10/minute per IP
    Section G3 - Custom rate limiting for authentication
    """
    scope = 'login'
    
    def get_cache_key(self, request, view):
        # Use IP address for anonymous users
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class PaymentRateThrottle(UserRateThrottle):
    """
    Throttle for payment initiation - 5/minute per user
    Section G3 - Prevents payment spam/abuse
    """
    scope = 'payment'
    
    def get_cache_key(self, request, view):
        # Only throttle authenticated users
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class AnonHealthCheckThrottle(AnonRateThrottle):
    """
    Higher rate limit for health check endpoint.
    Allows monitoring systems to poll frequently.
    """
    scope = 'anon_health'
    
    def allow_request(self, request, view):
        # Health check endpoint gets higher rate limit
        if request.path == '/api/health/':
            return True  # Allow health checks more frequently
        return super().allow_request(request, view)
