"""
Complete Payment Flow - End-to-End Test Guide

This guide documents the complete payment flow from product selection to receipt download.
"""

# ============================================================================
# COMPLETE PAYMENT FLOW SEQUENCE
# ============================================================================

"""
FLOW OVERVIEW:
==============

1. [FRONTEND] Customer adds products to cart
   └─ Calls: POST /api/v1/cart/items/
   └─ Data: { product_id, quantity }
   └─ Result: CartItem created, cart total updated

2. [FRONTEND] Customer proceeds to checkout
   └─ Calls: GET /api/v1/cart/
   └─ Result: Cart items fetched with prices

3. [FRONTEND] Customer enters shipping and payment info
   └─ Validates: Email, Phone, Address, Shipping Zone

4. [FRONTEND] Customer creates order
   └─ Calls: POST /api/v1/orders/
   └─ Data: {
       customer_name, customer_email, customer_phone,
       shipping_address, shipping_zone,
       subtotal, tax_amount, shipping_cost,
       items: [{ product_id, quantity, unit_price, total_price }]
     }
   └─ Response: {
       status: 'success',
       data: {
         id, order_number, status: 'pending',
         total_amount, receipt_url: '/api/v1/orders/{id}/receipt/',
         ...items, created_at, ...
       },
       message: 'Order created successfully'
     }

5. [FRONTEND] Customer selects payment method
   └─ Options: 'mpesa', 'cash', 'card'

===== MPESA FLOW =====
6a. [FRONTEND] Customer enters M-Pesa phone number
    └─ Validates: Kenyan format (254701234567)

7a. [FRONTEND] Initiate M-Pesa payment
    └─ Calls: POST /api/v1/payments/initiate/
    └─ Data: {
        order_id: <order_id>,
        phone_number: '254701234567',
        payment_method: 'mpesa'
      }
    └─ Response: {
        status: 'success',
        data: {
          payment: { id, status: 'pending', checkout_request_id, ... },
          order_id, order_status: 'pending',
          order: { full order data with receipt_url, ... }
        },
        message: 'STK Push sent successfully'
      }
    └─ Backend: Creates Payment record with checkout_request_id
    └─ Backend: Calls Daraja API to initiate STK push
    └─ Customer phone: Receives STK prompt to enter PIN

8a. [CUSTOMER PHONE] Enter PIN on M-Pesa STK prompt
    └─ Action: Customer enters PIN and confirms payment

9a. [BACKEND] Receive M-Pesa callback
    └─ Endpoint: POST /api/v1/payments/callback/
    └─ From: Safaricom Daraja API
    └─ Data: M-Pesa result (ResultCode: 0 = success)
    └─ Backend Actions:
        - Validates callback signature
        - Updates Payment status to 'completed'
        - Creates PaymentCallback record
        - Updates Order status to 'paid'
        - Creates OrderStatusHistory
        - Notifies dealers of paid order
    └─ Response: { status: 'success', ... }

10a. [FRONTEND] Poll payment status (automatically)
     └─ Calls: GET /api/v1/payments/status/{order_id}/
     └─ Response: {
          status: 'success',
          data: {
            payment: { status: 'completed', receipt_number, ... },
            order_id, order_status: 'paid',
            receipt_url: '/api/v1/orders/{order_id}/receipt/',
            receipt_number: '<mpesa-receipt>'
          }
        }
     └─ Frontend: Detects 'paid' status and shows receipt download button
     └─ Frontend: Hides "Check Status" and shows "Download Receipt"

===== CASH FLOW =====
6b. [FRONTEND] Customer selects cash payment
    └─ No additional info needed

7b. [FRONTEND] Record cash payment
    └─ Calls: POST /api/v1/payments/cash/
    └─ Data: {
        order_id, amount, phone_number, payment_method: 'cash'
      }
    └─ Response: {
        status: 'success',
        data: {
          payment: { status: 'completed', receipt_number, ... },
          receipt_number, receipt_url,
          order_id, order_status: 'paid'
        }
      }
    └─ Backend: Creates Payment with status='completed'
    └─ Backend: Updates Order status to 'paid'
    └─ Frontend: Shows receipt download button immediately

===== RECEIPT DOWNLOAD =====
11. [FRONTEND] Download receipt
    └─ Calls: GET /api/v1/orders/{order_id}/receipt/
    └─ Backend: Generates PDF receipt using ReportLab
    └─ Response: PDF file (application/pdf)
    └─ Filename: receipt_ORD{order_number}.pdf

12. [FRONTEND] Show success message
    └─ "Order placed successfully!"
    └─ Display order details
    └─ Show buttons: [Download Receipt] [View Orders] [Continue Shopping]
"""

# ============================================================================
# TESTING THE FLOW (MANUAL STEPS)
# ============================================================================

"""
STEP-BY-STEP TESTING:
=====================

PREREQUISITES:
- Backend running on http://localhost:8000
- Frontend running on http://localhost:3001
- Customer account created and logged in
- Products exist in database
- For M-Pesa: credentials configured in .env

TEST SCENARIO 1: CASH PAYMENT (FASTEST)
========================================

1. Open http://localhost:3001
2. Log in as customer
3. Add 2-3 products to cart
4. Go to Checkout
5. Fill shipping info:
   - First Name: Test
   - Last Name: Customer
   - Email: test@example.com
   - Phone: +254 701 234 567
   - Address: 123 Test St
   - City: Nairobi
   - State: Nairobi
   - Zip: 00100
   - Shipping Zone: Nairobi (CBD)
6. Click "Continue to Payment"
7. Select "Cash Payment"
8. Click "Place Order"
9. Verify:
   - Order status changes to "paid"
   - Receipt download button appears
   - Click download - PDF should download
   - Filename should be: receipt_ORD<number>.pdf

TEST SCENARIO 2: M-PESA PAYMENT (WITH SIMULATION)
==================================================

1. Repeat steps 1-7 from Scenario 1
2. Select "M-Pesa Payment"
3. Enter M-Pesa phone: +254 701 234 567
4. Click "Place Order"
5. If M-Pesa API is configured:
   - STK prompt appears on configured phone
   - Enter PIN and confirm
   - Payment processes automatically
6. If M-Pesa API returns 403 (development mode):
   - Fallback to demo payment occurs
   - Order marked as paid automatically
   - Receipt download button appears
7. Verify receipt download works

TEST SCENARIO 3: ORDER VIEW & HISTORY
======================================

1. Complete payment in Scenario 1 or 2
2. Click "View Orders"
3. Verify:
   - Order appears in list
   - Status shows "Paid"
   - You can click order to see details
   - Receipt button available
   - Can re-download receipt multiple times
"""

# ============================================================================
# DEBUGGING COMMON ISSUES
# ============================================================================

"""
ISSUE 1: M-Pesa Returns 403 Forbidden
======================================
Symptoms:
- Payment initiation fails immediately
- Error: "Invalid M-Pesa credentials (403 Forbidden)"

Causes:
1. Wrong Consumer Key or Secret (with extra spaces)
2. App not approved at https://developer.safaricom.co.ke
3. IP blocked by WAF (Incapsula)

Fix:
- Check .env: MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET
- No extra spaces - values should match exactly
- Visit https://developer.safaricom.co.ke
  - Go to "My Apps"
  - Verify app shows status "Approved"
  - Check that app is targeting "Sandbox" environment
- If blocking persists:
  - Use ngrok to tunnel: ngrok http 8000
  - Update MPESA_CALLBACK_URL to ngrok URL
  - Wait 5-10 minutes after app approval before retesting

ISSUE 2: Payment Callback Not Received
======================================
Symptoms:
- STK shows on phone
- Customer enters PIN
- Order status stays "pending"
- No callback received by backend

Causes:
1. MPESA_CALLBACK_URL not publicly accessible
2. Backend firewall blocking callback requests
3. IP whitelisting not configured

Fix:
- Use ngrok to make callback URL public:
  ngrok http 8000 --subdomain=myapp
- Update MPESA_CALLBACK_URL in .env:
  MPESA_CALLBACK_URL=https://myapp.ngrok.io/api/v1/payments/callback/
- Restart backend
- Test again

ISSUE 3: Order Stuck in "pending" After Payment
================================================
Symptoms:
- Payment marked as completed
- Order status still shows "pending"
- Receipt URL not available

Causes:
1. Callback validation failed
2. Database transaction error
3. Order status update error

Fix:
- Check backend logs:
  tail -f backend/logs/django.log | grep -i payment
- Verify in Django admin:
  - Check Payments - should show status='completed'
  - Check Orders - should show status='paid'
  - Check PaymentCallback - should exist
- If callback wasn't received:
  - Manually trigger demo payment:
    POST /api/v1/payments/demo/ with order_id
  - This marks order as paid for testing

ISSUE 4: Receipt PDF Not Downloading
====================================
Symptoms:
- Receipt button shows
- Clicking shows error
- PDF not generated

Causes:
1. ReportLab not installed
2. Order not in "paid" status
3. API permission issue

Fix:
- Install ReportLab:
  pip install reportlab
- Verify order status is "paid":
  python manage.py shell -c "from orders.models import Order; o = Order.objects.last(); print(o.status)"
- Check backend logs for receipt generation errors
- Manually test receipt generation:
  python manage.py shell
  >>> from orders.models import Order
  >>> from orders.receipt_service import generate_order_receipt
  >>> order = Order.objects.filter(status='paid').first()
  >>> pdf = generate_order_receipt(order)
  >>> print(len(pdf))  # Should be > 0

ISSUE 5: Frontend Polling Doesn't Update
=========================================
Symptoms:
- Frontend says "Checking payment status..."
- Never completes or shows error
- Manual check works but polling doesn't

Causes:
1. Poll timeout (60 attempts = 60 seconds)
2. API endpoint returning wrong format
3. Frontend state not updating

Fix:
- Check browser console for fetch errors
- Verify API response format:
  GET /api/v1/payments/status/{order_id}/
  Response should include: payment.status or payment_status
- Test manually in browser:
  fetch('http://localhost:8000/api/v1/payments/status/1/', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') }
  }).then(r => r.json()).then(d => console.log(d))
- If response is correct, frontend code may need debugging
"""

# ============================================================================
# VERIFYING COMPLETE FLOW IN DJANGO SHELL
# ============================================================================

"""
Quick verification script to run in Django shell:
python manage.py shell

>>> from django.contrib.auth import get_user_model
>>> from orders.models import Order
>>> from payments.models import Payment
>>> User = get_user_model()

# 1. Check recent orders
>>> orders = Order.objects.order_by('-created_at')[:5]
>>> for o in orders:
...     print(f"{o.order_number} - {o.status} - Total: {o.total_amount}")

# 2. Check payment for order
>>> order = Order.objects.latest('created_at')
>>> payment = Payment.objects.filter(order=order).latest('created_at')
>>> print(f"Payment status: {payment.status}")
>>> print(f"Receipt: {payment.receipt_number}")

# 3. Generate and verify receipt
>>> from orders.receipt_service import generate_order_receipt
>>> pdf = generate_order_receipt(order)
>>> print(f"Receipt PDF size: {len(pdf)} bytes")

# 4. Check order status history
>>> from orders.models import OrderStatusHistory
>>> history = OrderStatusHistory.objects.filter(order=order)
>>> for h in history:
...     print(f"{h.old_status} -> {h.new_status} at {h.changed_at}")
"""

print(__doc__)
