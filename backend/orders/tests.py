from decimal import Decimal
from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from products.models import Category, Product
from inventory.models import Inventory
from orders.models import Order, OrderItem
from payments.models import Payment


class OrderCheckoutFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='checkout_user',
            email='checkout@example.com',
            password='Password123!',
            role='customer',
        )
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name='Skincare')
        self.product = Product.objects.create(
            name='Hydrating Serum',
            description='Test product',
            sku='SKU-001',
            product_type='skincare',
            category=self.category,
            cost_price=Decimal('500.00'),
            selling_price=Decimal('1000.00'),
            is_active=True,
        )
        self.inventory = Inventory.objects.create(product=self.product, quantity=10, reorder_level=2)

    def test_create_order_deducts_stock_atomically(self):
        payload = {
            'customer_name': 'Checkout User',
            'customer_email': 'checkout@example.com',
            'customer_phone': '254712345678',
            'shipping_address': 'Nairobi, Kenya',
            'subtotal': '1000.00',
            'tax_amount': '80.00',
            'shipping_cost': '100.00',
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 2,
                    'unit_price': '1000.00',
                }
            ],
        }

        response = self.client.post('/api/v1/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=str(getattr(response, 'data', response.content)))

        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity, 8)

        order = Order.objects.latest('id')
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.total_amount, Decimal('2180.00'))

    def test_create_order_rejects_insufficient_stock(self):
        payload = {
            'customer_name': 'Checkout User',
            'customer_email': 'checkout@example.com',
            'customer_phone': '254712345678',
            'shipping_address': 'Nairobi, Kenya',
            'subtotal': '1000.00',
            'tax_amount': '80.00',
            'shipping_cost': '100.00',
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 99,
                    'unit_price': '1000.00',
                }
            ],
        }

        response = self.client.post('/api/v1/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.quantity, 10)


class PaymentCallbackFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='payer',
            email='payer@example.com',
            password='Password123!',
            role='customer',
        )

        category = Category.objects.create(name='Makeup')
        self.product = Product.objects.create(
            name='Matte Lipstick',
            description='Test product',
            sku='SKU-002',
            product_type='makeup',
            category=category,
            cost_price=Decimal('300.00'),
            selling_price=Decimal('800.00'),
            is_active=True,
        )

        self.order = Order.objects.create(
            customer_name='Payer',
            customer_email=self.user.email,
            customer_phone='254700000000',
            shipping_address='Machakos, Kenya',
            subtotal=Decimal('800.00'),
            tax_amount=Decimal('64.00'),
            shipping_cost=Decimal('100.00'),
            total_amount=Decimal('964.00'),
            status='pending',
            created_by=self.user,
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            unit_price=Decimal('800.00'),
            total_price=Decimal('800.00'),
        )

        self.payment = Payment.objects.create(
            order=self.order,
            payment_method='mpesa',
            phone_number='254700000000',
            amount=Decimal('964.00'),
            status='pending',
            checkout_request_id='ws_CO_TEST_123',
        )

    @patch('payments.views.validate_callback_signature', return_value=True)
    def test_payment_callback_marks_payment_and_order_confirmed(self, _mock_signature):
        payload = {
            'Body': {
                'stkCallback': {
                    'CheckoutRequestID': 'ws_CO_TEST_123',
                    'ResultCode': 0,
                    'CallbackMetadata': {
                        'Item': [
                            {'Name': 'MpesaReceiptNumber', 'Value': 'RCP12345'}
                        ]
                    }
                }
            }
        }

        response = self.client.post('/api/v1/payments/callback/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')
        self.assertEqual(self.order.status, 'confirmed')
