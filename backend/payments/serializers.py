from rest_framework import serializers
from .models import Payment, PaymentCallback

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'payment_method', 'phone_number', 'amount', 'mpesa_receipt_number', 
                  'receipt_number', 'cash_received_by', 'checkout_request_id', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'mpesa_receipt_number', 'receipt_number', 'cash_received_by', 'checkout_request_id', 'status', 'created_at', 'updated_at']


class CashPaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)


class PaymentInitiateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    phone_number = serializers.CharField(max_length=15)
    payment_method = serializers.ChoiceField(choices=['mpesa', 'cash', 'card'], default='mpesa', required=False)


class PaymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'status', 'payment_method', 'mpesa_receipt_number', 'receipt_number', 'created_at', 'updated_at']
