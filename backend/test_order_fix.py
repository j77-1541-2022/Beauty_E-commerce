#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

# Test 1: Verify Celery fix
print("=" * 60)
print("Test 1: Celery Fix Verification")
print("=" * 60)
try:
    from notifications.signals import CELERY_AVAILABLE
    print(f"CELERY_AVAILABLE: {CELERY_AVAILABLE}")
    print("✅ Signal import successful")
except Exception as e:
    print(f"❌ Signal import failed: {e}")
    sys.exit(1)

# Test 2: Order creation
print("\n" + "=" * 60)
print("Test 2: Order Creation")
print("=" * 60)
from django.contrib.auth import get_user_model
from orders.models import Order
from decimal import Decimal

User = get_user_model()
user = User.objects.first()

if user:
    try:
        order = Order.objects.create(
            created_by=user,
            customer_name='TestOrder',
            shipping_address='Test Address',
            shipping_zone='nairobi_cbd',
            status='pending',
            subtotal=Decimal('500'),
            tax_amount=Decimal('50'),
            shipping_cost=Decimal('200'),
            total_amount=Decimal('750')
        )
        print(f"✅ Order created successfully!")
        print(f"   Order Number: {order.order_number}")
        print(f"   Total Amount: {order.total_amount}")
        print(f"   Shipping Zone: {order.shipping_zone}")
    except Exception as e:
        print(f"❌ Order creation error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
else:
    print("❌ No user found in database")
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ ALL TESTS PASSED")
print("=" * 60)
