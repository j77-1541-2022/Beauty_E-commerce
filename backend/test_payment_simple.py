#!/usr/bin/env python
"""
Simple test to verify the complete payment flow works
Run: python manage.py shell < test_payment_simple.py
"""

import json
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import Client
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from orders.models import Order, OrderItem
from products.models import Product
from payments.models import Payment, PaymentCallback
from cart.models import Cart, CartItem

User = get_user_model()

print("\n" + "="*80)
print("PAYMENT FLOW VERIFICATION TEST")
print("="*80)

# Step 1: Create or get test user
print("\n[Step 1] Creating test user...")
try:
    user, created = User.objects.get_or_create(
        username='payment_test_user',
        defaults={
            'email': 'payment.test@example.com',
            'first_name': 'Payment',
            'last_name': 'Tester',
            'phone': '254701234567',
            'role': 'customer'
        }
    )
    print(f"✓ User: {user.username} ({'created' if created else 'existing'})")
except Exception as e:
    print(f"✗ Failed to create user: {e}")
    exit(1)

# Step 2: Get auth token
print("\n[Step 2] Getting authentication token...")
try:
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    print(f"✓ Got access token (first 20 chars): {access_token[:20]}...")
except Exception as e:
    print(f"✗ Failed to get token: {e}")
    exit(1)

# Step 3: Get test products
print("\n[Step 3] Getting test products...")
try:
    products = Product.objects.filter(selling_price__gt=0)[:2]
    if not products:
        print("✗ No products found in database")
        print("  Please seed products first: python manage.py add_dealer_products")
        exit(1)
    print(f"✓ Found {products.count()} test products")
    for p in products:
        print(f"  - {p.name}: {p.selling_price} KSh")
except Exception as e:
    print(f"✗ Failed to get products: {e}")
    exit(1)

# Step 4: Create order via API
print("\n[Step 4] Creating test order...")
try:
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    order_data = {
        'customer_name': f'{user.first_name} {user.last_name}',
        'customer_email': user.email,
        'customer_phone': user.phone,
        'shipping_address': '123 Test St, Test City',
        'shipping_zone': 'nairobi_cbd',
        'subtotal': Decimal('1.00'),  # 1 KSh for testing
        'tax_amount': Decimal('0.00'),
        'shipping_cost': Decimal('0.00'),
        'items': [
            {
                'product_id': p.id,
                'quantity': 1,
                'unit_price': Decimal(str(p.selling_price)),
                'total_price': Decimal(str(p.selling_price))
            }
            for p in products
        ]
    }
    
    response = client.post('/api/v1/orders/', order_data, format='json')
    if response.status_code not in [200, 201]:
        print(f"✗ Failed to create order: {response.status_code}")
        print(f"  Response: {response.data}")
        exit(1)
    
    order_data_response = response.data.get('data') or response.data
    order_id = order_data_response.get('id')
    order_number = order_data_response.get('order_number')
    receipt_url = order_data_response.get('receipt_url')
    
    print(f"✓ Order created: {order_number}")
    print(f"  Order ID: {order_id}")
    print(f"  Total: {order_data_response.get('total_amount')} KSh")
    print(f"  Receipt URL: {receipt_url}")
except Exception as e:
    print(f"✗ Failed to create order: {e}")
    exit(1)

# Step 5: Test cash payment
print("\n[Step 5] Testing cash payment...")
try:
    payment_data = {
        'order_id': order_id,
        'amount': order_data_response.get('total_amount'),
        'phone_number': user.phone,
        'payment_method': 'cash'
    }
    
    response = client.post('/api/v1/payments/cash/', payment_data, format='json')
    if response.status_code not in [200, 201]:
        print(f"✗ Cash payment failed: {response.status_code}")
        print(f"  Response: {response.data}")
        exit(1)
    
    payment_response = response.data.get('data') or response.data
    print(f"✓ Cash payment recorded")
    print(f"  Receipt number: {payment_response.get('receipt_number')}")
    print(f"  Receipt URL: {payment_response.get('receipt_url')}")
except Exception as e:
    print(f"✗ Cash payment failed: {e}")
    exit(1)

# Step 6: Verify order status changed to "paid"
print("\n[Step 6] Verifying order status...")
try:
    order = Order.objects.get(id=order_id)
    if order.status == 'paid':
        print(f"✓ Order status changed to: {order.status}")
    else:
        print(f"✗ Order status is '{order.status}', expected 'paid'")
        exit(1)
except Exception as e:
    print(f"✗ Failed to verify order: {e}")
    exit(1)

# Step 7: Verify payment record
print("\n[Step 7] Verifying payment record...")
try:
    payment = Payment.objects.filter(order_id=order_id).latest('created_at')
    print(f"✓ Payment record found")
    print(f"  Status: {payment.status}")
    print(f"  Amount: {payment.amount} KSh")
    print(f"  Receipt: {payment.receipt_number}")
except Exception as e:
    print(f"✗ Failed to find payment: {e}")
    exit(1)

# Step 8: Verify receipt can be generated
print("\n[Step 8] Verifying receipt generation...")
try:
    from orders.receipt_service import generate_order_receipt
    pdf = generate_order_receipt(order)
    if pdf and len(pdf) > 0:
        print(f"✓ Receipt generated successfully")
        print(f"  PDF size: {len(pdf)} bytes")
    else:
        print(f"✗ Receipt generation returned empty")
        exit(1)
except Exception as e:
    print(f"✗ Failed to generate receipt: {e}")
    exit(1)

# Step 9: Verify receipt can be downloaded via API
print("\n[Step 9] Verifying receipt download via API...")
try:
    response = client.get(f'/api/v1/orders/{order_id}/receipt/')
    if response.status_code == 200:
        print(f"✓ Receipt download endpoint works")
        print(f"  Content-Type: {response.get('Content-Type', 'N/A')}")
        print(f"  Content-Length: {len(response.content)} bytes")
    else:
        print(f"✗ Receipt download failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"✗ Receipt download failed: {e}")
    exit(1)

# Step 10: Verify payment status endpoint
print("\n[Step 10] Verifying payment status endpoint...")
try:
    response = client.get(f'/api/v1/payments/status/{order_id}/')
    if response.status_code == 200:
        status_data = response.data.get('data') or response.data
        payment_status = status_data.get('payment', {}).get('status') or status_data.get('payment_status')
        order_status = status_data.get('order_status')
        receipt_url = status_data.get('receipt_url')
        
        print(f"✓ Payment status endpoint works")
        print(f"  Payment status: {payment_status}")
        print(f"  Order status: {order_status}")
        print(f"  Receipt URL: {receipt_url}")
    else:
        print(f"✗ Payment status check failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"✗ Payment status check failed: {e}")
    exit(1)

# Final Summary
print("\n" + "="*80)
print("✓ COMPLETE PAYMENT FLOW TEST PASSED")
print("="*80)
print("\nAll steps completed successfully:")
print("  1. ✓ Created test user")
print("  2. ✓ Got authentication token")
print("  3. ✓ Found test products")
print("  4. ✓ Created order via API")
print("  5. ✓ Recorded cash payment")
print("  6. ✓ Order status changed to 'paid'")
print("  7. ✓ Payment record verified")
print("  8. ✓ Receipt generated")
print("  9. ✓ Receipt downloadable via API")
print("  10. ✓ Payment status endpoint working")
print("\nPayment flow is fully functional!\n")
