from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnalyticsViewSet,
    InventoryStatusReportView,
    LowStockReportView,
    StockMovementReportView,
    InventoryValuationReportView,
    ABCAnalysisView,
    EOQCalculatorView,
    ReorderRecommendationsView,
    ExportInventoryCSVView,
)

router = DefaultRouter()
router.register(r'', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
    # Inventory report endpoints
    path('inventory-status-report/', InventoryStatusReportView.as_view(), name='inventory-status-report'),
    path('low-stock-report/', LowStockReportView.as_view(), name='low-stock-report'),
    path('stock-movement-report/', StockMovementReportView.as_view(), name='stock-movement-report'),
    path('inventory-valuation-report/', InventoryValuationReportView.as_view(), name='inventory-valuation-report'),
    # DSS endpoints
    path('abc-analysis/', ABCAnalysisView.as_view(), name='abc-analysis'),
    path('eoq-calculator/', EOQCalculatorView.as_view(), name='eoq-calculator'),
    path('reorder-recommendations/', ReorderRecommendationsView.as_view(), name='reorder-recommendations'),
    # CSV export endpoint
    path('export-csv/', ExportInventoryCSVView.as_view(), name='export-csv'),
]
