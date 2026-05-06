#!/usr/bin/env python
"""
Payment Flow Diagnostic Runner
Executes the complete payment flow diagnostic
"""
import os
import sys
import subprocess

def main():
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    print("Running Complete Payment Flow Diagnostic...")
    print("=" * 80)
    
    # Run the diagnostic script via Django shell
    result = subprocess.run(
        [sys.executable, 'manage.py', 'shell'],
        input=open(os.path.join(script_dir, 'test_complete_payment_flow.py')).read(),
        text=True,
        capture_output=False
    )
    
    return result.returncode

if __name__ == '__main__':
    sys.exit(main())
