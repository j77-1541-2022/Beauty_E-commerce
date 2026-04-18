"""
Audit Serializers - Section F
Serializers for AuditLog API.
"""
from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit log entries."""
    
    user_info = serializers.SerializerMethodField()
    changes_summary = serializers.SerializerMethodField()
    timestamp_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_info', 'user_email', 'user_role',
            'action', 'resource_type', 'resource_id', 'resource_name',
            'ip_address', 'before_state', 'after_state', 'changes_summary',
            'metadata', 'notes', 'success', 'error_message',
            'created_at', 'timestamp_formatted'
        ]
        read_only_fields = fields
    
    def get_user_info(self, obj):
        """Return user information if available."""
        if obj.user:
            return {
                'id': str(obj.user.id),
                'email': obj.user.email,
                'full_name': obj.user.get_full_name() if hasattr(obj.user, 'get_full_name') else obj.user.username
            }
        return None
    
    def get_changes_summary(self, obj):
        """Return human-readable changes summary."""
        return obj.get_changes_summary()
    
    def get_timestamp_formatted(self, obj):
        """Return formatted timestamp."""
        return obj.created_at.strftime('%Y-%m-%d %H:%M:%S') if obj.created_at else None


class AuditLogListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'user_email', 'resource_type',
            'resource_name', 'success', 'created_at'
        ]
