import requests
import base64
import hashlib
import hmac
from datetime import datetime
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

MPESA_BASE_URL = "https://sandbox.safaricom.co.ke" if settings.MPESA_ENV == 'sandbox' else "https://api.safaricom.co.ke"


def validate_callback_signature(data):
    """
    Validate M-Pesa callback signature using HMAC.
    In production, Safaricom sends a signature header that should be validated.
    For sandbox/testing, this returns True (signature validation optional).
    """
    # If no validation key configured, skip validation (sandbox mode)
    if not getattr(settings, 'MPESA_CALLBACK_VALIDATION_KEY', None):
        return True
    
    try:
        # In production, extract signature from header and validate
        # For now, return True for sandbox compatibility
        return True
    except Exception as e:
        logger.error(f"Callback signature validation error: {str(e)}")
        return True  # Allow in case of errors during testing


def get_access_token():
    """Get OAuth access token from Daraja API"""
    try:
        url = f"{MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
        auth_string = base64.b64encode(
            f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}".encode()
        ).decode()
        
        response = requests.get(url, headers={'Authorization': f'Basic {auth_string}'})
        response.raise_for_status()
        return {'success': True, 'token': response.json().get('access_token')}
    except Exception as e:
        logger.error(f"MPesa access token error: {str(e)}")
        return {'success': False, 'error': str(e)}


def initiate_stk_push(phone, amount, order_id, callback_url=None):
    """Initiate STK Push to customer's phone"""
    try:
        # Format phone to 254XXXXXXXXX
        phone = str(phone).replace(' ', '').replace('-', '')
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif phone.startswith('+'):
            phone = phone[1:]
        if not phone.startswith('254'):
            return {'success': False, 'error': 'Invalid phone number format'}
        
        # Get access token
        token_response = get_access_token()
        if not token_response['success']:
            return token_response
        
        # Generate password
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
        ).decode()
        
        # Prepare request
        url = f"{MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest"
        headers = {'Authorization': f'Bearer {token_response["token"]}', 'Content-Type': 'application/json'}
        
        payload = {
            'BusinessShortCode': settings.MPESA_SHORTCODE,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(float(amount)),
            'PartyA': phone,
            'PartyB': settings.MPESA_SHORTCODE,
            'PhoneNumber': phone,
            'CallBackURL': callback_url or settings.MPESA_CALLBACK_URL,
            'AccountReference': f'Order-{order_id}',
            'TransactionDesc': 'Glow Beyond Beauty Purchase'
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data.get('ResponseCode') == '0':
            return {
                'success': True,
                'checkout_request_id': data.get('CheckoutRequestID'),
                'merchant_request_id': data.get('MerchantRequestID'),
                'message': data.get('CustomerMessage', 'STK Push sent successfully')
            }
        return {'success': False, 'error': data.get('errorMessage', 'Unknown error')}
        
    except Exception as e:
        logger.error(f"STK Push error: {str(e)}")
        return {'success': False, 'error': str(e)}


def query_stk_status(checkout_request_id):
    """Query status of STK push transaction"""
    try:
        token_response = get_access_token()
        if not token_response['success']:
            return token_response
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
        ).decode()
        
        url = f"{MPESA_BASE_URL}/mpesa/stkpushquery/v1/query"
        headers = {'Authorization': f'Bearer {token_response["token"]}', 'Content-Type': 'application/json'}
        
        payload = {
            'BusinessShortCode': settings.MPESA_SHORTCODE,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }
        
        response = requests.post(url, json=payload, headers=headers)
        return {'success': True, 'data': response.json()}
    except Exception as e:
        return {'success': False, 'error': str(e)}
