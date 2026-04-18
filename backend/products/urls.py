from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, BrandViewSet, ProductViewSet
from .admin_views import AdminProductViewSet

# Regular products router
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'', ProductViewSet, basename='product')

# Admin products router
admin_router = DefaultRouter()
admin_router.register(r'products', AdminProductViewSet, basename='admin-product')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include(admin_router.urls)),
]
