"""
Global Exception Handler - Section C
Custom exception handler for DRF that returns standardized error responses.
"""
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException, ValidationError, NotFound, PermissionDenied, AuthenticationFailed
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist, ValidationError as DjangoValidationError
from django.db import IntegrityError

from .api_response import ErrorCodes, ERROR_CODE_STATUS_MAP


def custom_exception_handler(exc, context):
    """
    Custom exception handler that converts all exceptions to standardized format.
    
    Args:
        exc: The exception that was raised
        context: The view context
    
    Returns:
        Response with standardized error format
    """
    # First, try to get DRF's default response
    response = exception_handler(exc, context)
    
    if response is not None:
        # DRF exception - format it
        return _format_drf_exception(exc, response)
    
    # Non-DRF exceptions - handle them
    return _handle_non_drf_exception(exc)


def _format_drf_exception(exc, response):
    """Format DRF exceptions to standardized response"""
    
    # Default error code
    error_code = ErrorCodes.SERVER_ERROR
    message = str(exc)
    errors = None
    
    # Map exception types to error codes
    if isinstance(exc, ValidationError):
        error_code = ErrorCodes.VALIDATION_ERROR
        message = "Validation failed. Please correct the errors below."
        errors = _extract_validation_errors(exc.detail)
    
    elif isinstance(exc, NotFound):
        error_code = ErrorCodes.NOT_FOUND
        message = "The requested resource was not found."
    
    elif isinstance(exc, PermissionDenied):
        error_code = ErrorCodes.PERMISSION_DENIED
        message = "You do not have permission to perform this action."
    
    elif isinstance(exc, AuthenticationFailed):
        error_code = ErrorCodes.AUTHENTICATION_REQUIRED
        message = "Authentication credentials were not provided or are invalid."
    
    elif hasattr(exc, 'status_code'):
        # Map status code to error code
        if exc.status_code == 429:
            error_code = "RATE_LIMIT_EXCEEDED"
            message = "Too many requests. Please try again later."
        elif exc.status_code == 405:
            error_code = "METHOD_NOT_ALLOWED"
            message = "This HTTP method is not allowed for this endpoint."
    
    # Build standardized response
    error_data = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
        }
    }
    
    if errors:
        error_data["error"]["fields"] = errors
    
    response.data = error_data
    return response


def _handle_non_drf_exception(exc):
    """Handle non-DRF Django exceptions"""
    
    error_code = ErrorCodes.SERVER_ERROR
    message = "An unexpected error occurred."
    status_code = 500
    
    # Django ObjectDoesNotExist
    if isinstance(exc, ObjectDoesNotExist):
        error_code = ErrorCodes.NOT_FOUND
        message = "The requested resource was not found."
        status_code = 404
    
    # Django ValidationError
    elif isinstance(exc, DjangoValidationError):
        error_code = ErrorCodes.VALIDATION_ERROR
        message = "Validation failed."
        if hasattr(exc, 'message_dict'):
            errors = exc.message_dict
        elif hasattr(exc, 'messages'):
            message = '; '.join(exc.messages)
            errors = {"non_field_errors": exc.messages}
        else:
            errors = {"non_field_errors": [str(exc)]}
        
        status_code = 400
    
    # Database IntegrityError
    elif isinstance(exc, IntegrityError):
        error_code = ErrorCodes.DATABASE_ERROR
        message = "A database error occurred. The resource may already exist."
        status_code = 409
    
    # Build response
    error_data = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
        }
    }
    
    # Add field errors if available
    if 'errors' in locals():
        error_data["error"]["fields"] = errors
    
    return Response(error_data, status=status_code)


def _extract_validation_errors(detail):
    """
    Extract field-specific validation errors from DRF ValidationError.
    
    Args:
        detail: The error detail from DRF
    
    Returns:
        Dict mapping field names to error messages
    """
    errors = {}
    
    if isinstance(detail, dict):
        for field, error_detail in detail.items():
            if isinstance(error_detail, list):
                errors[field] = [str(e) for e in error_detail]
            elif isinstance(error_detail, dict):
                errors[field] = _extract_validation_errors(error_detail)
            else:
                errors[field] = [str(error_detail)]
    elif isinstance(detail, list):
        errors["non_field_errors"] = [str(e) for e in detail]
    else:
        errors["non_field_errors"] = [str(detail)]
    
    return errors


# Custom DRF exceptions with specific error codes
class CustomAPIException(APIException):
    """Base class for custom API exceptions with error codes"""
    default_code = ErrorCodes.SERVER_ERROR
    default_message = "An error occurred."
    
    def __init__(self, message=None, code=None, **kwargs):
        if message is not None:
            self.default_detail = message
        if code is not None:
            self.default_code = code
        
        # Set appropriate status code
        if code in ERROR_CODE_STATUS_MAP:
            self.status_code = ERROR_CODE_STATUS_MAP[code]
        
        super().__init__(detail=self.default_detail, code=self.default_code)


class ValidationException(CustomAPIException):
    """Custom validation exception"""
    status_code = 400
    default_code = ErrorCodes.VALIDATION_ERROR
    default_detail = "Validation failed."


class AuthenticationException(CustomAPIException):
    """Custom authentication exception"""
    status_code = 401
    default_code = ErrorCodes.AUTHENTICATION_REQUIRED
    default_detail = "Authentication required."


class PermissionException(CustomAPIException):
    """Custom permission exception"""
    status_code = 403
    default_code = ErrorCodes.PERMISSION_DENIED
    default_detail = "Permission denied."


class NotFoundException(CustomAPIException):
    """Custom not found exception"""
    status_code = 404
    default_code = ErrorCodes.NOT_FOUND
    default_detail = "Resource not found."


class ConflictException(CustomAPIException):
    """Custom conflict exception (resource already exists)"""
    status_code = 409
    default_code = ErrorCodes.ALREADY_EXISTS
    default_detail = "Resource already exists."
