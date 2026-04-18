import django_filters
from .models import Product, StockMovement

class ProductFilter(django_filters.FilterSet):
    """
    Advanced product filtering with stock status
    """
    name = django_filters.CharFilter(lookup_expr='icontains')
    category = django_filters.ChoiceFilter(choices=Product.CATEGORY_CHOICES)
    brand = django_filters.CharFilter(lookup_expr='icontains')
    stock_status = django_filters.ChoiceFilter(choices=Product.STOCK_STATUS_CHOICES)
    is_active = django_filters.BooleanFilter()
    is_featured = django_filters.BooleanFilter()
    dealer = django_filters.CharFilter(field_name='dealer__business_name', lookup_expr='icontains')
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    
    # Stock-based filtering
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    available_for_customers = django_filters.BooleanFilter(method='filter_available_for_customers')
    low_stock = django_filters.BooleanFilter(method='filter_low_stock')
    
    class Meta:
        model = Product
        fields = [
            'name', 'category', 'brand', 'stock_status', 'is_active',
            'is_featured', 'dealer', 'price_min', 'price_max',
            'in_stock', 'available_for_customers', 'low_stock'
        ]
    
    def filter_in_stock(self, queryset, name, value):
        """Filter products that are in stock"""
        if value:
            return queryset.filter(stock_status='in_stock', stock_quantity__gt=0)
        return queryset
    
    def filter_available_for_customers(self, queryset, name, value):
        """Filter products available to customers"""
        if value:
            return queryset.filter(is_active=True, stock_status='in_stock', stock_quantity__gt=0)
        return queryset
    
    def filter_low_stock(self, queryset, name, value):
        """Filter products with low stock"""
        if value:
            return queryset.filter(
                stock_status='low_stock',
                stock_quantity__lte=F('low_stock_threshold')
            )
        return queryset

class StockMovementFilter(django_filters.FilterSet):
    """
    Stock movement filtering for audit trail
    """
    movement_type = django_filters.ChoiceFilter(choices=StockMovement.MOVEMENT_TYPES)
    product = django_filters.CharFilter(field_name='product__name', lookup_expr='icontains')
    created_by = django_filters.CharFilter(field_name='created_by__username', lookup_expr='icontains')
    date_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = StockMovement
        fields = [
            'movement_type', 'product', 'created_by', 'date_from', 'date_to'
        ]
