from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router for ViewSets - use 'list' prefix to avoid conflicts with explicit paths
router = DefaultRouter()
router.register(r'list', views.NotificationViewSet, basename='notification')

urlpatterns = [
    # Explicit paths must come before router include to avoid conflicts
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
    path('dealer/', views.dealer_notifications, name='dealer-notifications'),
    path('dealer/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    path('dealer/read-all/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    # Router URLs last
    path('', include(router.urls)),
]
