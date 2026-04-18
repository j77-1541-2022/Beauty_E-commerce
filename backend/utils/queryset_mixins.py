"""
Role-Based Queryset Mixins - Section D
Provides data isolation based on user roles.
"""
from django.db.models import Q


class RoleBasedQuerysetMixin:
    """
    Mixin to filter queryset based on user role.
    
    Implements data isolation rules:
    - Admin: sees all data
    - Dealer: sees only their own data or data related to their products
    - Customer: sees only their own data
    
    Usage:
        class MyViewSet(RoleBasedQuerysetMixin, viewsets.ModelViewSet):
            def get_queryset(self):
                return self.filter_by_role(MyModel.objects.all())
    """
    
    def filter_by_role(self, queryset, user_field='user', dealer_field=None):
        """
        Filter queryset based on user role.
        
        Args:
            queryset: Base queryset to filter
            user_field: Field name for user relationship (default: 'user')
            dealer_field: Field name for dealer relationship (optional)
        
        Returns:
            Filtered queryset based on role
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        # Admin sees everything
        if user.role == 'admin':
            return queryset
        
        # Dealer sees their own data
        if user.role == 'dealer':
            filters = Q(**{user_field: user})
            
            # If dealer_field is specified, also filter by that
            if dealer_field:
                filters |= Q(**{dealer_field: user})
            
            # For products, check if product has dealer
            if hasattr(queryset.model, 'dealer'):
                filters |= Q(dealer=user)
            
            # For orders with items, check if any item's product belongs to dealer
            if hasattr(queryset.model, 'items'):
                # This is handled at serializer level or requires more complex filtering
                pass
            
            return queryset.filter(filters).distinct()
        
        # Customer sees only their own data
        if user.role == 'customer':
            return queryset.filter(**{user_field: user})
        
        return queryset.none()
    
    def get_role_filtered_queryset(self, queryset):
        """
        Convenience method that automatically detects the user field.
        Checks common field names: user, customer, created_by.
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        # Admin sees everything
        if user.role == 'admin':
            return queryset
        
        # Detect user relationship field
        model_fields = [f.name for f in queryset.model._meta.get_fields()]
        
        priority_fields = ['user', 'customer', 'created_by', 'owner']
        user_field = None
        
        for field in priority_fields:
            if field in model_fields:
                user_field = field
                break
        
        if not user_field:
            # No user field found, return empty
            return queryset.none()
        
        return self.filter_by_role(queryset, user_field=user_field)


class AdminFullAccessMixin:
    """
    Mixin that gives admin full access while restricting others.
    Combines with permission classes.
    """
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'admin':
            return queryset
        
        # Non-admins get filtered results
        return self.get_filtered_queryset(queryset)
    
    def get_filtered_queryset(self, queryset):
        """Override this method in subclasses to define filtering logic"""
        return queryset.none()


class DealerAccessMixin:
    """
    Mixin for dealer-specific access.
    Dealers see their own products, orders for their products, etc.
    """
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'admin':
            return queryset
        
        if user.role == 'dealer':
            return self.get_dealer_queryset(queryset, user)
        
        # Customers and others get nothing
        return queryset.none()
    
    def get_dealer_queryset(self, queryset, dealer):
        """Override to define dealer-specific filtering"""
        if hasattr(queryset.model, 'dealer'):
            return queryset.filter(dealer=dealer)
        return queryset.none()


class CustomerAccessMixin:
    """
    Mixin for customer-specific access.
    Customers see only their own orders, cart, wishlist, etc.
    """
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'admin':
            return queryset
        
        if user.role == 'customer':
            return self.get_customer_queryset(queryset, user)
        
        return queryset.none()
    
    def get_customer_queryset(self, queryset, customer):
        """Override to define customer-specific filtering"""
        # Try common field names
        model_fields = [f.name for f in queryset.model._meta.get_fields()]
        
        if 'user' in model_fields:
            return queryset.filter(user=customer)
        if 'customer' in model_fields:
            return queryset.filter(customer=customer)
        if 'created_by' in model_fields:
            return queryset.filter(created_by=customer)
        
        return queryset.none()


class CombinedRoleMixin(RoleBasedQuerysetMixin):
    """
    Combined mixin that handles all role types in one place.
    Most convenient for general use.
    """
    
    def get_queryset(self):
        queryset = super().get_queryset()
        return self.get_role_filtered_queryset(queryset)


# Helper function for manual queryset filtering
def filter_queryset_by_role(queryset, user, user_field='user', dealer_field=None):
    """
    Standalone function to filter queryset by user role.
    
    Args:
        queryset: Django queryset
        user: User instance
        user_field: Field name for user filtering
        dealer_field: Optional field for dealer filtering
    
    Returns:
        Filtered queryset
    """
    if not user.is_authenticated:
        return queryset.none()
    
    if user.role == 'admin':
        return queryset
    
    if user.role == 'dealer':
        from django.db.models import Q
        filters = Q(**{user_field: user})
        if dealer_field:
            filters |= Q(**{dealer_field: user})
        return queryset.filter(filters).distinct()
    
    if user.role == 'customer':
        return queryset.filter(**{user_field: user})
    
    return queryset.none()
