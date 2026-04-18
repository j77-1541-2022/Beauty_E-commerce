#!/usr/bin/env python
import os
import django
from django.db import connection

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
django.setup()

from products.models import Product, Category, Brand

def debug_products():
    print("🔍 DEBUGGING PRODUCTS ISSUE")
    print("=" * 50)
    
    # Check database connection
    print(f"✅ Database connection: {connection.settings_dict['NAME']}")
    
    # Count products
    total_products = Product.objects.count()
    active_products = Product.objects.filter(is_active=True).count()
    
    print(f"📊 Total products in database: {total_products}")
    print(f"📊 Active products in database: {active_products}")
    
    # Show active products
    if active_products > 0:
        print("\n📋 Active Products:")
        for product in Product.objects.filter(is_active=True)[:5]:
            print(f"  - {product.name} (SKU: {product.sku})")
            print(f"    Price: {product.selling_price}")
            print(f"    Category: {product.category}")
            print(f"    Brand: {product.brand}")
            print(f"    Active: {product.is_active}")
            print()
    else:
        print("❌ No active products found!")
    
    # Check categories and brands
    categories = Category.objects.count()
    brands = Brand.objects.count()
    
    print(f"📂 Categories: {categories}")
    print(f"🏢 Brands: {brands}")
    
    # Test API response format
    print("\n🔗 Testing API Response Format:")
    from products.admin_serializers import AdminProductSerializer
    
    if active_products > 0:
        sample_product = Product.objects.filter(is_active=True).first()
        serializer = AdminProductSerializer(sample_product)
        print(f"Sample serialized data:")
        for key, value in serializer.data.items():
            print(f"  {key}: {value}")

if __name__ == "__main__":
    debug_products()
