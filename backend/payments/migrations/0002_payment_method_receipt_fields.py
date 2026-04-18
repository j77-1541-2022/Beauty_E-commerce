from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='payment_method',
            field=models.CharField(choices=[('mpesa', 'M-Pesa'), ('cash', 'Cash'), ('card', 'Card')], default='mpesa', max_length=20),
        ),
        migrations.AddField(
            model_name='payment',
            name='receipt_number',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='cash_received_by',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
    ]