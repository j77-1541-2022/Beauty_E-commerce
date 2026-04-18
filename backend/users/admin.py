"""
Comprehensive Django Admin Configuration
Section B - Professional admin panel setup with custom ModelAdmins for all models.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
import datetime

from .models import UserProfile, CustomerProfile, DealerProfile

User = get_user_model()


# Inline Admins
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('avatar', 'bio', 'address')
    extra = 0


class CustomerProfileInline(admin.StackedInline):
    model = CustomerProfile
    can_delete = False
    verbose_name_plural = 'Customer Profile'
    fields = ('preferred_payment_method', 'newsletter_subscribed', 'date_of_birth')
    extra = 0


class DealerProfileInline(admin.StackedInline):
    model = DealerProfile
    can_delete = False
    verbose_name_plural = 'Dealer Profile'
    fields = (
        'business_name', 'business_phone', 'location', 'commission_rate',
        'is_verified', 'verified_at', 'total_earnings', 'pending_payout'
    )
    readonly_fields = ('verified_at', 'total_earnings', 'pending_payout')
    extra = 0


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """
    Section B2 - User Admin with role badges, filtering, and actions.
    """
    list_display = [
        'email', 'full_name', 'role_badge', 'is_active', 
        'is_verified', 'last_active_display', 'date_joined'
    ]
    list_filter = [
        'role', 'is_active', 'is_verified', 'groups', 
        ('date_joined', admin.DateFieldListFilter),
        ('last_active', admin.DateFieldListFilter)
    ]
    search_fields = ['email', 'first_name', 'last_name', 'phone', 'username']
    ordering = ['-date_joined']
    
    readonly_fields = [
        'last_active', 'date_joined', 'profile_completion', 
        'last_login', 'failed_login_attempts', 'locked_until'
    ]
    
    fieldsets = (
        ('Account', {
            'fields': ('email', 'password', 'role', 'groups')
        }),
        ('Personal', {
            'fields': ('first_name', 'last_name', 'phone', 'avatar')
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified', 'is_staff', 'is_superuser', 'profile_completion')
        }),
        ('Security', {
            'fields': ('failed_login_attempts', 'locked_until'),
            'classes': ('collapse',)
        }),
        ('Activity', {
            'fields': ('last_active', 'last_login', 'date_joined'), 
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )
    
    actions = ['verify_users', 'deactivate_users', 'activate_users', 'assign_to_group_dealer']
    
    def get_inlines(self, request, obj=None):
        """Show appropriate inline based on user role"""
        if obj is None:
            return [UserProfileInline]
        
        inlines = [UserProfileInline]
        if obj.role == 'customer':
            inlines.append(CustomerProfileInline)
        elif obj.role == 'dealer':
            inlines.append(DealerProfileInline)
        return inlines
    
    def role_badge(self, obj):
        """Colored role badge display"""
        colors = {
            'admin': '#dc2626',      # red-600
            'dealer': '#7c3aed',     # violet-600
            'customer': '#0891b2',   # cyan-600
            'staff': '#ea580c',      # orange-600
        }
        color = colors.get(obj.role, '#6b7280')  # gray-500 default
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;text-transform:uppercase;">{}</span>',
            color, obj.role
        )
    role_badge.short_description = 'Role'
    role_badge.admin_order_field = 'role'
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Name'
    
    def last_active_display(self, obj):
        if obj.last_active:
            return obj.last_active.strftime('%Y-%m-%d %H:%M')
        return 'Never'
    last_active_display.short_description = 'Last Active'
    
    # Actions
    @admin.action(description='Verify selected users')
    def verify_users(self, request, queryset):
        queryset.update(is_verified=True)
        self.message_user(request, f'{queryset.count()} users verified.')
    
    @admin.action(description='Deactivate selected users')
    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} users deactivated.')
    
    @admin.action(description='Activate selected users')
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f'{queryset.count()} users activated.')
    
    @admin.action(description='Assign selected users to Dealers group')
    def assign_to_group_dealer(self, request, queryset):
        from django.contrib.auth.models import Group
        try:
            dealer_group = Group.objects.get(name='Dealers')
            for user in queryset:
                user.groups.add(dealer_group)
                user.role = 'dealer'
                user.save()
            self.message_user(request, f'{queryset.count()} users assigned to Dealers group.')
        except Group.DoesNotExist:
            self.message_user(request, 'Dealers group not found. Run setup_groups first.', level='error')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'email', 'has_avatar', 'has_bio')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('user',)
    
    def email(self, obj):
        return obj.user.email
    email.short_description = 'Email'
    
    def has_avatar(self, obj):
        if obj.avatar:
            return format_html(
                '<img src="{}" width="40" height="40" style="border-radius: 50%;object-fit:cover;" />', 
                obj.avatar.url
            )
        return format_html('<span style="color:#9ca3af;">No avatar</span>')
    has_avatar.short_description = 'Avatar'
    
    def has_bio(self, obj):
        if obj.bio:
            return format_html('<span style="color:#22c55e;">✓</span>')
        return format_html('<span style="color:#9ca3af;">-</span>')
    has_bio.short_description = 'Bio'


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'preferred_payment_method', 'newsletter_subscribed', 'date_of_birth']
    list_filter = ['preferred_payment_method', 'newsletter_subscribed', ('date_of_birth', admin.DateFieldListFilter)]
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['user']


@admin.register(DealerProfile)
class DealerProfileAdmin(admin.ModelAdmin):
    list_display = [
        'business_name', 'user_email', 'location', 'is_verified',
        'total_earnings', 'pending_payout', 'commission_rate'
    ]
    list_filter = ['is_verified', 'commission_rate', ('created_at', admin.DateFieldListFilter)]
    search_fields = ['business_name', 'user__email', 'location']
    readonly_fields = ['verified_at', 'total_earnings', 'pending_payout', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Business Information', {
            'fields': ('business_name', 'business_phone', 'location')
        }),
        ('Verification', {
            'fields': ('is_verified', 'verified_at')
        }),
        ('Financial', {
            'fields': ('commission_rate', 'total_earnings', 'pending_payout')
        }),
        ('Account', {
            'fields': ('user',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['verify_dealers']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
    
    @admin.action(description='Verify selected dealers')
    def verify_dealers(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_verified=True, verified_at=timezone.now())
        self.message_user(request, f'{queryset.count()} dealers verified.')
