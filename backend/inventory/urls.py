from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, InventoryViewSet, StockMovementViewSet, StockAlertViewSet, ManualStockAdjustmentView

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'', InventoryViewSet, basename='inventory')
router.register(r'movements', StockMovementViewSet, basename='stockmovement')
router.register(r'alerts', StockAlertViewSet, basename='stockalert')

urlpatterns = [
    path('', include(router.urls)),
    path('adjust/', ManualStockAdjustmentView.as_view(), name='stock-adjust'),
]
