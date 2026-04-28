# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_alter_order_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='shipping_zone',
            field=models.CharField(
                choices=[
                    ('nairobi_cbd', 'Nairobi (CBD)'),
                    ('nairobi_other', 'Nairobi (Other)'),
                    ('machakos', 'Machakos Town'),
                    ('athi_river', 'Athi River'),
                    ('other', 'Other Locations'),
                ],
                default='nairobi_cbd',
                max_length=20,
            ),
        ),
    ]
