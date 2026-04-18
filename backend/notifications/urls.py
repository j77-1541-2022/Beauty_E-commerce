from django.urls import path
from . import views

urlpatterns = [
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
    path('dealer/', views.dealer_notifications, name='dealer-notifications'),
    path('dealer/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    path('dealer/read-all/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
]
