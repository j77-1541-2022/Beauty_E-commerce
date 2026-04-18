from uuid import uuid4

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from orders.models import Order
from orders.services import OrderStatusManager
from utils.api_response import build_error_response, build_success_response

from .models import Payment, PaymentCallback
from .mpesa_service import initiate_stk_push, validate_callback_signature
from .serializers import (
    CashPaymentSerializer,
    PaymentInitiateSerializer,
    PaymentSerializer,
    PaymentStatusSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def payment_callback(request):
    """Handle M-Pesa callback notifications."""
    if not isinstance(request.data, dict):
        return Response(
            build_error_response(message='Malformed callback data', code='VALIDATION_ERROR'),
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not validate_callback_signature(request.data):
        return Response(
            build_error_response(message='Invalid signature', code='PERMISSION_DENIED'),
            status=status.HTTP_403_FORBIDDEN,
        )

    stk_callback = request.data.get('Body', {}).get('stkCallback', {})
    checkout_request_id = stk_callback.get('CheckoutRequestID')
    result_code = stk_callback.get('ResultCode')

    if not checkout_request_id:
        return Response(
            build_error_response(message='Missing CheckoutRequestID', code='VALIDATION_ERROR'),
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        try:
            payment = Payment.objects.select_for_update().get(checkout_request_id=checkout_request_id)
        except Payment.DoesNotExist:
            return Response(
                build_error_response(message='Payment not found', code='NOT_FOUND'),
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status in {'completed', 'failed', 'cancelled'}:
            return Response(
                build_success_response(
                    message='Payment callback already processed',
                    data={'payment_id': str(payment.id), 'status': payment.status, 'order_id': payment.order_id},
                ),
                status=status.HTTP_200_OK,
            )

        PaymentCallback.objects.create(payment=payment, raw_response=request.data)

        if result_code == 0:
            payment.status = 'completed'
            payment.payment_method = 'mpesa'
            callback_items = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            for item in callback_items:
                if item.get('Name') == 'MpesaReceiptNumber':
                    payment.mpesa_receipt_number = item.get('Value')
                    payment.receipt_number = item.get('Value')
                    break
            payment.save()
            if payment.order.status == 'pending':
                OrderStatusManager.update_status(
                    order=payment.order,
                    new_status='confirmed',
                    changed_by=None,
                    notes=f'Payment confirmed. M-Pesa Receipt: {payment.mpesa_receipt_number or payment.receipt_number}',
                )
        else:
            payment.status = 'cancelled' if result_code == 1032 else 'failed'
            payment.save()

    return Response(
        build_success_response(
            message='Callback processed',
            data={
                'payment_id': str(payment.id),
                'payment_status': payment.status,
                'order_id': payment.order_id,
                'order_status': payment.order.status,
            },
        ),
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    """Initiate an M-Pesa STK push."""
    serializer = PaymentInitiateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    order = Order.objects.filter(id=serializer.validated_data['order_id'], customer_email=request.user.email).first()
    if not order:
        return Response(
            build_error_response(message='Order not found', code='NOT_FOUND'),
            status=status.HTTP_404_NOT_FOUND,
        )

    payment_method = serializer.validated_data.get('payment_method', 'mpesa')
    if payment_method == 'cash':
        return record_cash_payment(request)

    payment = Payment.objects.create(
        order=order,
        payment_method='mpesa',
        phone_number=serializer.validated_data['phone_number'],
        amount=order.total_amount,
        status='pending',
    )

    token_response = initiate_stk_push(
        phone=serializer.validated_data['phone_number'],
        amount=payment.amount,
        order_id=order.id,
    )

    if not token_response.get('success'):
        payment.status = 'failed'
        payment.save(update_fields=['status'])
        return Response(
            build_error_response(
                message=token_response.get('message', 'Failed to initiate payment'),
                code='PAYMENT_FAILED',
                data={'payment_id': str(payment.id), 'order_id': order.id},
            ),
            status=status.HTTP_400_BAD_REQUEST,
        )

    payment.checkout_request_id = token_response.get('checkout_request_id')
    payment.merchant_request_id = token_response.get('merchant_request_id')
    payment.save(update_fields=['checkout_request_id', 'merchant_request_id'])

    return Response(
        build_success_response(
            message=token_response.get('message', 'STK Push sent successfully'),
            data={
                'payment': PaymentSerializer(payment).data,
                'order_id': order.id,
                'order_status': order.status,
            },
        ),
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_cash_payment(request):
    """Record a cash payment, confirm the order, and return a receipt URL."""
    serializer = CashPaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    order = Order.objects.filter(id=serializer.validated_data['order_id']).first()
    if not order:
        return Response(
            build_error_response(message='Order not found', code='NOT_FOUND'),
            status=status.HTTP_404_NOT_FOUND,
        )

    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'dealer' or order.customer_email == request.user.email):
        return Response(
            build_error_response(message='Not allowed to record this payment', code='PERMISSION_DENIED'),
            status=status.HTTP_403_FORBIDDEN,
        )

    amount = serializer.validated_data.get('amount') or order.total_amount
    receipt_number = f"CASH-{order.order_number}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

    with transaction.atomic():
        payment = Payment.objects.create(
            order=order,
            payment_method='cash',
            phone_number=serializer.validated_data.get('phone_number') or order.customer_phone or '',
            amount=amount,
            receipt_number=receipt_number,
            cash_received_by=request.user.get_username(),
            status='completed',
        )

        if order.status == 'pending':
            OrderStatusManager.update_status(
                order=order,
                new_status='confirmed',
                changed_by=request.user,
                notes=f'Cash payment recorded. Receipt: {receipt_number}',
            )

    order.refresh_from_db(fields=['status'])
    return Response(
        build_success_response(
            message='Cash payment recorded successfully',
            data={
                'payment': PaymentSerializer(payment).data,
                'receipt_number': receipt_number,
                'receipt_url': f'/api/v1/orders/{order.id}/receipt/',
                'order_id': order.id,
                'order_status': order.status,
            },
        ),
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, order_id):
    """Return the latest payment status for an order."""
    order = Order.objects.filter(id=order_id, customer_email=request.user.email).first()
    if not order:
        return Response(
            build_error_response(message='Order not found', code='NOT_FOUND'),
            status=status.HTTP_404_NOT_FOUND,
        )

    payment = Payment.objects.filter(order=order).order_by('-created_at').first()
    if not payment:
        return Response(
            build_success_response(
                message='No payment found',
                data={'order_id': order.id, 'order_status': order.status, 'payment_status': 'pending'},
            ),
            status=status.HTTP_200_OK,
        )

    return Response(
        build_success_response(
            message='Payment status fetched',
            data={
                'payment': PaymentStatusSerializer(payment).data,
                'order_id': order.id,
                'order_status': order.status,
            },
        ),
        status=status.HTTP_200_OK,
    )
