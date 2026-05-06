#!/usr/bin/env python
"""
Complete Payment Flow Diagnostic
Run this directly: python scripts/payment_diagnostic.py
"""
import os
import sys
import django

# Setup Django paths
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + '/..')

# Setup Django
django.setup()

# Now run the diagnostic
if __name__ == '__main__':
    from scripts.test_complete_payment_flow import PaymentFlowDiagnostic
    diagnostic = PaymentFlowDiagnostic()
    passed, failed = diagnostic.run_full_diagnostic()
    sys.exit(0 if failed == 0 else 1)
