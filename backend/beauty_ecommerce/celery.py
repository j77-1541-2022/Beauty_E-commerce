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

# Attempt Redis connection; fallback to synchronous task execution
def get_celery_config():
    """
    Determine if Redis is available; if not, configure Celery for synchronous execution.
    """
    import redis
    try:
        # Test Redis connection
        r = redis.Redis.from_url(CELERY_BROKER_URL, socket_connect_timeout=2)
        r.ping()
        return {
            'broker': CELERY_BROKER_URL,
            'result_backend': CELERY_RESULT_BACKEND,
            'mode': 'async',
        }
    except (redis.ConnectionError, redis.BusyLoadingError, Exception):
        # Redis unavailable; use synchronous mode
        return {
            'broker': 'memory://',
            'result_backend': 'cache',
            'mode': 'sync',
        }


celery_config = get_celery_config()
app.conf.update(
    broker_url=celery_config['broker'],
    result_backend=celery_config['result_backend'],
    task_always_eager=(celery_config['mode'] == 'sync'),  # Execute synchronously
    task_eager_propagates=True,
)

# Celery beat schedule (only active if broker is Redis)
if celery_config['mode'] == 'async':
    app.conf.beat_schedule = getattr(settings, 'CELERY_BEAT_SCHEDULE', {})


@app.task(bind=True)
def debug_task(self):
    """Test task to verify Celery is working."""
    print(f'Request: {self.request!r}')
