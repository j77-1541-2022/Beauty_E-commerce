"""
Unified API Response Format - Section C
Provides standardized response structure across all API endpoints.
"""
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from typing import Any, Dict, List, Optional


class APIResponseMixin:
    """
    Mixin for standardized API responses.
    
    Response envelope format:
    {
        "success": true/false,
        "data": {...} or [...],
        "message": "Human readable message",
        "meta": {
            "page": 1,
            "page_size": 20,
            "total": 100,
            ...
        }
    }
    """
    
    def success_response(
        self, 
        data: Any = None, 
        message: str = "Success",
        status_code: int = 200,
        meta: Optional[Dict] = None
    ) -> Response:
        """
        Return a standardized success response.
        
        Args:
            data: The response data (object, list, or any serializable)
            message: Human-readable success message
            status_code: HTTP status code (default 200)
            meta: Optional metadata for pagination, etc.
        
        Returns:
            Response object with standardized format
        """
        response_data = {
            "status": "success",
            "success": True,
            "data": data if data is not None else {},
            "message": message,
        }
        
        if meta:
            response_data["meta"] = meta
        
        return Response(response_data, status=status_code)
    
    def error_response(
        self,
        message: str = "An error occurred",
        code: str = "ERROR",
        errors: Optional[Dict] = None,
        status_code: int = 400
    ) -> Response:
        """
        Return a standardized error response.
        
        Args:
            message: Human-readable error message
            code: Error code for client handling
            errors: Optional field-specific errors dict
            status_code: HTTP status code (default 400)
        
        Returns:
            Response object with standardized error format
        """
        response_data = {
            "status": "error",
            "success": False,
            "message": message,
            "data": {},
            "error": {
                "code": code,
                "message": message,
            }
        }
        
        if errors:
            response_data["error"]["fields"] = errors
        
        return Response(response_data, status=status_code)
    
    def paginated_response(
        self,
        queryset,
        serializer_class,
        request,
        message: str = "Success",
        page_size: int = 20
    ) -> Response:
        """
        Return a standardized paginated response.
        
        Args:
            queryset: Django queryset to paginate
            serializer_class: Serializer class for data
            request: Current request object
            message: Success message
            page_size: Items per page
        
        Returns:
            Paginated Response with meta information
        """
        paginator = PageNumberPagination()
        paginator.page_size = page_size
        
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = serializer_class(page, many=True)
            
            meta = {
                "page": int(request.query_params.get('page', 1)),
                "page_size": page_size,
                "total": paginator.page.paginator.count,
                "total_pages": paginator.page.paginator.num_pages,
            }
            
            return self.success_response(
                data=serializer.data,
                message=message,
                meta=meta
            )
        
        # No pagination needed
        serializer = serializer_class(queryset, many=True)
        return self.success_response(data=serializer.data, message=message)


def build_success_response(
    data: Any = None,
    message: str = "Success",
    meta: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Build a standardized success response payload for function-based views."""
    payload: Dict[str, Any] = {
        "status": "success",
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    if meta:
        payload["meta"] = meta
    return payload


def build_error_response(
    message: str = "An error occurred",
    code: str = "ERROR",
    errors: Optional[Dict] = None,
    data: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Build a standardized error response payload for function-based views."""
    payload: Dict[str, Any] = {
        "status": "error",
        "success": False,
        "message": message,
        "data": data or {},
        "error": {
            "code": code,
            "message": message,
        },
    }
    if errors:
        payload["error"]["fields"] = errors
    return payload


# Standard error codes for use across the application
class ErrorCodes:
    """Standardized error codes for API responses"""
    
    # Validation Errors
    VALIDATION_ERROR = "VALIDATION_ERROR"
    REQUIRED_FIELD = "REQUIRED_FIELD"
    INVALID_FORMAT = "INVALID_FORMAT"
    
    # Authentication Errors
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_DISABLED = "ACCOUNT_DISABLED"
    
    # Authorization Errors
    PERMISSION_DENIED = "PERMISSION_DENIED"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
    
    # Resource Errors
    NOT_FOUND = "NOT_FOUND"
    ALREADY_EXISTS = "ALREADY_EXISTS"
    RESOURCE_IN_USE = "RESOURCE_IN_USE"
    
    # Payment Errors
    PAYMENT_FAILED = "PAYMENT_FAILED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_TIMEOUT = "PAYMENT_TIMEOUT"
    
    # Server Errors
    SERVER_ERROR = "SERVER_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"


# Mapping of error codes to HTTP status codes
ERROR_CODE_STATUS_MAP = {
    ErrorCodes.VALIDATION_ERROR: 400,
    ErrorCodes.REQUIRED_FIELD: 400,
    ErrorCodes.INVALID_FORMAT: 400,
    ErrorCodes.AUTHENTICATION_REQUIRED: 401,
    ErrorCodes.INVALID_CREDENTIALS: 401,
    ErrorCodes.TOKEN_EXPIRED: 401,
    ErrorCodes.TOKEN_INVALID: 401,
    ErrorCodes.ACCOUNT_LOCKED: 403,
    ErrorCodes.ACCOUNT_DISABLED: 403,
    ErrorCodes.PERMISSION_DENIED: 403,
    ErrorCodes.INSUFFICIENT_PERMISSIONS: 403,
    ErrorCodes.NOT_FOUND: 404,
    ErrorCodes.ALREADY_EXISTS: 409,
    ErrorCodes.RESOURCE_IN_USE: 409,
    ErrorCodes.PAYMENT_FAILED: 402,
    ErrorCodes.PAYMENT_PENDING: 402,
    ErrorCodes.PAYMENT_TIMEOUT: 408,
    ErrorCodes.SERVER_ERROR: 500,
    ErrorCodes.DATABASE_ERROR: 500,
    ErrorCodes.EXTERNAL_SERVICE_ERROR: 502,
}
