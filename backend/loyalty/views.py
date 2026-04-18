from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import LoyaltyProgram, LoyaltyAccount, LoyaltyTransaction, LoyaltyReward, LoyaltyRedemption
from .serializers import (
    LoyaltyProgramSerializer, 
    LoyaltyAccountSerializer, 
    LoyaltyTransactionSerializer,
    LoyaltyRewardSerializer,
    LoyaltyRedemptionSerializer,
    RedeemRewardSerializer
)

class LoyaltyProgramViewSet(viewsets.ModelViewSet):
    queryset = LoyaltyProgram.objects.all()
    serializer_class = LoyaltyProgramSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return LoyaltyProgram.objects.all()
        return LoyaltyProgram.objects.filter(is_active=True)

class LoyaltyAccountViewSet(viewsets.ModelViewSet):
    serializer_class = LoyaltyAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return LoyaltyAccount.objects.all()
        return LoyaltyAccount.objects.filter(user=self.request.user)

    def get_object(self):
        if self.action in ['my_account', 'earn_points', 'redeem_points']:
            account, created = LoyaltyAccount.objects.get_or_create(
                user=self.request.user,
                defaults={'points_balance': 100}  # Signup bonus
            )
            if created:
                # Create signup bonus transaction
                LoyaltyTransaction.objects.create(
                    account=account,
                    transaction_type='bonus',
                    points=100,
                    description='Welcome bonus for joining Glow Beyond Rewards'
                )
            return account
        return super().get_object()

    @action(detail=False, methods=['get'])
    def my_account(self, request):
        """Get current user's loyalty account"""
        account = self.get_object()
        account.update_tier()
        serializer = self.get_serializer(account)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def earn_points(self, request):
        """Add points to user's account (called after order completion)"""
        account = self.get_object()
        points = request.data.get('points', 0)
        description = request.data.get('description', 'Points earned')
        reference_id = request.data.get('reference_id', '')
        
        if points <= 0:
            return Response(
                {'error': 'Points must be positive'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create transaction
        transaction = LoyaltyTransaction.objects.create(
            account=account,
            transaction_type='earned',
            points=points,
            description=description,
            reference_id=reference_id
        )
        
        # Update account
        account.points_balance += points
        account.total_points_earned += points
        account.update_tier()
        account.save()
        
        return Response({
            'success': True,
            'new_balance': account.points_balance,
            'tier': account.tier,
            'transaction_id': transaction.id
        })

    @action(detail=False, methods=['post'])
    def redeem_points(self, request):
        """Redeem points for a reward"""
        serializer = RedeemRewardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        account = self.get_object()
        reward = get_object_or_404(LoyaltyReward, id=serializer.validated_data['reward_id'])
        
        if not reward.is_active:
            return Response(
                {'error': 'Reward is not available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if account.points_balance < reward.points_required:
            return Response(
                {'error': 'Insufficient points'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create redemption
        redemption = LoyaltyRedemption.objects.create(
            account=account,
            reward=reward,
            points_used=reward.points_required
        )
        
        # Deduct points
        account.points_balance -= reward.points_required
        account.total_points_redeemed += reward.points_required
        account.save()
        
        return Response({
            'success': True,
            'new_balance': account.points_balance,
            'redemption_id': redemption.id
        })

    @action(detail=False, methods=['get'])
    def transactions(self, request):
        """Get user's loyalty transaction history"""
        account = self.get_object()
        transactions = account.transactions.all()
        serializer = LoyaltyTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

class LoyaltyRewardViewSet(viewsets.ModelViewSet):
    queryset = LoyaltyReward.objects.filter(is_active=True)
    serializer_class = LoyaltyRewardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return LoyaltyReward.objects.all()
        return LoyaltyReward.objects.filter(is_active=True)

class LoyaltyRedemptionViewSet(viewsets.ModelViewSet):
    serializer_class = LoyaltyRedemptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return LoyaltyRedemption.objects.all()
        return LoyaltyRedemption.objects.filter(account__user=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Admin: Approve a redemption"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        redemption = self.get_object()
        redemption.status = 'approved'
        redemption.processed_at = timezone.now()
        redemption.save()
        
        return Response({'status': 'redemption approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Admin: Reject a redemption and refund points"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        redemption = self.get_object()
        redemption.status = 'rejected'
        redemption.processed_at = timezone.now()
        redemption.save()
        
        # Refund points
        account = redemption.account
        account.points_balance += redemption.points_used
        account.save()
        
        # Create refund transaction
        LoyaltyTransaction.objects.create(
            account=account,
            transaction_type='refunded',
            points=redemption.points_used,
            description=f'Refund for rejected redemption: {redemption.reward.name}',
            reference_id=str(redemption.id)
        )
        
        return Response({'status': 'redemption rejected, points refunded'})
