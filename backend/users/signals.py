"""
Signal handlers for users app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserProfile, CustomerProfile, DealerProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create appropriate profile when user is created"""
    if created:
        # Create base UserProfile
        UserProfile.objects.get_or_create(user=instance)
        
        # Create role-specific profile
        if instance.role == 'customer':
            CustomerProfile.objects.get_or_create(user=instance)
        elif instance.role == 'dealer':
            DealerProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save user profile when user is saved"""
    if hasattr(instance, 'profile'):
        try:
            instance.profile.save()
        except Exception as e:
            # Log error but don't fail the entire save operation
            # This prevents disk I/O errors from breaking login
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to save user profile for {instance.id}: {e}")
