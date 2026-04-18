#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
django.setup()

from users.models import User

print("=" * 60)
print("DATABASE USER CHECK")
print("=" * 60)

# Check Users
try:
    users = User.objects.all()
    print(f"\nTotal Users: {users.count()}")
    for user in users:
        role = getattr(user, 'role', 'N/A')
        print(f"  ✓ {user.username} ({user.email}) - Role: {role}")
except Exception as e:
    print(f"User check error: {e}")

print("\n" + "=" * 60)
print("If no users exist, run: python manage.py create_test_users")
print("=" * 60)
