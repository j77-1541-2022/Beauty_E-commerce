#!/usr/bin/env python
"""
API Endpoint Validation Checker
Ensures all critical payment and order endpoints are properly configured
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.urls import resolve, reverse, path
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

print("=" * 80)
print("API ENDPOINT VALIDATION")
print("=" * 80)

# Get or create test user
user, _ = User.objects.get_or_create(
    username='apitest',
    defaults={'email': 'api@test.com', 'is_active': True}
)

# Generate auth token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

endpoints = [
    ('GET', '/api/v1/orders/', 'List all orders'),
    ('GET', '/api/v1/orders/1/', 'Get specific order (if exists)'),
    ('POST', '/api/v1/orders/', 'Create order'),
    ('GET', '/api/v1/payments/status/1/', 'Check payment status'),
    ('GET', '/api/v1/dealer/orders/', 'Get dealer orders'),
    ('GET', '/api/v1/dealer/dashboard/', 'Get dealer dashboard'),
]

print("\nChecking Critical Endpoints:")
print("-" * 80)

for method, endpoint, description in endpoints:
    try:
        if method == 'GET':
            response = client.get(endpoint)
        elif method == 'POST':
            response = client.post(endpoint, {}, format='json')
        
        status_ok = response.status_code < 500
        status_icon = "✓" if status_ok else "❌"
        
        print(f"{status_icon} [{method}] {endpoint}")
        print(f"  └─ {description}")
        print(f"  └─ Status: {response.status_code}")
        
        if response.status_code >= 500:
            print(f"  └─ ERROR: {response.content[:100]}")
    except Exception as e:
        print(f"❌ [{method}] {endpoint}")
        print(f"  └─ {description}")
        print(f"  └─ ERROR: {str(e)[:100]}")

print("\n" + "=" * 80)
print("Endpoint validation complete")
print("=" * 80)
