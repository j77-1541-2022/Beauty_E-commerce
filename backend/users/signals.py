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
        instance.profile.save()
