"""
Custom Permission Classes - Section D
Role-based permission classes for fine-grained access control.
"""
from rest_framework import permissions
from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Permission to only allow users with admin role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsDealerUser(BasePermission):
    """
    Permission to only allow users with dealer role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'dealer'
        )


class IsVerifiedDealer(BasePermission):
    """
    Permission to only allow verified dealers.
    Checks both role and dealer_profile.is_verified.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.role != 'dealer':
            return False
        
        # Check if dealer is verified
        try:
            return request.user.dealer_profile.is_verified
        except AttributeError:
            return False
    
    def has_object_permission(self, request, view, obj):
        # For object-level permissions, also check ownership
        return self.has_permission(request, view)


class IsCustomerUser(BasePermission):
    """
    Permission to only allow users with customer role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'customer'
        )


class IsAdminOrDealer(BasePermission):
    """
    Permission to allow both admins and dealers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'dealer']
        )


class IsAdminOrVerifiedDealer(BasePermission):
    """
    Permission to allow admins or verified dealers only.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin always has access
        if request.user.role == 'admin':
            return True
        
        # Dealer must be verified
        if request.user.role == 'dealer':
            try:
                return request.user.dealer_profile.is_verified
            except AttributeError:
                return False
        
        return False


class IsOwnerOrAdmin(BasePermission):
    """
    Permission that allows:
    - Admin users full access
    - Object owners access to their own objects
    - Dealers access to objects related to them
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        # Admin has full access
        if request.user.role == 'admin':
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        # For order items, check order ownership
        if hasattr(obj, 'order'):
            return obj.order.created_by == request.user
        
        # For cart items, check cart ownership
        if hasattr(obj, 'cart'):
            return obj.cart.user == request.user
        
        # For dealer-related objects
        if hasattr(obj, 'dealer'):
            return obj.dealer == request.user
        
        return False


class IsObjectOwner(BasePermission):
    """
    Permission that only allows the object owner access.
    More restrictive than IsOwnerOrAdmin.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        # Check various ownership patterns
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        return False


class IsStaffUser(BasePermission):
    """
    Permission to only allow staff users (is_staff=True).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )


class ReadOnly(BasePermission):
    """
    Permission that only allows read-only operations.
    """
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class IsDealerAndObjectOwner(BasePermission):
    """
    Permission for dealer portal - allows dealers to access only their own objects.
    Combines role check with ownership verification.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'dealer'
        )
    
    def has_object_permission(self, request, view, obj):
        # Must be a dealer
        if request.user.role != 'dealer':
            return False
        
        # Check if object belongs to this dealer
        if hasattr(obj, 'dealer'):
            return obj.dealer == request.user
        
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        # For orders, check if products are from this dealer
        if hasattr(obj, 'items'):
            # Check if any order item contains dealer's products
            for item in obj.items.all():
                if hasattr(item.product, 'dealer') and item.product.dealer == request.user:
                    return True
            return False
        
        return False


class IsCustomerOrAdmin(BasePermission):
    """
    Permission that allows customers (for their own data) or admins (for all data).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['customer', 'admin']
        )
    
    def has_object_permission(self, request, view, obj):
        # Admin has full access
        if request.user.role == 'admin':
            return True
        
        # Customer can only access their own objects
        if request.user.role == 'customer':
            if hasattr(obj, 'user'):
                return obj.user == request.user
            if hasattr(obj, 'customer'):
                return obj.customer == request.user
            if hasattr(obj, 'created_by'):
                return obj.created_by == request.user
        
        return False


class HasGroupPermission(BasePermission):
    """
    Permission that checks if user belongs to a specific Django Group.
    Usage: permission_classes = [HasGroupPermission]
    Set required_groups = ['GroupName'] in the view.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        required_groups = getattr(view, 'required_groups', [])
        
        if not required_groups:
            return True
        
        user_groups = set(request.user.groups.values_list('name', flat=True))
        required = set(required_groups)
        
        return bool(user_groups & required)  # Check intersection


# Permission combinations for common use cases
IsAuthenticatedReadOnly = [
    permissions.IsAuthenticated,
    ReadOnly
]

IsAdminOrReadOnly = [
    permissions.IsAuthenticated,
    IsAdminUser | ReadOnly
]

IsDealerOrReadOnly = [
    permissions.IsAuthenticated,
    IsDealerUser | ReadOnly
]
