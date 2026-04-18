"""
HMAC Payment Validation - Section E
Secure payment confirmation with HMAC signature validation.
"""
import hmac
import hashlib
import base64
import json
from django.conf import settings
from django.utils import timezone
from typing import Dict, Optional


class PaymentValidator:
    """
    Validates payment callbacks using HMAC signatures.
    Prevents payment tampering and ensures data integrity.
    """
    
    @staticmethod
    def generate_signature(payload: Dict, secret_key: str = None) -> str:
        """
        Generate HMAC signature for payment payload.
        
        Args:
            payload: Payment data dictionary
            secret_key: Secret key for signing (defaults to settings.SECRET_KEY)
        
        Returns:
            Base64-encoded HMAC signature
        """
        if secret_key is None:
            secret_key = getattr(settings, 'PAYMENT_SECRET_KEY', settings.SECRET_KEY)
        
        # Sort payload keys for consistent serialization
        message = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        
        # Generate HMAC
        signature = hmac.new(
            secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        return base64.b64encode(signature).decode('utf-8')
    
    @staticmethod
    def verify_signature(payload: Dict, signature: str, secret_key: str = None) -> bool:
        """
        Verify HMAC signature for payment payload.
        
        Args:
            payload: Payment data dictionary
            signature: Provided signature to verify
            secret_key: Secret key for verification
        
        Returns:
            True if signature is valid, False otherwise
        """
        expected_signature = PaymentValidator.generate_signature(payload, secret_key)
        
        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(signature, expected_signature)
    
    @staticmethod
    def validate_payment_callback(
        transaction_id: str,
        amount: float,
        status: str,
        timestamp: str,
        signature: str,
        secret_key: str = None
    ) -> Dict:
        """
        Validate a complete payment callback with HMAC.
        
        Args:
            transaction_id: Payment transaction ID
            amount: Payment amount
            status: Payment status
            timestamp: Callback timestamp
            signature: HMAC signature
            secret_key: Secret key
        
        Returns:
            Dict with validation result
        """
        # Build payload for verification
        payload = {
            'transaction_id': transaction_id,
            'amount': str(amount),
            'status': status,
            'timestamp': timestamp
        }
        
        # Verify signature
        if not PaymentValidator.verify_signature(payload, signature, secret_key):
            return {
                'valid': False,
                'error': 'Invalid signature. Payment may have been tampered with.',
                'code': 'INVALID_SIGNATURE'
            }
        
        # Check timestamp to prevent replay attacks (5 minute window)
        try:
            callback_time = timezone.datetime.fromisoformat(timestamp)
            time_diff = (timezone.now() - callback_time).total_seconds()
            
            if abs(time_diff) > 300:  # 5 minutes
                return {
                    'valid': False,
                    'error': 'Payment callback expired. Please retry.',
                    'code': 'CALLBACK_EXPIRED'
                }
        except ValueError:
            return {
                'valid': False,
                'error': 'Invalid timestamp format.',
                'code': 'INVALID_TIMESTAMP'
            }
        
        return {
            'valid': True,
            'transaction_id': transaction_id,
            'amount': amount,
            'status': status
        }
    
    @staticmethod
    def generate_payment_payload(order_id: str, amount: float, customer_email: str) -> Dict:
        """
        Generate signed payment payload for initiating payment.
        
        Args:
            order_id: Order ID
            amount: Payment amount
            customer_email: Customer email
        
        Returns:
            Dict with payment data and signature
        """
        timestamp = timezone.now().isoformat()
        
        payload = {
            'order_id': order_id,
            'amount': str(amount),
            'customer_email': customer_email,
            'timestamp': timestamp
        }
        
        signature = PaymentValidator.generate_signature(payload)
        
        return {
            **payload,
            'signature': signature
        }


class IdempotencyValidator:
    """
    Validates idempotency keys to prevent duplicate payments.
    """
    
    # In production, use Redis or database for storage
    _processed_keys = set()
    
    @staticmethod
    def validate_idempotency_key(key: str) -> bool:
        """
        Check if idempotency key has been used.
        
        Args:
            key: Idempotency key
        
        Returns:
            True if key is new (valid), False if already used
        """
        if key in IdempotencyValidator._processed_keys:
            return False
        
        IdempotencyValidator._processed_keys.add(key)
        return True
    
    @staticmethod
    def clear_key(key: str):
        """Clear a processed key (for testing)."""
        IdempotencyValidator._processed_keys.discard(key)


def verify_mpesa_callback(
    result_code: int,
    result_desc: str,
    merchant_request_id: str,
    checkout_request_id: str,
    amount: float,
    mpesa_receipt_number: str,
    transaction_date: str,
    phone_number: str,
    signature: str
) -> Dict:
    """
    Verify M-Pesa callback with HMAC validation.
    
    Args:
        result_code: M-Pesa result code
        result_desc: Result description
        merchant_request_id: Merchant request ID
        checkout_request_id: Checkout request ID
        amount: Payment amount
        mpesa_receipt_number: M-Pesa receipt number
        transaction_date: Transaction date
        phone_number: Customer phone number
        signature: HMAC signature
    
    Returns:
        Dict with verification result
    """
    # Build payload
    payload = {
        'result_code': str(result_code),
        'result_desc': result_desc,
        'merchant_request_id': merchant_request_id,
        'checkout_request_id': checkout_request_id,
        'amount': str(amount),
        'mpesa_receipt_number': mpesa_receipt_number,
        'transaction_date': transaction_date,
        'phone_number': phone_number
    }
    
    # Verify signature
    if not PaymentValidator.verify_signature(payload, signature):
        return {
            'valid': False,
            'error': 'M-Pesa callback signature verification failed',
            'code': 'MPESA_INVALID_SIGNATURE'
        }
    
    # Check result code
    if result_code != 0:
        return {
            'valid': False,
            'error': f'M-Pesa payment failed: {result_desc}',
            'code': 'MPESA_PAYMENT_FAILED'
        }
    
    return {
        'valid': True,
        'receipt_number': mpesa_receipt_number,
        'amount': amount,
        'phone_number': phone_number
    }
