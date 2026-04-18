"""
Audit Middleware - Section F
Automatically logs all API requests and responses.
"""
import json
import time
from django.utils import timezone
from django.http import HttpResponse

from .models import AuditLogManager


class AuditMiddleware:
    """
    Middleware to automatically log all API requests.
    Logs: user, action, resource, IP, user agent, and response status.
    """
    
    # Actions that should be logged
    LOGGABLE_ACTIONS = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    # Paths to exclude from logging
    EXCLUDED_PATHS = [
        '/health/',
        '/admin/',
        '/static/',
        '/media/',
        '/api/auth/token/refresh/',  # Token refresh is too frequent
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip logging for excluded paths
        if self._should_skip_logging(request):
            return self.get_response(request)
        
        # Record start time
        start_time = time.time()
        
        # Store request data for logging
        request_data = self._extract_request_data(request)
        
        # Process request
        response = self.get_response(request)
        
        # Calculate duration
        duration = round((time.time() - start_time) * 1000, 2)  # ms
        
        # Log if it's a mutating action
        if request.method in self.LOGGABLE_ACTIONS:
            self._log_request(request, response, request_data, duration)
        
        return response
    
    def _should_skip_logging(self, request):
        """Check if request path should be excluded from logging."""
        path = request.path
        
        for excluded in self.EXCLUDED_PATHS:
            if path.startswith(excluded):
                return True
        
        # Skip non-API requests
        if not path.startswith('/api/'):
            return True
        
        return False
    
    def _extract_request_data(self, request):
        """Extract relevant data from request."""
        data = {
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET),
        }
        
        # Try to get request body (for POST/PUT/PATCH)
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if request.content_type == 'application/json':
                    body = request.body.decode('utf-8')
                    data['body'] = json.loads(body) if body else {}
                else:
                    data['body'] = dict(request.POST)
            except (json.JSONDecodeError, UnicodeDecodeError):
                data['body'] = '<unparseable>'
        
        return data
    
    def _log_request(self, request, response, request_data, duration):
        """Log the API request."""
        try:
            user = request.user if request.user.is_authenticated else None
            
            # Determine action type
            action = self._get_action_type(request.method, request.path)
            
            # Extract resource type from URL
            resource_type = self._extract_resource_type(request.path)
            
            # Determine if request was successful
            success = 200 <= response.status_code < 400
            
            # Build metadata
            metadata = {
                'http_method': request.method,
                'path': request.path,
                'query_params': request_data.get('query_params', {}),
                'response_status': response.status_code,
                'duration_ms': duration,
            }
            
            # Add body if not sensitive
            body = request_data.get('body', {})
            if body and not self._is_sensitive_endpoint(request.path):
                # Remove sensitive fields
                if isinstance(body, dict):
                    sanitized_body = {k: v for k, v in body.items() 
                                      if k not in ['password', 'token', 'secret']}
                    metadata['request_body'] = sanitized_body
            
            # Create audit log
            AuditLogManager.log(
                user=user,
                action=action,
                resource_type=resource_type,
                resource_id=None,  # Will be extracted from response if available
                metadata=metadata,
                success=success,
                error_message=None if success else f'HTTP {response.status_code}',
                request=request
            )
            
        except Exception:
            # Don't let logging errors affect the request
            pass
    
    def _get_action_type(self, method, path):
        """Determine action type from HTTP method."""
        action_map = {
            'POST': 'CREATE',
            'PUT': 'UPDATE',
            'PATCH': 'UPDATE',
            'DELETE': 'DELETE',
        }
        
        # Check for special actions
        if 'login' in path.lower():
            return 'LOGIN'
        if 'logout' in path.lower():
            return 'LOGOUT'
        if 'register' in path.lower() or 'signup' in path.lower():
            return 'REGISTER'
        if 'status' in path.lower():
            return 'STATUS_CHANGE'
        if 'payment' in path.lower():
            return 'PAYMENT'
        
        return action_map.get(method, 'OTHER')
    
    def _extract_resource_type(self, path):
        """Extract resource type from URL path."""
        parts = path.strip('/').split('/')
        
        # Find resource name in path
        # Format: /api/v1/resource_name/
        for part in parts:
            if part not in ['api', 'v1', 'auth']:
                # Remove trailing 's' for singular form
                return part.rstrip('s').title()
        
        return 'API'
    
    def _is_sensitive_endpoint(self, path):
        """Check if endpoint contains sensitive data."""
        sensitive_patterns = ['password', 'login', 'token', 'auth']
        return any(pattern in path.lower() for pattern in sensitive_patterns)


class PerformanceMonitoringMiddleware:
    """
    Middleware to monitor and log slow requests.
    """
    
    SLOW_REQUEST_THRESHOLD = 1000  # ms
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        duration = (time.time() - start_time) * 1000
        
        if duration > self.SLOW_REQUEST_THRESHOLD:
            # Log slow request
            try:
                user = request.user if request.user.is_authenticated else None
                
                AuditLogManager.log(
                    user=user,
                    action='OTHER',
                    resource_type='Performance',
                    metadata={
                        'event': 'slow_request',
                        'path': request.path,
                        'method': request.method,
                        'duration_ms': round(duration, 2),
                        'threshold_ms': self.SLOW_REQUEST_THRESHOLD
                    },
                    notes=f"Slow request detected: {request.method} {request.path} took {duration:.2f}ms",
                    request=request
                )
            except Exception:
                pass
        
        return response
