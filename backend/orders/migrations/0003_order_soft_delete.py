# This migration was superseded by 0005_order_soft_delete
# Keeping it as a no-op for compatibility with existing migration history

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_initial'),
    ]

    operations = [
        # No operations - soft delete fields added in 0005_order_soft_delete
    ]
