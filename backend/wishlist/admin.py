"""
Wishlist Admin Configuration - Section B
Professional admin setup for Wishlist and WishlistItem.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Wishlist, WishlistItem


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0
    readonly_fields = ['added_at']
    fields = ['product', 'added_at']


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'item_count', 'created_at', 'updated_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [WishlistItemInline]
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Items'


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['wishlist', 'product', 'added_at']
    list_filter = [('added_at', admin.DateFieldListFilter)]
    search_fields = ['wishlist__user__email', 'product__name']
    readonly_fields = ['added_at']
