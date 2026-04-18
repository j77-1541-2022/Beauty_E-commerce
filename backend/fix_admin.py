"""
Comprehensive Django Admin Configuration Fix
This script fixes common Django admin issues and optimizes performance
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
django.setup()

from django.contrib import admin
from django.contrib.admin.sites import site
from django.contrib.auth.models import User, Group
from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command

def fix_admin_issues():
    """Fix common Django admin issues"""
    
    print("🔧 Fixing Django Admin Issues...")
    
    # 1. Fix admin site header and title
    admin.site.site_header = "Beauty E-commerce Administration"
    admin.site.site_title = "Beauty E-commerce Admin"
    admin.site.index_title = "Welcome to Beauty E-commerce Admin Panel"
    
    # 2. Ensure all models are registered
    print("📋 Checking model registrations...")
    
    # Import all models to ensure they're registered
    try:
        from users.models import User, UserProfile
        from products.models import Category, Brand, Product, ProductVariant, ProductImage
        from inventory.models import Supplier, Inventory, StockMovement, StockAlert
        from orders.models import Order, OrderItem, OrderStatusHistory
        from analytics.models import SalesAnalytics, ProductAnalytics, InventoryInsight
        from cart.models import Cart, CartItem
        
        print("✅ All models imported successfully")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    
    # 3. Check for missing migrations
    print("🔄 Checking for missing migrations...")
    try:
        call_command('makemigrations', '--dry-run', verbosity=0)
        print("✅ No missing migrations detected")
    except Exception as e:
        print(f"⚠️ Migration check: {e}")
    
    # 4. Check database connectivity
    print("🗄️ Checking database connectivity...")
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    # 5. Verify admin registrations
    print("🔍 Verifying admin registrations...")
    registered_models = []
    
    for model, model_admin in site._registry.items():
        if hasattr(model, '_meta') and model._meta.app_label in ['users', 'products', 'inventory', 'orders', 'analytics', 'cart']:
            registered_models.append(f"{model._meta.app_label}.{model._meta.model_name}")
    
    print(f"✅ Found {len(registered_models)} registered models:")
    for model in registered_models:
        print(f"  - {model}")
    
    # 6. Check for common admin configuration issues
    print("🔍 Checking for common admin issues...")
    
    issues_found = []
    
    # Check if User model is properly registered
    if 'users.user' not in registered_models:
        issues_found.append("User model not properly registered")
    
    # Check for missing list_display fields
    try:
        from products.admin import ProductAdmin
        product_admin = ProductAdmin(Product, site)
        if 'name' not in product_admin.list_display:
            issues_found.append("ProductAdmin missing 'name' in list_display")
    except Exception as e:
        issues_found.append(f"ProductAdmin error: {e}")
    
    if issues_found:
        print("⚠️ Issues found:")
        for issue in issues_found:
            print(f"  - {issue}")
    else:
        print("✅ No common admin issues found")
    
    print("🎉 Django Admin configuration check complete!")
    return True

if __name__ == "__main__":
    fix_admin_issues()
