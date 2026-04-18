from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from .models import NotificationPreference, DealerNotification
from .serializers import NotificationPreferenceSerializer, DealerNotificationSerializer
from users.models import DealerProfile


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        preference, created = NotificationPreference.objects.get_or_create(
            user=self.request.user,
            defaults={'order_updates': True, 'promotions': True, 'low_stock_alerts': True}
        )
        return preference

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dealer_notifications(request):
    """Get dealer notifications with unread count"""
    try:
        dealer = DealerProfile.objects.get(user=request.user)
    except DealerProfile.DoesNotExist:
        return Response({'error': 'Dealer profile not found'}, status=403)

    # Get query parameters
    unread_only = request.query_params.get('unread', 'false').lower() == 'true'
    limit = int(request.query_params.get('limit', 20))

    notifications = DealerNotification.objects.filter(dealer=dealer)
    if unread_only:
        notifications = notifications.filter(is_read=False)

    notifications = notifications[:limit]
    unread_count = DealerNotification.objects.filter(dealer=dealer, is_read=False).count()

    serializer = DealerNotificationSerializer(notifications, many=True)
    return Response({
        'notifications': serializer.data,
        'unread_count': unread_count
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a specific notification as read"""
    try:
        dealer = DealerProfile.objects.get(user=request.user)
        notification = DealerNotification.objects.get(id=notification_id, dealer=dealer)
        notification.mark_as_read()
        return Response({'success': True, 'message': 'Notification marked as read'})
    except DealerProfile.DoesNotExist:
        return Response({'error': 'Dealer profile not found'}, status=403)
    except DealerNotification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    try:
        dealer = DealerProfile.objects.get(user=request.user)
        DealerNotification.objects.filter(dealer=dealer, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({'success': True, 'message': 'All notifications marked as read'})
    except DealerProfile.DoesNotExist:
        return Response({'error': 'Dealer profile not found'}, status=403)
