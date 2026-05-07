from pathlib import Path
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-beauty-ecommerce-secret-key-change-in-production')

def _parse_debug_value(raw_value, default=True):
    if raw_value is None:
        return default

    if isinstance(raw_value, bool):
        return raw_value

    normalized = str(raw_value).strip().lower()
    if normalized in {'1', 'true', 'yes', 'on', 'debug'}:
        return True
    if normalized in {'0', 'false', 'no', 'off'}:
        return False

    return default


DEBUG = _parse_debug_value(config('DEBUG', default='True'))

# Build ALLOWED_HOSTS list
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'testserver']

# Add Railway production domain explicitly
ALLOWED_HOSTS.append('beautye-commerce-production.up.railway.app')

# Add Railway domain patterns (leading dot for subdomains)
ALLOWED_HOSTS.extend([
    '.railway.app',
    '.up.railway.app',
])

# Allow custom domain if provided via environment variable
CUSTOM_DOMAIN = config('CUSTOM_DOMAIN', default='')
if CUSTOM_DOMAIN:
    ALLOWED_HOSTS.append(CUSTOM_DOMAIN)

# Allow temporary ngrok callback hosts during local development.
if DEBUG:
    ALLOWED_HOSTS += ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'django_filters',
    'drf_spectacular',  # Section G4 - Swagger/OpenAPI
    'channels',
    'users',
    'products',
    'inventory',
    'orders',
    'cart',
    'wishlist',
    'payments',
    'analytics',
    'dss',
    'dealer',
    'audit',
    'notifications',
    'reviews',
    'loyalty',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # WhiteNoise for static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'audit.middleware.AuditMiddleware',
    'utils.security_middleware.SecurityHeadersMiddleware',  # Section G5
]

# Section G5 - Production Security Settings
CSRF_TRUSTED_ORIGINS = [
    'https://.railway.app',
    'https://.up.railway.app',
    'https://beautye-commerce-production.up.railway.app',
]

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    X_FRAME_OPTIONS = 'DENY'
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

ROOT_URLCONF = 'beauty_ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'beauty_ecommerce.wsgi.application'

# Database configuration - PostgreSQL for production, SQLite for local
DATABASE_URL = config('DATABASE_URL', default='sqlite:///db.sqlite3')
if DATABASE_URL == 'sqlite:///db.sqlite3':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'EXCEPTION_HANDLER': 'utils.exception_handler.custom_exception_handler',
    # Section G3 - Rate Limiting
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '10/minute',  # Custom rate for login attempts
        'payment': '5/minute',  # Custom rate for payment initiation
    },
    # Section G2 - API Versioning
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
    'DEFAULT_VERSION': 'v1',
    'ALLOWED_VERSIONS': ['v1'],
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True

CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Section G4 - drf-spectacular OpenAPI 3 schema configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'Glow Beyond Beauty API',
    'DESCRIPTION': 'Production-grade beauty e-commerce platform API with role-based access control',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_COERCE_PATH_PK_SUFFIX': True,
    'SECURITY': [{'Bearer': []}],
    'TAGS': [
        {'name': 'Authentication', 'description': 'User login, registration, token management'},
        {'name': 'Users', 'description': 'User management and profiles'},
        {'name': 'Products', 'description': 'Product catalog management'},
        {'name': 'Inventory', 'description': 'Stock management and movements'},
        {'name': 'Orders', 'description': 'Order processing and management'},
        {'name': 'Cart', 'description': 'Shopping cart operations'},
        {'name': 'Wishlist', 'description': 'User wishlist management'},
        {'name': 'Payments', 'description': 'M-Pesa and other payment processing'},
        {'name': 'Dealer', 'description': 'Dealer portal APIs'},
        {'name': 'Audit', 'description': 'Audit trail and logging'},
    ],
}
MPESA_CONSUMER_KEY = config('MPESA_CONSUMER_KEY', default='')
MPESA_CONSUMER_SECRET = config('MPESA_CONSUMER_SECRET', default='')
MPESA_SHORTCODE = config('MPESA_SHORTCODE', default='174379')  # Sandbox test shortcode
MPESA_PASSKEY = config('MPESA_PASSKEY', default='bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')


def _normalize_mpesa_callback_url(raw_url: str) -> str:
    raw_url = (raw_url or '').strip()
    if not raw_url:
        return 'https://your-ngrok-url.ngrok-free.app/api/v1/payments/callback/'

    if raw_url.startswith('http://') or raw_url.startswith('https://'):
        if '/api/' not in raw_url:
            return raw_url.rstrip('/') + '/api/v1/payments/callback/'
        return raw_url.rstrip('/') + '/'

    return f'https://{raw_url.lstrip("/").rstrip("/")}/api/v1/payments/callback/'


MPESA_CALLBACK_URL = _normalize_mpesa_callback_url(
    config('MPESA_CALLBACK_URL', default='https://your-ngrok-url.ngrok-free.app/api/v1/payments/callback/')
)
MPESA_ENV = config('MPESA_ENV', default='sandbox')  # 'sandbox' or 'production'
MPESA_REQUEST_TIMEOUT = config('MPESA_REQUEST_TIMEOUT', default=30, cast=int)
MPESA_CALLBACK_VALIDATION_KEY = config('MPESA_CALLBACK_VALIDATION_KEY', default='')

# CORS settings for M-Pesa callback
CORS_ALLOW_ALL_ORIGINS = True  # Temporarily for sandbox testing

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Glow Beyond Beauty <noreply@glowbeyond.com>')

# Frontend URL for email links
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# URL used by Django admin "View site" link (top-right navigation).
# Default points to the frontend admin portal.
ADMIN_SITE_URL = config('ADMIN_SITE_URL', default='http://localhost:3001/admin')

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'daily-low-stock-check': {
        'task': 'notifications.tasks.daily_low_stock_check',
        'schedule': 86400.0,  # 24 hours in seconds (8am daily requires crontab in production)
    },
}

# For production, use crontab(hour=8, minute=0) for exactly 8am
# CELERY_BEAT_SCHEDULE = {
#     'daily-low-stock-check': {
#         'task': 'notifications.tasks.daily_low_stock_check',
#         'schedule': crontab(hour=8, minute=0),
#     },
# }

# Channels configuration with fallback
try:
    from channels_fallback import get_channels_config
    config = get_channels_config()
    
    if config.get('CHANNEL_LAYERS'):
        ASGI_APPLICATION = config['ASGI_APPLICATION']
        CHANNEL_LAYERS = config['CHANNEL_LAYERS']
    else:
        ASGI_APPLICATION = config['ASGI_APPLICATION']
        # CHANNEL_LAYERS not set when Redis unavailable
        
except ImportError:
    # Fallback to default Channels configuration
    ASGI_APPLICATION = 'beauty_ecommerce.asgi.application'
    CHANNEL_LAYERS = {}
