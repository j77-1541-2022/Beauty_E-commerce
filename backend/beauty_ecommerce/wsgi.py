import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')

# Get Django application
django_application = get_wsgi_application()

# Middleware wrapper to handle Railway proxy headers
class RailwayHostMiddleware:
    """
    Middleware to handle Railway's X-Forwarded-Host header and
    fix DisallowedHost errors by ensuring proper host configuration
    """
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        # Railway passes the original host via X-Forwarded-Host header
        if 'HTTP_X_FORWARDED_HOST' in environ:
            environ['HTTP_HOST'] = environ['HTTP_X_FORWARDED_HOST']
        
        return self.app(environ, start_response)

# Wrap the application with our middleware
application = RailwayHostMiddleware(django_application)
