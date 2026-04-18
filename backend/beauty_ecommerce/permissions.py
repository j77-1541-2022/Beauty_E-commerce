from rest_framework import permissions

class IsDealerOrAdmin(permissions.BasePermission):
    """
    Custom permission to check if user is dealer or admin
    """
    def has_permission(self, request, view):
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        # Admin users have all permissions
        if user.is_staff or user.is_superuser:
            return True
        
        # Check if user is in dealers group
        return user.groups.filter(name='dealers').exists()

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to check if user owns the resource or is admin
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        # Admin users have all permissions
        if user.is_staff or user.is_superuser:
            return True
        
        # Check if user owns the object (for dealer products)
        if hasattr(obj, 'dealer'):
            return obj.dealer and obj.dealer.user == user
        
        # Check if user is the object (for dealer profile)
        if hasattr(obj, 'user'):
            return obj.user == user
        
        return False

class IsCustomer(permissions.BasePermission):
    """
    Custom permission to check if user is customer
    """
    def has_permission(self, request, view):
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        # Check if user is in customers group
        return user.groups.filter(name='customers').exists()

class IsOwner(permissions.BasePermission):
    """
    Custom permission to check if user owns the resource
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        # Check if user is the owner
        if hasattr(obj, 'user'):
            return obj.user == user
        
        # Check if user owns the dealer profile
        if hasattr(obj, 'dealer'):
            return obj.dealer and obj.dealer.user == user
        
        return False
