from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DealerViewSet

# Create router for DealerViewSet
router = DefaultRouter()
router.register(r'', DealerViewSet, basename='dealer')

urlpatterns = [
    path('', include(router.urls)),
]

# Note: DealerViewSet uses @action decorators for API endpoints
# Available endpoints:
# GET    /api/v1/dealer/dashboard/           - Dealer dashboard statistics
# GET    /api/v1/dealer/profile/             - Get dealer profile
# PATCH  /api/v1/dealer/profile/             - Update dealer profile
#
# GET    /api/v1/dealer/products/            - List dealer products
# POST   /api/v1/dealer/products/            - Create new product
# GET    /api/v1/dealer/products/{id}/       - Get product detail
# PATCH  /api/v1/dealer/products/{id}/       - Update product
# DELETE /api/v1/dealer/products/{id}/       - Delete (deactivate) product
#
# GET    /api/v1/dealer/inventory/           - List dealer inventory
# POST   /api/v1/dealer/inventory/           - Create/update inventory for product
# PATCH  /api/v1/dealer/inventory/{id}/      - Update inventory stock
# POST   /api/v1/dealer/inventory/{id}/adjust/ - Adjust stock with reason
# GET    /api/v1/dealer/inventory_movements/ - Get stock movement history
#
# GET    /api/v1/dealer/orders/              - Get dealer orders
# GET    /api/v1/dealer/analytics/           - Get sales analytics
# GET    /api/v1/dealer/product_analytics/{id}/ - Get specific product analytics
# GET    /api/v1/dealer/reports/             - List dealer reports
# POST   /api/v1/dealer/reports/             - Generate new report
# GET    /api/v1/dealer/decision_metrics/    - Get decision support metrics
