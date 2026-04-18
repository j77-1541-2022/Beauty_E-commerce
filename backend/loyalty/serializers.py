from rest_framework import serializers
from .models import LoyaltyProgram, LoyaltyAccount, LoyaltyTransaction, LoyaltyReward, LoyaltyRedemption
from users.serializers import UserSerializer

class LoyaltyProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyProgram
        fields = '__all__'

class LoyaltyAccountSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    
    class Meta:
        model = LoyaltyAccount
        fields = ['id', 'user', 'points_balance', 'total_points_earned', 'total_points_redeemed', 
                  'tier', 'tier_display', 'join_date', 'last_activity', 'is_active']
        read_only_fields = ['user', 'join_date', 'last_activity']

class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    
    class Meta:
        model = LoyaltyTransaction
        fields = ['id', 'transaction_type', 'transaction_type_display', 'points', 'description', 
                  'reference_id', 'created_at']
        read_only_fields = ['account', 'created_at']

class LoyaltyRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyReward
        fields = '__all__'

class LoyaltyRedemptionSerializer(serializers.ModelSerializer):
    account = LoyaltyAccountSerializer(read_only=True)
    reward = LoyaltyRewardSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = LoyaltyRedemption
        fields = ['id', 'account', 'reward', 'points_used', 'status', 'status_display', 
                  'redeemed_at', 'processed_at', 'notes']
        read_only_fields = ['account', 'redeemed_at', 'processed_at']

class RedeemRewardSerializer(serializers.Serializer):
    reward_id = serializers.IntegerField()
