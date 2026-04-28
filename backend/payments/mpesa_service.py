import requests
import base64
import json
import hashlib
import hmac
from datetime import datetime
from decimal import Decimal
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def _get_mpesa_base_url():
    return "https://sandbox.safaricom.co.ke" if settings.MPESA_ENV == 'sandbox' else "https://api.safaricom.co.ke"


def _get_timeout_seconds():
    return int(getattr(settings, 'MPESA_REQUEST_TIMEOUT', 30))


def _is_mpesa_configured():
    required = [
        'MPESA_CONSUMER_KEY',
        'MPESA_CONSUMER_SECRET',
        'MPESA_SHORTCODE',
        'MPESA_PASSKEY',
        'MPESA_CALLBACK_URL',
    ]
    missing = [field for field in required if not getattr(settings, field, None)]
    return {'configured': len(missing) == 0, 'missing': missing}


def _normalize_phone_number(phone):
    formatted = str(phone or '').replace(' ', '').replace('-', '')
    if formatted.startswith('0'):
        formatted = '254' + formatted[1:]
    elif formatted.startswith('+'):
        formatted = formatted[1:]
    if not (formatted.startswith('254') and len(formatted) == 12 and formatted.isdigit()):
        return None
    return formatted


def _error_from_response(response):
    try:
        payload = response.json()
    except ValueError:
        payload = {}

    return (
        payload.get('errorMessage')
        or payload.get('error_description')
        or payload.get('message')
        or response.text
        or 'Unknown M-Pesa API error'
    )


def validate_callback_signature(raw_body=None, signature=None):
    """
    Validate M-Pesa callback signature using HMAC.
    In production, Safaricom sends a signature header that should be validated.
    For sandbox/testing, this returns True (signature validation optional).
    """
    validation_key = getattr(settings, 'MPESA_CALLBACK_VALIDATION_KEY', None)
    if not validation_key:
        return True

    try:
        if not signature:
            logger.warning("M-Pesa callback signature validation key is set but no signature was provided")
            return False

        if isinstance(raw_body, (bytes, bytearray)):
            payload_bytes = raw_body
        elif isinstance(raw_body, str):
            payload_bytes = raw_body.encode('utf-8')
        else:
            payload_bytes = json.dumps(raw_body or {}, separators=(',', ':'), sort_keys=True).encode('utf-8')

        computed_signature = hmac.new(
            validation_key.encode('utf-8'),
            payload_bytes,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(computed_signature, str(signature).strip())
    except Exception as e:
        logger.error(f"Callback signature validation error: {str(e)}")
        return False


def get_access_token():
    """Get OAuth access token from Daraja API"""
    config_state = _is_mpesa_configured()
    if not config_state['configured']:
        return {
            'success': False,
            'error': f"M-Pesa configuration missing: {', '.join(config_state['missing'])}",
            'message': 'M-Pesa is not fully configured',
        }

    try:
        url = f"{_get_mpesa_base_url()}/oauth/v1/generate?grant_type=client_credentials"
        auth_string = base64.b64encode(
            f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}".encode()
        ).decode()

        logger.info(f"Requesting M-Pesa access token from: {url}")
        logger.info(f"Consumer Key (first 10 chars): {settings.MPESA_CONSUMER_KEY[:10]}...")

        response = requests.get(
            url,
            headers={'Authorization': f'Basic {auth_string}'},
            timeout=_get_timeout_seconds(),
        )

        # Handle specific error codes
        if response.status_code == 403:
            error_body = response.text
            logger.error(f"M-Pesa 403 Forbidden. Response: {error_body}")
            return {
                'success': False,
                'error': 'Invalid M-Pesa credentials (403 Forbidden)',
                'message': 'Your Consumer Key or Secret is invalid, expired, or the app is not approved. Visit https://developer.safaricom.co.ke to verify your credentials.',
                'details': error_body,
                'troubleshooting': [
                    '1. Log in to https://developer.safaricom.co.ke',
                    '2. Go to "My Apps" and verify your app is approved',
                    '3. Check that Consumer Key and Secret match exactly (no extra spaces)',
                    '4. If testing locally, ensure your IP is whitelisted (or use ngrok)',
                    '5. For new apps, wait 5-10 minutes after approval before testing'
                ]
            }

        if response.status_code == 401:
            error_body = response.text
            logger.error(f"M-Pesa 401 Unauthorized. Response: {error_body}")
            return {
                'success': False,
                'error': 'M-Pesa authentication failed (401 Unauthorized)',
                'message': 'Authorization header is invalid or missing.',
                'details': error_body
            }

        response.raise_for_status()
        data = response.json()
        token = data.get('access_token')

        if not token:
            logger.error(f"M-Pesa response missing access_token: {data}")
            return {
                'success': False,
                'error': 'OAuth token missing from M-Pesa response',
                'message': 'Failed to authenticate with M-Pesa - invalid response format',
                'details': str(data)
            }

        logger.info("M-Pesa access token obtained successfully")
        return {'success': True, 'token': token}

    except requests.exceptions.HTTPError as e:
        error_msg = f"HTTP Error {e.response.status_code}: {str(e)}"
        logger.error(f"MPesa HTTP error: {error_msg}")
        return {
            'success': False,
            'error': error_msg,
            'message': f'M-Pesa API returned error {e.response.status_code}',
            'details': e.response.text if hasattr(e.response, 'text') else str(e)
        }
    except requests.exceptions.ConnectionError as e:
        logger.error(f"MPesa connection error: {str(e)}")
        return {
            'success': False,
            'error': 'Cannot connect to M-Pesa API',
            'message': 'Network error - check your internet connection or M-Pesa API availability'
        }
    except requests.exceptions.Timeout as e:
        logger.error(f"MPesa timeout error: {str(e)}")
        return {
            'success': False,
            'error': 'M-Pesa API request timed out',
            'message': 'Request took too long - try again later'
        }
    except Exception as e:
        logger.error(f"MPesa access token error: {str(e)}")
        return {'success': False, 'error': str(e), 'message': 'Failed to authenticate with M-Pesa'}


def initiate_stk_push(phone, amount, order_id, callback_url=None):
    """Initiate STK Push to customer's phone"""
    try:
        phone = _normalize_phone_number(phone)
        if not phone:
            return {'success': False, 'error': 'Invalid phone number format. Use 2547XXXXXXXX', 'message': 'Invalid phone number'}

        # Handle Decimal, float, string, or int amounts
        try:
            if isinstance(amount, Decimal):
                normalized_amount = int(amount)
            else:
                normalized_amount = int(float(amount))
        except (TypeError, ValueError, ArithmeticError) as e:
            logger.error(f"Amount conversion error: {amount} ({type(amount)}) - {str(e)}")
            return {'success': False, 'error': f'Invalid payment amount: {amount}', 'message': 'Invalid payment amount'}

        if normalized_amount <= 0:
            return {'success': False, 'error': 'Amount must be greater than zero', 'message': 'Invalid payment amount'}
        
        # Get access token
        token_response = get_access_token()
        if not token_response['success']:
            logger.error(f"Access token failed: {token_response.get('error')}")
            return token_response
        
        # Generate password
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
        ).decode()

        # Prepare request
        url = f"{_get_mpesa_base_url()}/mpesa/stkpush/v1/processrequest"
        headers = {'Authorization': f'Bearer {token_response["token"]}', 'Content-Type': 'application/json'}

        payload = {
            'BusinessShortCode': settings.MPESA_SHORTCODE,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': normalized_amount,
            'PartyA': phone,
            'PartyB': settings.MPESA_SHORTCODE,
            'PhoneNumber': phone,
            'CallBackURL': callback_url or settings.MPESA_CALLBACK_URL,
            'AccountReference': f'Order-{order_id}',
            'TransactionDesc': 'Glow Beyond Beauty Purchase'
        }

        response = requests.post(url, json=payload, headers=headers, timeout=_get_timeout_seconds())
        response.raise_for_status()
        data = response.json()

        if data.get('ResponseCode') == '0':
            return {
                'success': True,
                'checkout_request_id': data.get('CheckoutRequestID'),
                'merchant_request_id': data.get('MerchantRequestID'),
                'message': data.get('CustomerMessage', 'STK Push sent successfully')
            }
        return {
            'success': False,
            'error': data.get('errorMessage', 'Unknown M-Pesa error'),
            'message': data.get('errorMessage', 'Failed to initiate STK push'),
            'data': data,
        }

    except requests.RequestException as e:
        response = getattr(e, 'response', None)
        if response is not None:
            error_message = _error_from_response(response)
            logger.error(f"STK Push API error: status={response.status_code} error={error_message}")
            return {'success': False, 'error': error_message, 'message': 'Failed to initiate STK push'}
        logger.error(f"STK Push request error: {str(e)}")
        return {'success': False, 'error': str(e), 'message': 'Failed to initiate STK push'}
    except Exception as e:
        logger.error(f"STK Push error: {str(e)}")
        return {'success': False, 'error': str(e), 'message': 'Failed to initiate STK push'}


def query_stk_status(checkout_request_id):
    """Query status of STK push transaction"""
    if not checkout_request_id:
        return {'success': False, 'error': 'CheckoutRequestID is required'}

    try:
        token_response = get_access_token()
        if not token_response['success']:
            return token_response

        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
        ).decode()

        url = f"{_get_mpesa_base_url()}/mpesa/stkpushquery/v1/query"
        headers = {'Authorization': f'Bearer {token_response["token"]}', 'Content-Type': 'application/json'}

        payload = {
            'BusinessShortCode': settings.MPESA_SHORTCODE,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }

        response = requests.post(url, json=payload, headers=headers, timeout=_get_timeout_seconds())
        response.raise_for_status()
        return {'success': True, 'data': response.json()}
    except requests.RequestException as e:
        response = getattr(e, 'response', None)
        if response is not None:
            return {'success': False, 'error': _error_from_response(response)}
        return {'success': False, 'error': str(e)}
    except Exception as e:
        return {'success': False, 'error': str(e)}
