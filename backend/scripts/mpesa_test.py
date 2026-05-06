import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')
django.setup()

from payments.mpesa_service import get_access_token, query_stk_status

print('get_access_token:')
print(json.dumps(get_access_token(), ensure_ascii=False))
print('\nquery_stk_status:')
print(json.dumps(query_stk_status('ws_CO_03052026224922074111551064'), ensure_ascii=False))
