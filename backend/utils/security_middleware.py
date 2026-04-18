"""
Production Security Middleware - Section G5
Adds security headers for production deployment.
"""
from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers for production.
    Implements HSTS, CSP, and other security best practices.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Only add security headers in production
        if not settings.DEBUG:
            # HSTS - HTTP Strict Transport Security
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
            
            # Content Security Policy
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self' https://sandbox.safaricom.co.ke https://api.safaricom.co.ke; "
                "frame-ancestors 'none'; "
                "base-uri 'self';"
            )
            
            # Prevent content type sniffing
            response['X-Content-Type-Options'] = 'nosniff'
            
            # XSS Protection
            response['X-XSS-Protection'] = '1; mode=block'
            
            # Clickjacking protection
            response['X-Frame-Options'] = 'DENY'
            
            # Referrer Policy
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            
            # Permissions Policy
            response['Permissions-Policy'] = (
                'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
            )
        
        return response
