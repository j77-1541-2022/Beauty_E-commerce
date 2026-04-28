from django.db import models
from django.conf import settings
from users.models import DealerProfile


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'notifications'

    def __str__(self):
        return f"{self.user.email} - {self.title}"

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preference')
    order_updates = models.BooleanField(default=True)
    promotions = models.BooleanField(default=True)
    low_stock_alerts = models.BooleanField(default=True, help_text='For admin/dealer users only')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_preferences'

    def __str__(self):
        return f"{self.user.email} preferences"


class DealerNotification(models.Model):
    """Notifications for dealers (low stock, new orders, payment confirmations)"""
    NOTIFICATION_TYPES = [
        ('low_stock', 'Low Stock Alert'),
        ('new_order', 'New Order'),
        ('payment_confirmed', 'Payment Confirmed'),
        ('order_shipped', 'Order Shipped'),
        ('system', 'System Message'),
    ]

    dealer = models.ForeignKey(DealerProfile, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    reference_id = models.CharField(max_length=100, blank=True, help_text='Order ID, Product ID, etc.')
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'dealer_notifications'

    def __str__(self):
        return f"{self.dealer.business_name} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
