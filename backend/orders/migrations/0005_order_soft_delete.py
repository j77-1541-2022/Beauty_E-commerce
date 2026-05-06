# Generated migration for soft-delete functionality

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0004_order_shipping_zone'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='deleted_by_customer',
            field=models.BooleanField(default=False, help_text='True if customer deleted this order from their view'),
        ),
        migrations.AddField(
            model_name='order',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
