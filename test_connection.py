import requests
import json

print("Testing Frontend-Backend Connection...")
print("=" * 50)

# Test 1: Direct API access
try:
    response = requests.get('http://localhost:8000/api/health/', timeout=5)
    print(f"✅ Backend Health: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"❌ Backend Health Error: {e}")

# Test 2: Authentication
try:
    login_data = {'username': 'admin', 'password': 'admin123'}
    auth_response = requests.post('http://localhost:8000/api/auth/token/', json=login_data, timeout=5)
    print(f"✅ Auth Status: {auth_response.status_code}")
    
    if auth_response.status_code == 200:
        token = auth_response.json()['access']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test authenticated APIs
        endpoints = [
            ('/products/', 'Products'),
            ('/inventory/', 'Inventory'),
            ('/orders/', 'Orders'),
            ('/analytics/dashboard/', 'Analytics')
        ]
        
        for endpoint, name in endpoints:
            try:
                api_response = requests.get(f'http://localhost:8000/api{endpoint}', headers=headers, timeout=5)
                data = api_response.json()
                count = len(data.get('results', data))
                print(f"✅ {name} API: {api_response.status_code} ({count} items)")
            except Exception as e:
                print(f"❌ {name} API Error: {e}")
    else:
        print("❌ Authentication Failed")
        
except Exception as e:
    print(f"❌ Connection Error: {e}")

print("=" * 50)
print("🎯 Frontend should be able to access all these APIs:")
print("📱 Frontend URL: http://localhost:3000")
print("🔧 Backend URL: http://localhost:8000/api")
print("🔐 Login: admin / admin123")
print("🌸 All systems should be in sync!")
