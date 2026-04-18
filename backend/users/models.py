from django.contrib.auth.models import AbstractUser, Group
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import os


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('dealer', 'Dealer'),
        ('customer', 'Customer'),
    ]
    
    # Override email to make it unique
    email = models.EmailField(_('email address'), unique=True)
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # New fields from Section A
    is_verified = models.BooleanField(default=False)
    last_active = models.DateTimeField(null=True, blank=True)
    profile_completion = models.IntegerField(default=0)  # 0-100
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    loyalty_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Account lockout fields
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users_user'
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def save(self, *args, **kwargs):
        # Check if role changed
        if self.pk:
            old_user = User.objects.filter(pk=self.pk).first()
            if old_user and old_user.role != self.role:
                self._update_group_assignment()
        else:
            # New user - group will be assigned after save
            pass
        
        super().save(*args, **kwargs)
        
        # Assign group for new users
        if not self.pk or not self.groups.exists():
            self._assign_group()
    
    def _assign_group(self):
        """Assign user to appropriate Django Group based on role"""
        group_mapping = {
            'admin': 'Administrators',
            'dealer': 'Dealers',
            'customer': 'Customers'
        }
        
        group_name = group_mapping.get(self.role)
        if group_name:
            try:
                group = Group.objects.get(name=group_name)
                self.groups.add(group)
            except Group.DoesNotExist:
                pass
    
    def _update_group_assignment(self):
        """Update group assignment when role changes"""
        # Remove from all role groups
        role_groups = ['Administrators', 'Dealers', 'Customers']
        for group_name in role_groups:
            try:
                group = Group.objects.get(name=group_name)
                self.groups.remove(group)
            except (Group.DoesNotExist, models.ObjectDoesNotExist):
                pass
    
    def delete(self, *args, **kwargs):
        """Soft delete: anonymize instead of hard delete"""
        # Mark as inactive
        self.is_active = False
        
        # Anonymize email
        self.email = f"deleted_{self.id}@glow.internal"
        
        # Clear personal data
        self.first_name = ""
        self.last_name = ""
        self.phone = None
        self.username = f"deleted_{self.id}"
        
        # Save without triggering signals
        self.save(update_fields=['is_active', 'email', 'first_name', 'last_name', 'phone', 'username'])
        
        # Note: Avatar file cleanup can be done in a signal or task
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return None
    
    def is_account_locked(self):
        """Check if account is temporarily locked due to failed login attempts"""
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False
    
    def record_failed_login(self):
        """Record a failed login attempt"""
        self.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.locked_until = timezone.now() + timezone.timedelta(minutes=15)
        
        self.save(update_fields=['failed_login_attempts', 'locked_until'])
    
    def reset_failed_logins(self):
        """Reset failed login counter on successful login"""
        if self.failed_login_attempts > 0:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=['failed_login_attempts', 'locked_until'])
    
    def update_last_active(self):
        """Update last active timestamp"""
        self.last_active = timezone.now()
        self.save(update_fields=['last_active'])
    
    def calculate_profile_completion(self):
        """Calculate profile completion percentage (0-100)"""
        fields = [
            ('first_name', 15),
            ('last_name', 15),
            ('email', 15),
            ('phone', 15),
            ('avatar', 20),
        ]
        
        total = 0
        for field, weight in fields:
            value = getattr(self, field)
            if value:
                total += weight
        
        self.profile_completion = min(total, 100)
        self.save(update_fields=['profile_completion'])
        return self.profile_completion
    
    @property
    def tier(self):
        """Calculate member tier based on loyalty points"""
        if self.loyalty_points >= 10000:
            return 'Platinum'
        elif self.loyalty_points >= 5000:
            return 'Gold'
        elif self.loyalty_points >= 1000:
            return 'Silver'
        return 'Bronze'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    address = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"


class CustomerProfile(models.Model):
    """Extended profile for customers"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    preferred_payment_method = models.CharField(max_length=20, blank=True, default='mpesa')
    newsletter_subscribed = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} (Customer Profile)"


class DealerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dealer_profile')
    business_name = models.CharField(max_length=200, blank=True)
    business_phone = models.CharField(max_length=20, blank=True, help_text="Primary contact phone (shown on products)")
    whatsapp_number = models.CharField(max_length=20, blank=True, help_text="WhatsApp number for customer contact")
    business_email = models.EmailField(blank=True, help_text="Business email for customer inquiries")
    # Precise location fields
    location = models.CharField(max_length=200, blank=True, help_text="Business location/address")
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True, default='Kenya')
    postal_code = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    # Business details
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    pending_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.business_name or self.user.username} (Dealer)"
    
    def verify(self):
        """Mark dealer as verified"""
        self.is_verified = True
        self.verified_at = timezone.now()
        self.save(update_fields=['is_verified', 'verified_at'])
    
    @property
    def full_address(self):
        """Return complete address string"""
        parts = [self.location, self.city, self.state, self.postal_code, self.country]
        return ', '.join(filter(None, parts))
    
    @property
    def contact_phone(self):
        """Return WhatsApp number if available, else business phone"""
        return self.whatsapp_number or self.business_phone
    
    @property
    def whatsapp_link(self):
        """Generate WhatsApp click-to-chat link"""
        phone = self.whatsapp_number or self.business_phone
        if phone:
            # Remove non-numeric characters
            clean_phone = ''.join(c for c in phone if c.isdigit())
            return f"https://wa.me/{clean_phone}"
        return None
    
    @property
    def email_link(self):
        """Generate mailto link"""
        email = self.business_email or self.user.email
        if email:
            return f"mailto:{email}?subject=Inquiry%20about%20your%20products%20on%20Glow%20Beyond"
        return None
