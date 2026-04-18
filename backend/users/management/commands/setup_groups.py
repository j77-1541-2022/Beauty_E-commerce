"""
Management command to create Django Groups and assign permissions.
Run: python manage.py setup_groups
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db import transaction


class Command(BaseCommand):
    help = 'Create Django Groups (Administrators, Dealers, Customers) with proper permissions'

    GROUP_PERMISSIONS = {
        'Administrators': {
            'description': 'Full system access - ALL permissions on ALL models',
            'permissions': '__all__',  # Special marker for all permissions
        },
        'Dealers': {
            'description': 'Dealer portal access - manage their products and orders',
            'permissions': {
                # Products app
                'products': ['view_product', 'change_product'],
                # Inventory app
                'inventory': ['view_inventoryitem'],
                # Orders app
                'orders': ['view_order', 'change_order'],
                # Dealer app
                'dealer': ['view_dealerprofile', 'change_dealerprofile'],
                # Analytics app (read only)
                'analytics': ['view_salereport'],
            }
        },
        'Customers': {
            'description': 'Customer access - browse, order, manage cart and wishlist',
            'permissions': {
                # Products (view only)
                'products': ['view_product'],
                # Orders (view own, create new)
                'orders': ['view_order', 'add_order'],
                # Cart full access
                'cart': ['add_cartitem', 'change_cartitem', 'delete_cartitem', 'view_cartitem'],
                # Wishlist full access
                'wishlist': ['add_wishlistitem', 'delete_wishlistitem', 'view_wishlistitem'],
                # Payments
                'payments': ['add_payment', 'view_payment'],
            }
        },
    }

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Setting up Django Groups and Permissions'))
        self.stdout.write('')
        
        results = []
        
        with transaction.atomic():
            for group_name, config in self.GROUP_PERMISSIONS.items():
                group, created = Group.objects.get_or_create(name=group_name)
                
                if config['permissions'] == '__all__':
                    # Administrators get all permissions
                    all_perms = Permission.objects.all()
                    group.permissions.set(all_perms)
                    perm_count = all_perms.count()
                else:
                    # Specific permissions for Dealers and Customers
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
                                self.stdout.write(
                                    self.style.WARNING(
                                        f'  Warning: Permission {app_label}.{codename} not found'
                                    )
                                )
                    
                    group.permissions.set(permissions_to_assign)
                    perm_count = len(permissions_to_assign)
                
                status = 'Created' if created else 'Updated'
                results.append({
                    'name': group_name,
                    'status': status,
                    'permissions': perm_count,
                    'description': config['description'],
                })
        
        # Print summary table
        self.stdout.write(self.style.HTTP_INFO('SUMMARY'))
        self.stdout.write('=' * 80)
        self.stdout.write(f"{'Group Name':<20} {'Status':<10} {'Permissions':<12} {'Description'}")
        self.stdout.write('-' * 80)
        
        for result in results:
            status_style = self.style.SUCCESS if result['status'] == 'Created' else self.style.NOTICE
            self.stdout.write(
                f"{result['name']:<20} "
                f"{status_style(result['status']):<10} "
                f"{result['permissions']:<12} "
                f"{result['description'][:40]}"
            )
        
        self.stdout.write('=' * 80)
        self.stdout.write('')
        
        # Print detailed permission breakdown
        self.stdout.write(self.style.HTTP_INFO('DETAILED PERMISSIONS'))
        self.stdout.write('')
        
        for group_name, config in self.GROUP_PERMISSIONS.items():
            group = Group.objects.get(name=group_name)
            self.stdout.write(self.style.MIGRATE_HEADING(f'{group_name}'))
            self.stdout.write(f"  Description: {config['description']}")
            self.stdout.write(f"  Total Permissions: {group.permissions.count()}")
            
            if config['permissions'] != '__all__':
                self.stdout.write('  Permissions by App:')
                for app_label, codenames in config['permissions'].items():
                    self.stdout.write(f"    - {app_label}: {', '.join(codenames)}")
            else:
                self.stdout.write('  Permissions: ALL permissions on ALL models')
            
            self.stdout.write('')
        
        self.stdout.write(self.style.SUCCESS('Groups and permissions setup completed successfully!'))
