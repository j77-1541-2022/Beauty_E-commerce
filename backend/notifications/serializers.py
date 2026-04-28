from rest_framework import serializers
from .models import NotificationPreference, DealerNotification, Notification

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['order_updates', 'promotions', 'low_stock_alerts', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class DealerNotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = DealerNotification
        fields = ['id', 'notification_type', 'title', 'message', 'is_read', 'reference_id', 'created_at', 'read_at', 'time_ago']
        read_only_fields = ['created_at', 'read_at']

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + ' ago'


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for in-app customer notifications"""
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'link', 'is_read', 'created_at', 'time_ago']
        read_only_fields = ['id', 'created_at']

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + ' ago'

