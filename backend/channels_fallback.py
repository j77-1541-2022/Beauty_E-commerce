"""
Fallback configuration for when Redis is not available
Disables Channels functionality gracefully
"""

import os
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

# Global flag to prevent duplicate warnings
_redis_warning_shown = False

def get_channels_config():
    """Get Channels configuration with fallback"""
    
    global _redis_warning_shown
    
    # Check if Redis is available
    redis_available = True
    
    try:
        import redis
        # Try to connect to Redis with very short timeout
        r = redis.Redis(host='127.0.0.1', port=6379, db=0, socket_connect_timeout=0.5, socket_timeout=0.5)
        r.ping()
    except Exception as e:
        redis_available = False
        if not _redis_warning_shown:
            print(f"WARNING: Redis not available: {e}")
            print("Disabling WebSocket functionality - admin will work without real-time updates")
            _redis_warning_shown = True
    
    if redis_available:
        # Full Channels configuration
        return {
            'ASGI_APPLICATION': 'beauty_ecommerce.asgi.application',
            'CHANNEL_LAYERS': {
                'default': {
                    'BACKEND': 'channels_redis.core.RedisChannelLayer',
                    'CONFIG': {
                        'hosts': [('127.0.0.1', 6379)],
                    },
                },
            }
        }
    else:
        # Fallback configuration - disable Channels
        return {
            'ASGI_APPLICATION': 'beauty_ecommerce.wsgi.application',
            # Remove CHANNEL_LAYERS to disable Channels
        }

def apply_fallback_config():
    """Apply fallback configuration if Redis is not available"""
    
    global _redis_warning_shown
    
    config = get_channels_config()
    
    if not config.get('CHANNEL_LAYERS'):
        # Redis not available, disable Channels
        if hasattr(settings, 'CHANNEL_LAYERS'):
            delattr(settings, 'CHANNEL_LAYERS')
        
        # Set ASGI to WSGI application
        settings.ASGI_APPLICATION = 'beauty_ecommerce.wsgi.application'
        
        if not _redis_warning_shown:
            print("Fallback configuration applied - using WSGI without WebSocket support")
    else:
        if not _redis_warning_shown:
            print("Redis available - WebSocket functionality enabled")

# Auto-apply fallback when imported - but only once
if not hasattr(settings, '_CHANNELS_FALLBACK_APPLIED'):
    apply_fallback_config()
    settings._CHANNELS_FALLBACK_APPLIED = True
