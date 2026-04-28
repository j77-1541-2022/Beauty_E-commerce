# Generated migration for Forecast and ABCResult models

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Forecast',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('forecast_date', models.DateField(help_text='Date for which forecast is calculated')),
                ('forecast_quantity', models.DecimalField(decimal_places=2, max_digits=10)),
                ('alpha', models.DecimalField(decimal_places=2, default=0.3, max_digits=3, help_text='Exponential smoothing alpha parameter')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='forecasts', to='products.product')),
            ],
            options={
                'db_table': 'analytics_forecast',
                'ordering': ['forecast_date'],
                'unique_together': {('product', 'forecast_date')},
            },
        ),
        migrations.CreateModel(
            name='ABCResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('classification', models.CharField(choices=[('A', 'High Priority'), ('B', 'Medium Priority'), ('C', 'Low Priority')], max_length=1)),
                ('sales_value', models.DecimalField(decimal_places=2, max_digits=12)),
                ('cumulative_percentage', models.DecimalField(decimal_places=2, max_digits=5)),
                ('period_start', models.DateField(help_text='Start of analysis period')),
                ('period_end', models.DateField(help_text='End of analysis period')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='abc_results', to='products.product')),
            ],
            options={
                'db_table': 'analytics_abc_result',
                'ordering': ['-period_end', 'classification'],
                'unique_together': {('product', 'period_start', 'period_end')},
            },
        ),
    ]
