from rest_framework import permissions

class IsDealer(permissions.BasePermission):
    """
    Permission class that checks if the user has dealer role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'dealer'
        )

class DealerRequiredMixin:
    """
    Mixin that ensures the user is a dealer.
    """
    permission_classes = [IsDealer]
