from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'is_approved', 'is_featured', 'created_at']
    list_filter = ['is_approved', 'is_featured', 'rating', 'created_at']
    search_fields = ['product__name', 'user__username', 'comment', 'title']
    list_editable = ['is_approved', 'is_featured']
    readonly_fields = ['created_at', 'updated_at', 'helpful_count']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Review Content', {
            'fields': ('product', 'user', 'rating', 'title', 'comment')
        }),
        ('Moderation', {
            'fields': ('is_approved', 'is_featured', 'helpful_count')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
