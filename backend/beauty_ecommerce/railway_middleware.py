"""
Railway proxy headers middleware
Handles X-Forwarded-Host and other proxy headers properly
"""
from django.conf import settings


class RailwayProxyHeadersMiddleware:
    """
    Middleware to handle Railway's proxy headers properly.
    Railway passes through X-Forwarded-Host which Django uses to validate hosts.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle X-Forwarded-Host from Railway proxy
        x_forwarded_host = request.META.get('HTTP_X_FORWARDED_HOST')
        if x_forwarded_host:
            request.META['HTTP_HOST'] = x_forwarded_host
        
        # Handle X-Forwarded-Proto for HTTPS
        x_forwarded_proto = request.META.get('HTTP_X_FORWARDED_PROTO')
        if x_forwarded_proto == 'https':
            request.META['wsgi.url_scheme'] = 'https'
        
        response = self.get_response(request)
        return response
