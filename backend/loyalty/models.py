from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class LoyaltyProgram(models.Model):
    """Main loyalty program configuration"""
    name = models.CharField(max_length=200, default="Glow Beyond Rewards")
    points_per_currency = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=1.0,
        help_text="Points earned per currency unit spent"
    )
    currency_value_per_point = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.01,
        help_text="Currency value of each point"
    )
    signup_bonus = models.PositiveIntegerField(default=100, help_text="Bonus points for new members")
    referral_bonus = models.PositiveIntegerField(default=50, help_text="Bonus points for referrals")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loyalty_programs'
        verbose_name = "Loyalty Program"
        verbose_name_plural = "Loyalty Programs"

    def __str__(self):
        return self.name

class LoyaltyAccount(models.Model):
    """Customer loyalty points account"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loyalty_account')
    points_balance = models.PositiveIntegerField(default=0)
    total_points_earned = models.PositiveIntegerField(default=0)
    total_points_redeemed = models.PositiveIntegerField(default=0)
    tier = models.CharField(
        max_length=20,
        choices=[
            ('bronze', 'Bronze'),
            ('silver', 'Silver'),
            ('gold', 'Gold'),
            ('platinum', 'Platinum'),
        ],
        default='bronze'
    )
    join_date = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'loyalty_accounts'
        verbose_name = "Loyalty Account"
        verbose_name_plural = "Loyalty Accounts"

    def __str__(self):
        return f"{self.user.username}'s Account - {self.points_balance} points"

    def calculate_tier(self):
        """Calculate tier based on total points earned"""
        total = self.total_points_earned
        if total >= 10000:
            return 'platinum'
        elif total >= 5000:
            return 'gold'
        elif total >= 2000:
            return 'silver'
        else:
            return 'bronze'

    def update_tier(self):
        """Update tier based on current points"""
        new_tier = self.calculate_tier()
        if new_tier != self.tier:
            self.tier = new_tier
            self.save()

class LoyaltyTransaction(models.Model):
    """Individual loyalty point transactions"""
    TRANSACTION_TYPES = [
        ('earned', 'Earned'),
        ('redeemed', 'Redeemed'),
        ('bonus', 'Bonus'),
        ('refunded', 'Refunded'),
        ('expired', 'Expired'),
    ]
    
    account = models.ForeignKey(LoyaltyAccount, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    points = models.IntegerField(help_text="Positive for earned, negative for redeemed")
    description = models.TextField()
    reference_id = models.CharField(max_length=100, blank=True, help_text="Order ID or other reference")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'loyalty_transactions'
        ordering = ['-created_at']
        verbose_name = "Loyalty Transaction"
        verbose_name_plural = "Loyalty Transactions"

    def __str__(self):
        return f"{self.account.user.username} - {self.transaction_type} {self.points} points"

class LoyaltyReward(models.Model):
    """Redeemable rewards"""
    name = models.CharField(max_length=200)
    description = models.TextField()
    points_required = models.PositiveIntegerField()
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(default=9999, help_text="Unlimited if 9999")
    image = models.ImageField(upload_to='loyalty_rewards/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'loyalty_rewards'
        verbose_name = "Loyalty Reward"
        verbose_name_plural = "Loyalty Rewards"

    def __str__(self):
        return f"{self.name} - {self.points_required} points"

class LoyaltyRedemption(models.Model):
    """Reward redemptions by users"""
    account = models.ForeignKey(LoyaltyAccount, on_delete=models.CASCADE, related_name='redemptions')
    reward = models.ForeignKey(LoyaltyReward, on_delete=models.CASCADE, related_name='redemptions')
    points_used = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('completed', 'Completed'),
        ],
        default='pending'
    )
    redeemed_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'loyalty_redemptions'
        ordering = ['-redeemed_at']
        verbose_name = "Loyalty Redemption"
        verbose_name_plural = "Loyalty Redemptions"

    def __str__(self):
        return f"{self.account.user.username} - {self.reward.name}"
