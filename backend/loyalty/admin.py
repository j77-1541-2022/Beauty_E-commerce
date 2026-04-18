from django.contrib import admin
from .models import LoyaltyProgram, LoyaltyAccount, LoyaltyTransaction, LoyaltyReward, LoyaltyRedemption

@admin.register(LoyaltyProgram)
class LoyaltyProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'points_per_currency', 'currency_value_per_point', 'signup_bonus', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(LoyaltyAccount)
class LoyaltyAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'points_balance', 'total_points_earned', 'tier', 'join_date', 'is_active']
    list_filter = ['tier', 'is_active', 'join_date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['join_date', 'last_activity']

@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ['account', 'transaction_type', 'points', 'description', 'reference_id', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['account__user__username', 'description', 'reference_id']
    readonly_fields = ['created_at']

@admin.register(LoyaltyReward)
class LoyaltyRewardAdmin(admin.ModelAdmin):
    list_display = ['name', 'points_required', 'discount_percentage', 'stock', 'is_active', 'expires_at']
    list_filter = ['is_active', 'expires_at']
    search_fields = ['name', 'description']

@admin.register(LoyaltyRedemption)
class LoyaltyRedemptionAdmin(admin.ModelAdmin):
    list_display = ['account', 'reward', 'points_used', 'status', 'redeemed_at', 'processed_at']
    list_filter = ['status', 'redeemed_at', 'processed_at']
    search_fields = ['account__user__username', 'reward__name']
    readonly_fields = ['redeemed_at']
