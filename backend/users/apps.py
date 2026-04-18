from django.apps import AppConfig
from django.db.models.signals import post_migrate


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    verbose_name = 'User Management'
    
    def ready(self):
        """Connect signals when app is ready"""
        import users.signals  # Import signals module
        
        # Connect post_migrate signal to ensure groups exist
        post_migrate.connect(create_groups, sender=self)


def create_groups(sender, **kwargs):
    """
    Create Django Groups programmatically after migrations.
    This ensures groups exist on every app startup.
    """
    from django.contrib.auth.models import Group, Permission
    
    GROUP_DEFINITIONS = {
        'Administrators': {
            'permissions': '__all__',
        },
        'Dealers': {
            'permissions': {
                'products': ['view_product', 'change_product'],
                'inventory': ['view_inventoryitem'],
                'orders': ['view_order', 'change_order'],
                'dealer': ['view_dealerprofile', 'change_dealerprofile'],
                'analytics': ['view_salereport'],
            }
        },
        'Customers': {
            'permissions': {
                'products': ['view_product'],
                'orders': ['view_order', 'add_order'],
                'cart': ['add_cartitem', 'change_cartitem', 'delete_cartitem', 'view_cartitem'],
                'wishlist': ['add_wishlistitem', 'delete_wishlistitem', 'view_wishlistitem'],
                'payments': ['add_payment', 'view_payment'],
            }
        },
    }
    
    for group_name, config in GROUP_DEFINITIONS.items():
        group, created = Group.objects.get_or_create(name=group_name)
        
        if config['permissions'] == '__all__':
            # Administrators get all permissions
            all_perms = Permission.objects.all()
            group.permissions.set(all_perms)
        else:
            # Specific permissions
            permissions_to_assign = []
            for app_label, codenames in config['permissions'].items():
                for codename in codenames:
                    try:
                        perm = Permission.objects.get(
                            content_type__app_label=app_label,
                            codename=codename
                        )
                        permissions_to_assign.append(perm)
                    except Permission.DoesNotExist:
                        pass  # Permission doesn't exist yet, will be created on next run
            
            group.permissions.set(permissions_to_assign)
