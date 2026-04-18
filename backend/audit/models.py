"""
Audit Trail System - Section F
Comprehensive audit logging for all system actions.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json
import uuid

User = get_user_model()


class AuditLog(models.Model):
    """
    Comprehensive audit log for tracking all system actions.
    """
    
    # Action types
    ACTION_TYPES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('VIEW', 'View'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('REGISTER', 'Register'),
        ('STATUS_CHANGE', 'Status Change'),
        ('PAYMENT', 'Payment'),
        ('EXPORT', 'Export'),
        ('IMPORT', 'Import'),
        ('ADMIN_ACTION', 'Admin Action'),
        ('OTHER', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # User information
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs'
    )
    user_email = models.EmailField(blank=True)  # Backup in case user is deleted
    user_role = models.CharField(max_length=20, blank=True)
    
    # Action details
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    resource_type = models.CharField(max_length=100)  # Model name or resource type
    resource_id = models.CharField(max_length=100, blank=True)  # Object ID or identifier
    resource_name = models.CharField(max_length=255, blank=True)  # Human-readable name
    
    # IP and location
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Data states
    before_state = models.JSONField(null=True, blank=True)
    after_state = models.JSONField(null=True, blank=True)
    
    # Additional metadata
    metadata = models.JSONField(null=True, blank=True)  # Additional context
    notes = models.TextField(blank=True)
    
    # Status
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
    
    def __str__(self):
        return f"{self.action} {self.resource_type} by {self.user_email or 'Anonymous'} at {self.created_at}"
    
    def get_changes_summary(self):
        """Generate a summary of changes between before and after states."""
        if not self.before_state or not self.after_state:
            return "No state change recorded"
        
        changes = []
        all_keys = set(self.before_state.keys()) | set(self.after_state.keys())
        
        for key in all_keys:
            old_val = self.before_state.get(key, '<not set>')
            new_val = self.after_state.get(key, '<not set>')
            
            if old_val != new_val:
                changes.append(f"{key}: {old_val} → {new_val}")
        
        return "; ".join(changes) if changes else "No changes detected"


class AuditLogManager:
    """
    Service class for creating and managing audit logs.
    """
    
    @staticmethod
    def log(
        user=None,
        action=None,
        resource_type=None,
        resource_id=None,
        resource_name=None,
        ip_address=None,
        user_agent=None,
        before_state=None,
        after_state=None,
        metadata=None,
        notes=None,
        success=True,
        error_message=None,
        request=None
    ):
        """
        Create an audit log entry.
        
        Args:
            user: User instance
            action: Action type (from ACTION_TYPES)
            resource_type: Model name or resource type
            resource_id: Object ID
            resource_name: Human-readable name
            ip_address: Client IP address
            user_agent: Client user agent
            before_state: Dict of state before action
            after_state: Dict of state after action
            metadata: Additional context
            notes: Human-readable notes
            success: Whether action succeeded
            error_message: Error message if failed
            request: Django request object (auto-extracts IP and user agent)
        
        Returns:
            Created AuditLog instance
        """
        # Extract from request if provided
        if request:
            ip_address = ip_address or AuditLogManager._get_client_ip(request)
            user_agent = user_agent or request.META.get('HTTP_USER_AGENT', '')
            user = user or (request.user if request.user.is_authenticated else None)
        
        # Serialize states
        before_json = AuditLogManager._serialize_state(before_state) if before_state else None
        after_json = AuditLogManager._serialize_state(after_state) if after_state else None
        
        # Create log entry
        log = AuditLog.objects.create(
            user=user,
            user_email=user.email if user else '',
            user_role=getattr(user, 'role', '') if user else '',
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else '',
            resource_name=resource_name or '',
            ip_address=ip_address,
            user_agent=user_agent or '',
            before_state=before_json,
            after_state=after_json,
            metadata=metadata or {},
            notes=notes or '',
            success=success,
            error_message=error_message or ''
        )
        
        return log
    
    @staticmethod
    def log_model_change(instance, action, user=None, request=None, notes=None):
        """
        Log a model instance change (create, update, delete).
        
        Args:
            instance: Model instance
            action: 'CREATE', 'UPDATE', or 'DELETE'
            user: User who made the change
            request: Django request object
            notes: Additional notes
        """
        resource_type = instance.__class__.__name__
        resource_id = str(instance.pk)
        resource_name = str(instance)[:255]
        
        if action == 'DELETE':
            before_state = AuditLogManager._serialize_model(instance)
            after_state = None
        elif action == 'CREATE':
            before_state = None
            after_state = AuditLogManager._serialize_model(instance)
        else:  # UPDATE
            before_state = getattr(instance, '_previous_state', None)
            after_state = AuditLogManager._serialize_model(instance)
        
        return AuditLogManager.log(
            user=user,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            before_state=before_state,
            after_state=after_state,
            notes=notes,
            request=request
        )
    
    @staticmethod
    def log_login(user, request, success=True, error_message=None):
        """Log a login attempt."""
        return AuditLogManager.log(
            user=user if success else None,
            action='LOGIN',
            resource_type='User',
            resource_id=str(user.id) if user else None,
            resource_name=user.email if user else 'Anonymous',
            success=success,
            error_message=error_message,
            request=request
        )
    
    @staticmethod
    def log_logout(user, request):
        """Log a logout action."""
        return AuditLogManager.log(
            user=user,
            action='LOGOUT',
            resource_type='User',
            resource_id=str(user.id),
            resource_name=user.email,
            request=request
        )
    
    @staticmethod
    def log_registration(user, request):
        """Log a user registration."""
        return AuditLogManager.log(
            user=user,
            action='REGISTER',
            resource_type='User',
            resource_id=str(user.id),
            resource_name=user.email,
            request=request,
            notes=f"New user registered with role: {user.role}"
        )
    
    @staticmethod
    def log_order_status_change(order, old_status, new_status, user, request=None, notes=None):
        """Log an order status change."""
        return AuditLogManager.log(
            user=user,
            action='STATUS_CHANGE',
            resource_type='Order',
            resource_id=str(order.id),
            resource_name=order.order_number,
            before_state={'status': old_status},
            after_state={'status': new_status},
            notes=notes or f"Status changed from {old_status} to {new_status}",
            request=request
        )
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @staticmethod
    def _serialize_state(state):
        """Serialize state dict to JSON-compatible format."""
        if state is None:
            return None
        
        def serialize_value(value):
            if hasattr(value, 'isoformat'):  # datetime
                return value.isoformat()
            if isinstance(value, models.Model):
                return str(value)
            return value
        
        return {k: serialize_value(v) for k, v in state.items()}
    
    @staticmethod
    def _serialize_model(instance):
        """Serialize a model instance to dict."""
        data = {}
        for field in instance._meta.fields:
            value = getattr(instance, field.name)
            if value is None:
                data[field.name] = None
            elif hasattr(value, 'isoformat'):  # datetime
                data[field.name] = value.isoformat()
            elif isinstance(value, models.Model):
                data[field.name] = str(value)
            else:
                data[field.name] = value
        return data


# Model mixin to track changes
class AuditableModelMixin:
    """
    Mixin to add audit logging to models.
    Usage: class MyModel(AuditableModelMixin, models.Model):
    """
    
    def save(self, *args, **kwargs):
        """Override save to track changes."""
        if self.pk:
            # Store previous state before update
            try:
                old_instance = self.__class__.objects.get(pk=self.pk)
                self._previous_state = AuditLogManager._serialize_model(old_instance)
            except self.__class__.DoesNotExist:
                self._previous_state = None
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Override delete to log deletion."""
        # Store state before deletion
        self._deleted_state = AuditLogManager._serialize_model(self)
        super().delete(*args, **kwargs)
