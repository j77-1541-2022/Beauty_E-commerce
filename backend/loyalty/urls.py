from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoyaltyProgramViewSet, LoyaltyAccountViewSet, LoyaltyRewardViewSet, LoyaltyRedemptionViewSet

router = DefaultRouter()
router.register(r'programs', LoyaltyProgramViewSet, basename='loyalty-program')
router.register(r'accounts', LoyaltyAccountViewSet, basename='loyalty-account')
router.register(r'rewards', LoyaltyRewardViewSet, basename='loyalty-reward')
router.register(r'redemptions', LoyaltyRedemptionViewSet, basename='loyalty-redemption')

urlpatterns = [
    path('', include(router.urls)),
]
