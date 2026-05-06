# Merge migration to resolve conflicting leaf nodes

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_order_soft_delete'),
        ('orders', '0005_order_soft_delete'),
    ]

    operations = [
    ]
