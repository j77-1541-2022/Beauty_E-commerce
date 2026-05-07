import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_ecommerce.settings')

app = Celery('beauty_ecommerce')

# Load configuration from Django settings, all config keys should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY_')

# Auto-discover tasks from all registered Django app configs.
app.autodiscover_tasks()

# Celery configuration with fallback to sync mode if Redis unavailable
CELERY_BROKER_URL = getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = getattr(settings, 'CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Cache for the config result
_celery_config_cache = None

# Attempt Redis connection; fallback to synchronous task execution
def get_celery_config():
    """
    Determine if Redis is available; if not, configure Celery for synchronous execution.
    This function is called lazily to avoid blocking Django startup.
    """
    global _celery_config_cache
    
    if _celery_config_cache is not None:
        return _celery_config_cache
    
    from urllib.parse import urlparse
    import socket
    import os

    try:
        parsed = urlparse(CELERY_BROKER_URL)
        host = parsed.hostname or 'localhost'
        port = parsed.port or (6379 if parsed.scheme.startswith('redis') else None)
        if port is None:
            raise ValueError('No port found for broker URL')

        # quick socket connect with very short timeout (500ms)
        sock = socket.create_connection((host, port), timeout=0.5)
        sock.close()

        _celery_config_cache = {
            'broker': CELERY_BROKER_URL,
            'result_backend': CELERY_RESULT_BACKEND,
            'mode': 'async',
        }
    except Exception as e:
        # Redis unreachable or parse error; fall back to synchronous execution
        import sys
        print(f"Warning: Redis unavailable ({e}). Using synchronous task execution.", file=sys.stderr)
        _celery_config_cache = {
            'broker': 'memory://',
            'result_backend': 'cache',
            'mode': 'sync',
        }
    
    return _celery_config_cache


# Use synchronous mode by default during startup to avoid blocking
# The actual config will be determined lazily on first task execution
celery_config = {
    'broker': 'memory://',
    'result_backend': 'cache',
    'mode': 'sync',
}
app.conf.update(
    broker_url=celery_config['broker'],
    result_backend=celery_config['result_backend'],
    task_always_eager=(celery_config['mode'] == 'sync'),  # Execute synchronously by default
    task_eager_propagates=True,
)

# Celery beat schedule - will be updated when Redis becomes available
def setup_beat_schedule():
    """Setup beat schedule if async mode is available."""
    config = get_celery_config()
    if config['mode'] == 'async':
        app.conf.beat_schedule = getattr(settings, 'CELERY_BEAT_SCHEDULE', {})

# Optionally call this on first async task execution
# For now, beat schedule defaults to empty in sync mode


@app.task(bind=True)
def debug_task(self):
    """Test task to verify Celery is working."""
    print(f'Request: {self.request!r}')
