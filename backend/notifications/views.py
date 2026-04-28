from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from django.utils import timezone
from .models import NotificationPreference, DealerNotification, Notification
from .serializers import NotificationPreferenceSerializer, DealerNotificationSerializer, NotificationSerializer
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


class NotificationViewSet(viewsets.ModelViewSet):
    """API ViewSet for customer in-app notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        """Filter notifications to current user only"""
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """GET /api/notifications/ - List user's notifications with unread count"""
        queryset = self.get_queryset()
        
        # Filter by unread if requested
        unread_only = request.query_params.get('unread', 'false').lower() == 'true'
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        # Limit results
        limit = int(request.query_params.get('limit', 20))
        queryset = queryset[:limit]
        
        serializer = self.get_serializer(queryset, many=True)
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count,
            'total_count': Notification.objects.filter(user=request.user).count()
        })

    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """POST /api/notifications/{id}/mark-as-read/ - Mark specific notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='mark-all-as-read')
    def mark_all_as_read(self, request):
        """POST /api/notifications/mark-all-as-read/ - Mark all notifications as read"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({
            'success': True,
            'message': f'Marked {count} notifications as read'
        })

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """GET /api/notifications/unread-count/ - Get count of unread notifications"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({
            'unread_count': count
        })

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/notifications/{id}/ - Delete a notification"""
        notification = self.get_object()
        notification.delete()
        return Response(
            {'success': True, 'message': 'Notification deleted'},
            status=status.HTTP_204_NO_CONTENT
        )
