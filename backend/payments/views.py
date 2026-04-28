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
from .mpesa_service import initiate_stk_push, query_stk_status, validate_callback_signature
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

    signature = request.headers.get('X-Mpesa-Signature') or request.headers.get('X-Safaricom-Signature')
    if not validate_callback_signature(getattr(request, 'body', b''), signature):
        return Response(
            build_error_response(message='Invalid signature', code='PERMISSION_DENIED'),
            status=status.HTTP_403_FORBIDDEN,
        )

    stk_callback = request.data.get('Body', {}).get('stkCallback', {})
    checkout_request_id = stk_callback.get('CheckoutRequestID')
    result_code = stk_callback.get('ResultCode')
    try:
        result_code = int(result_code)
    except (TypeError, ValueError):
        result_code = None

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
            if payment.order.status != 'paid' and payment.order.status not in {'cancelled', 'delivered'}:
                # Update order to 'paid' status
                OrderStatusManager.update_status(
                    order=payment.order,
                    new_status='paid',
                    changed_by=None,
                    notes=f'M-Pesa payment confirmed. Receipt: {payment.mpesa_receipt_number or payment.receipt_number}',
                )
                
                # Notify dealers to prepare products
                from dealer.models import DealerNotification
                from orders.models import OrderItem
                import logging
                logger = logging.getLogger(__name__)
                
                try:
                    order_items = OrderItem.objects.filter(order=payment.order).select_related('product__dealer')
                    notified_dealers = set()
                    
                    for item in order_items:
                        if item.product.dealer and item.product.dealer.id not in notified_dealers:
                            dealer = item.product.dealer
                            notified_dealers.add(dealer.id)
                            
                            # Count items for this dealer
                            dealer_items = order_items.filter(product__dealer=dealer)
                            total_qty = sum(oi.quantity for oi in dealer_items)
                            
                            DealerNotification.objects.create(
                                dealer=dealer,
                                notification_type='payment_confirmed',
                                title=f'Payment Confirmed - Order #{payment.order.order_number}',
                                message=f'M-Pesa payment confirmed. Please prepare {total_qty} items for delivery to {payment.order.customer_name}.',
                                reference_id=str(payment.order.id)
                            )
                            logger.info(f"Dealer {dealer.id} notified for order {payment.order.order_number}")
                            
                            # Send real-time WebSocket notification
                            try:
                                from services.websocket_service import WebSocketService
                                ws_service = WebSocketService()
                                ws_service.send_to_dealer(
                                    dealer_id=dealer.id,
                                    message={
                                        'type': 'new_order',
                                        'order_id': str(payment.order.id),
                                        'order_number': payment.order.order_number,
                                        'customer_name': payment.order.customer_name,
                                        'total_qty': total_qty,
                                        'total_amount': str(payment.order.total_amount),
                                        'message': f'New paid order #{payment.order.order_number} with {total_qty} items'
                                    }
                                )
                            except Exception as ws_error:
                                logger.error(f"WebSocket notification failed for dealer {dealer.id}: {ws_error}")
                except Exception as e:
                    logger.error(f"Error creating dealer notifications: {e}")
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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        serializer = PaymentInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check that the order exists and belongs to the current user (via created_by)
        order = Order.objects.filter(id=serializer.validated_data['order_id'], created_by=request.user).first()
        if not order:
            return Response(
                build_error_response(message='Order not found or you do not have permission to pay for this order', code='NOT_FOUND'),
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Validate order has a valid total amount
        if order.total_amount is None or order.total_amount <= 0:
            logger.error(f"Order {order.id} has invalid total_amount: {order.total_amount}")
            return Response(
                build_error_response(message='Order has invalid amount. Please contact support.', code='INVALID_ORDER_AMOUNT'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_method = serializer.validated_data.get('payment_method', 'mpesa')
        if payment_method == 'cash':
            return record_cash_payment(request)

        # Create payment record
        try:
            payment = Payment.objects.create(
                order=order,
                payment_method='mpesa',
                phone_number=serializer.validated_data['phone_number'],
                amount=order.total_amount,
                status='pending',
            )
        except Exception as e:
            logger.error(f"Failed to create payment record: {str(e)}")
            return Response(
                build_error_response(message='Failed to create payment record', code='DATABASE_ERROR', data={'error': str(e)}),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Initiate STK Push
        try:
            token_response = initiate_stk_push(
                phone=serializer.validated_data['phone_number'],
                amount=payment.amount,
                order_id=order.id,
            )
        except Exception as e:
            logger.error(f"STK Push initiation error: {str(e)}")
            payment.status = 'failed'
            payment.save(update_fields=['status'])
            return Response(
                build_error_response(message=f'Payment service error: {str(e)}', code='PAYMENT_SERVICE_ERROR'),
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not token_response.get('success'):
            payment.status = 'failed'
            payment.save(update_fields=['status'])
            return Response(
                build_error_response(
                    message=token_response.get('message') or token_response.get('error') or 'Failed to initiate payment',
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
        
    except Exception as e:
        logger.error(f"Unhandled error in initiate_payment: {str(e)}", exc_info=True)
        return Response(
            build_error_response(message=f'Payment processing error: {str(e)}', code='INTERNAL_ERROR'),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
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

    if not (request.user.is_staff or getattr(request.user, 'role', '') == 'dealer' or order.created_by == request.user):
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

        if order.status != 'paid' and order.status not in {'cancelled', 'delivered'}:
            OrderStatusManager.update_status(
                order=order,
                new_status='paid',
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
    order = Order.objects.filter(id=order_id, created_by=request.user).first()
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

    # Fallback reconciliation path: if callback is delayed/missed, query Daraja directly.
    if payment.status == 'pending' and payment.checkout_request_id:
        query_response = query_stk_status(payment.checkout_request_id)
        if query_response.get('success'):
            data = query_response.get('data', {})
            result_code = data.get('ResultCode')
            try:
                result_code = int(result_code)
            except (TypeError, ValueError):
                result_code = None

            if result_code == 0:
                payment.status = 'completed'
                payment.payment_method = 'mpesa'
                payment.mpesa_receipt_number = data.get('MpesaReceiptNumber') or payment.mpesa_receipt_number
                payment.receipt_number = payment.mpesa_receipt_number or payment.receipt_number
                payment.save(update_fields=['status', 'payment_method', 'mpesa_receipt_number', 'receipt_number', 'updated_at'])

                if payment.order.status != 'paid' and payment.order.status not in {'cancelled', 'delivered'}:
                    OrderStatusManager.update_status(
                        order=payment.order,
                        new_status='paid',
                        changed_by=None,
                        notes=f'Payment confirmed via STK query. M-Pesa Receipt: {payment.mpesa_receipt_number or payment.receipt_number}',
                    )
            elif result_code in {1, 1032, 2001}:
                payment.status = 'cancelled' if result_code == 1032 else 'failed'
                payment.save(update_fields=['status', 'updated_at'])

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
