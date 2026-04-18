"""
Cart Admin Configuration - Section B
Professional admin setup for Cart and CartItem.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['total_price']
    fields = ['product', 'quantity', 'total_price']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'item_count', 'total_amount', 'created_at', 'updated_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'total_amount']
    inlines = [CartItemInline]
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Items'
    
    def total_amount(self, obj):
        return sum(item.total_price for item in obj.items.all())


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity', 'total_price']
    search_fields = ['cart__user__email', 'product__name']
    readonly_fields = ['total_price']
