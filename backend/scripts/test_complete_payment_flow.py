"""
Complete Payment Flow Diagnostic Script

Tests the entire payment flow from order creation to receipt download.
Helps identify bottlenecks and issues in the payment pipeline.

Usage:
    python manage.py shell < scripts/test_complete_payment_flow.py
    OR
    python scripts/run_diagnostic.py
"""

import os
import sys
import django
import json
from decimal import Decimal
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.conf import settings
from orders.models import Order, OrderItem
from products.models import Product
from payments.models import Payment, PaymentCallback
from payments.mpesa_service import get_access_token, initiate_stk_push, query_stk_status
from orders.receipt_service import generate_order_receipt
from cart.models import Cart, CartItem
from inventory.models import Inventory

User = get_user_model()


class PaymentFlowDiagnostic:
    """Diagnostic tool for payment flow"""
    
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'stages': {}
        }
        self.test_user = None
        self.test_products = []
        self.test_order = None
        self.test_payment = None
        
    def print_section(self, title):
        """Print a diagnostic section header"""
        print(f"\n{'='*80}")
        print(f"  {title}")
        print(f"{'='*80}\n")
    
    def print_step(self, step_number, title):
        """Print a step header"""
        print(f"\n[Step {step_number}] {title}")
        print("-" * 60)
    
    def log_result(self, stage_name, result):
        """Log a result"""
        self.results['stages'][stage_name] = result
        status = "✓ PASS" if result.get('success') else "✗ FAIL"
        print(f"{status}: {result.get('message', 'No message')}")
        if result.get('details'):
            print(f"Details: {result['details']}")
    
    def stage_1_mpesa_configuration(self):
        """Stage 1: Check M-Pesa configuration"""
        self.print_step(1, "M-Pesa Configuration Check")
        
        from payments.mpesa_service import _is_mpesa_configured
        config_state = _is_mpesa_configured()
        
        if config_state['configured']:
            result = {
                'success': True,
                'message': 'M-Pesa is properly configured',
                'details': f"All required fields present: {', '.join(['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY', 'MPESA_CALLBACK_URL'])}"
            }
        else:
            result = {
                'success': False,
                'message': 'M-Pesa configuration is incomplete',
                'details': f"Missing fields: {', '.join(config_state['missing'])}"
            }
        
        self.log_result('mpesa_config', result)
        return result['success']
    
    def stage_2_mpesa_credentials(self):
        """Stage 2: Test M-Pesa credentials"""
        self.print_step(2, "M-Pesa Credentials Test")
        
        token_result = get_access_token()
        
        if token_result.get('success'):
            result = {
                'success': True,
                'message': 'Successfully obtained M-Pesa access token',
                'token_prefix': token_result['token'][:20] + '...',
                'details': 'OAuth authentication with Daraja API successful'
            }
        else:
            result = {
                'success': False,
                'message': 'Failed to obtain M-Pesa access token',
                'error': token_result.get('error'),
                'details': token_result.get('details', 'Check your Consumer Key and Secret')
            }
        
        self.log_result('mpesa_credentials', result)
        return result
    
    def stage_3_create_test_user(self):
        """Stage 3: Create or get test user"""
        self.print_step(3, "Create/Get Test User")
        
        try:
            user, created = User.objects.get_or_create(
                username='test_payment_customer',
                defaults={
                    'email': 'test.payment@example.com',
                    'first_name': 'Test',
                    'last_name': 'Customer',
                    'phone': '254701234567',
                    'role': 'customer'
                }
            )
            self.test_user = user
            result = {
                'success': True,
                'message': f"Test user {'created' if created else 'loaded'}: {user.username}",
                'user_id': user.id,
                'email': user.email
            }
        except Exception as e:
            result = {
                'success': False,
                'message': 'Failed to create/get test user',
                'error': str(e)
            }
        
        self.log_result('test_user', result)
        return result['success']
    
    def stage_4_get_test_products(self):
        """Stage 4: Get test products"""
        self.print_step(4, "Get Test Products")
        
        try:
            products = Product.objects.filter(
                selling_price__gt=0,
                primary_image__isnull=False
            )[:3]
            
            if not products.exists():
                products = Product.objects.all()[:3]
            
            if not products.exists():
                result = {
                    'success': False,
                    'message': 'No products available in database',
                    'details': 'Please seed products first with: python manage.py add_dealer_products'
                }
            else:
                self.test_products = list(products)
                result = {
                    'success': True,
                    'message': f"Found {len(self.test_products)} test products",
                    'products': [
                        {
                            'id': p.id,
                            'name': p.name,
                            'price': float(p.selling_price or 0)
                        }
                        for p in self.test_products
                    ]
                }
        except Exception as e:
            result = {
                'success': False,
                'message': 'Failed to fetch products',
                'error': str(e)
            }
        
        self.log_result('test_products', result)
        return result['success']
    
    def stage_5_create_test_order(self):
        """Stage 5: Create test order"""
        self.print_step(5, "Create Test Order")
        
        try:
            if not self.test_products:
                raise Exception("No test products available")
            
            from orders.serializers import OrderCreateSerializer
            
            # Prepare order data
            order_data = {
                'customer_name': self.test_user.get_full_name() or self.test_user.username,
                'customer_email': self.test_user.email,
                'customer_phone': self.test_user.phone or '254701234567',
                'shipping_address': '123 Test Street, Test City',
                'shipping_zone': 'nairobi_cbd',
                'subtotal': Decimal('1.00'),  # 1 KSh for testing
                'tax_amount': Decimal('0.00'),
                'shipping_cost': Decimal('0.00'),
                'items': [
                    {
                        'product_id': self.test_products[0].id,
                        'quantity': 1,
                        'unit_price': Decimal('1.00'),
                        'total_price': Decimal('1.00')
                    }
                ]
            }
            
            serializer = OrderCreateSerializer(
                data=order_data,
                context={'request': type('Request', (), {'user': self.test_user})()}
            )
            
            if serializer.is_valid():
                order = serializer.save(created_by=self.test_user)
                self.test_order = order
                result = {
                    'success': True,
                    'message': f'Test order created: {order.order_number}',
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'total_amount': float(order.total_amount),
                    'items': order.items.count()
                }
            else:
                result = {
                    'success': False,
                    'message': 'Order validation failed',
                    'errors': serializer.errors
                }
        except Exception as e:
            result = {
                'success': False,
                'message': 'Failed to create order',
                'error': str(e)
            }
        
        self.log_result('create_order', result)
        return result['success']
    
    def stage_6_initiate_stk_push(self):
        """Stage 6: Initiate STK Push"""
        self.print_step(6, "Initiate STK Push")
        
        try:
            if not self.test_order:
                raise Exception("No test order available")
            
            stk_result = initiate_stk_push(
                phone=self.test_user.phone or '254701234567',
                amount=self.test_order.total_amount,
                order_id=self.test_order.id
            )
            
            if stk_result.get('success'):
                result = {
                    'success': True,
                    'message': 'STK Push initiated successfully',
                    'checkout_request_id': stk_result.get('checkout_request_id'),
                    'merchant_request_id': stk_result.get('merchant_request_id'),
                    'customer_message': stk_result.get('message')
                }
                
                # Create payment record
                self.test_payment = Payment.objects.create(
                    order=self.test_order,
                    payment_method='mpesa',
                    phone_number=self.test_user.phone or '254701234567',
                    amount=self.test_order.total_amount,
                    checkout_request_id=result['checkout_request_id'],
                    merchant_request_id=result['merchant_request_id'],
                    status='pending'
                )
            else:
                result = {
                    'success': False,
                    'message': 'STK Push initiation failed',
                    'error': stk_result.get('error'),
                    'details': stk_result.get('details', stk_result.get('message'))
                }
        except Exception as e:
            result = {
                'success': False,
                'message': 'Failed to initiate STK Push',
                'error': str(e)
            }
        
        self.log_result('stk_push', result)
        return result
    
    def stage_7_query_stk_status(self):
        """Stage 7: Query STK Status"""
        self.print_step(7, "Query STK Status (Simulated)")
        
        try:
            if not self.test_payment or not self.test_payment.checkout_request_id:
                result = {
                    'success': False,
                    'message': 'Cannot query status without checkout_request_id',
                    'details': 'Skipping this stage - STK Push not initiated successfully'
                }
            else:
                status_result = query_stk_status(self.test_payment.checkout_request_id)
                
                if status_result.get('success'):
                    result = {
                        'success': True,
                        'message': 'STK Status query successful',
                        'status_response': json.dumps(status_result.get('data', {}), indent=2, default=str)[:200]
                    }
                else:
                    result = {
                        'success': False,
                        'message': 'STK Status query failed',
                        'error': status_result.get('error'),
                        'details': 'This is expected if payment hasnt been processed yet'
                    }
        except Exception as e:
            result = {
                'success': False,
                'message': 'Failed to query STK status',
                'error': str(e)
            }
        
        self.log_result('stk_status', result)
        return result
    
    def stage_8_simulate_payment_callback(self):
        """Stage 8: Simulate Payment Callback"""
        self.print_step(8, "Simulate Payment Callback")
        
        try:
            if not self.test_payment:
                result = {
                    'success': False,
                    'message': 'No payment record to update',
                    'details': 'Payment initiation must succeed first'
                }
            else:
                # Simulate successful payment callback
                from orders.services import OrderStatusManager
                
                self.test_payment.status = 'completed'
                self.test_payment.mpesa_receipt_number = 'DEMO-TEST-12345'
                self.test_payment.receipt_number = 'DEMO-TEST-12345'
                self.test_payment.save()
                
                # Update order status to paid
                order_update = OrderStatusManager.update_status(
                    order=self.test_order,
                    new_status='paid',
                    changed_by=None,
                    notes='Demo payment simulated for testing'
                )
                
                result = {
                    'success': order_update['success'],
                    'message': 'Payment callback simulated and order marked as paid',
                    'payment_status': self.test_payment.status,
                    'order_status': self.test_order.status,
                    'receipt_number': self.test_payment.receipt_number
                }
        except Exception as e:
            result = {
                'success': False,
                'message': 'Failed to simulate payment callback',
                'error': str(e)
            }
        
        self.log_result('payment_callback', result)
        return result['success']
    
    def stage_9_verify_order_paid(self):
        """Stage 9: Verify Order Status is Paid"""
        self.print_step(9, "Verify Order Status")
        
        try:
            self.test_order.refresh_from_db()
            
            if self.test_order.status == 'paid':
                result = {
                    'success': True,
                    'message': 'Order successfully marked as paid',
                    'order_status': self.test_order.status,
                    'order_id': self.test_order.id
                }
            else:
                result = {
                    'success': False,
                    'message': f'Order status is {self.test_order.status}, expected "paid"',
                    'current_status': self.test_order.status
                }
        except Exception as e:
            result = {
                'success': False,
                'message': 'Failed to verify order status',
                'error': str(e)
            }
        
        self.log_result('verify_order', result)
        return result['success']
    
    def stage_10_generate_receipt(self):
        """Stage 10: Generate Receipt PDF"""
        self.print_step(10, "Generate Receipt PDF")
        
        try:
            pdf_bytes = generate_order_receipt(self.test_order)
            
            if pdf_bytes and len(pdf_bytes) > 0:
                result = {
                    'success': True,
                    'message': 'Receipt PDF generated successfully',
                    'pdf_size_bytes': len(pdf_bytes),
                    'receipt_url': f'/api/v1/orders/{self.test_order.id}/receipt/'
                }
            else:
                result = {
                    'success': False,
                    'message': 'Receipt PDF generation returned empty content'
                }
        except Exception as e:
            result = {
                'success': False,
                'message': 'Failed to generate receipt PDF',
                'error': str(e)
            }
        
        self.log_result('generate_receipt', result)
        return result['success']
    
    def run_full_diagnostic(self):
        """Run all diagnostic stages"""
        self.print_section("PAYMENT FLOW COMPLETE DIAGNOSTIC")
        print(f"Started at: {datetime.now().isoformat()}\n")
        
        # Run all stages
        stages = [
            ('M-Pesa Config', self.stage_1_mpesa_configuration),
            ('M-Pesa Credentials', self.stage_2_mpesa_credentials),
            ('Create Test User', self.stage_3_create_test_user),
            ('Get Test Products', self.stage_4_get_test_products),
            ('Create Test Order', self.stage_5_create_test_order),
            ('Initiate STK Push', self.stage_6_initiate_stk_push),
            ('Query STK Status', self.stage_7_query_stk_status),
            ('Simulate Callback', self.stage_8_simulate_payment_callback),
            ('Verify Order Paid', self.stage_9_verify_order_paid),
            ('Generate Receipt', self.stage_10_generate_receipt),
        ]
        
        passed = 0
        failed = 0
        
        for stage_name, stage_func in stages:
            try:
                result = stage_func()
                if isinstance(result, dict):
                    if result.get('success'):
                        passed += 1
                    else:
                        failed += 1
                elif result is True:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"✗ EXCEPTION in {stage_name}: {str(e)}")
                failed += 1
        
        # Print summary
        self.print_section("DIAGNOSTIC SUMMARY")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Total:  {passed + failed}")
        
        if failed == 0:
            print("\n✓ All stages passed!")
        else:
            print(f"\n✗ {failed} stage(s) failed. See details above.")
        
        print(f"\nFinished at: {datetime.now().isoformat()}")
        
        # Print full results as JSON
        print(f"\n{json.dumps(self.results, indent=2, default=str)}")
        
        return passed, failed


if __name__ == '__main__':
    diagnostic = PaymentFlowDiagnostic()
    passed, failed = diagnostic.run_full_diagnostic()
    sys.exit(0 if failed == 0 else 1)
