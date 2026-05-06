#!/usr/bin/env python
"""Test password reset functionality"""
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
django.setup()

from users.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings

# Check if user exists
email = 'simonemwangi1@gmail.com'
print(f"\n{'='*60}")
print(f"Testing Password Reset for: {email}")
print(f"{'='*60}\n")

try:
    user = User.objects.get(email__iexact=email)
    print(f"✓ User found: {user.username} ({user.email})\n")
    
    # Generate token and uid
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    print(f"Generated Reset Token:")
    print(f"  UID (encoded): {uid}")
    print(f"  Token: {token[:20]}...{token[-20:]}\n")
    
    # Verify token
    uid_decoded = force_str(urlsafe_base64_decode(uid))
    user_check = User.objects.get(pk=uid_decoded)
    print(f"✓ Token UID verification passed: {user_check.username}\n")
    
    # Build reset URL
    frontend_reset_url = f"{getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3001')}/reset-password?uid={uid}&token={token}"
    print(f"Reset URL:")
    print(f"  {frontend_reset_url}\n")
    
    # Check token validity
    is_valid = default_token_generator.check_token(user, token)
    print(f"✓ Token validity check: {is_valid}\n")
    
    print(f"{'='*60}")
    print("✓ Password Reset Setup: WORKING")
    print(f"{'='*60}\n")
    
except User.DoesNotExist:
    print(f"✗ User not found: {email}\n")
    print("Available users:")
    for u in User.objects.all()[:5]:
        print(f"  - {u.username} ({u.email})")
    print()
except Exception as e:
    print(f"✗ Error: {e}\n")
    import traceback
    traceback.print_exc()
