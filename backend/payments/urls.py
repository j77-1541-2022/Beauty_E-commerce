from django.urls import path
from . import views

urlpatterns = [
    path('initiate/', views.initiate_payment, name='initiate-payment'),
    path('cash/', views.record_cash_payment, name='cash-payment'),
    path('callback/', views.payment_callback, name='payment-callback'),
    path('status/<int:order_id>/', views.payment_status, name='payment-status'),
]
