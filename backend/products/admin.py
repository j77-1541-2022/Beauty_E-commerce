"""
Products Admin Configuration - Section B
Professional admin setup for Category, Brand, Product, ProductVariant, ProductImage.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
from inventory.models import Inventory
from .models import Category, Brand, Product, ProductVariant, ProductImage


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['size', 'color', 'sku', 'additional_cost', 'is_active']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_primary', 'image_preview']
    readonly_fields = ['image_preview']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover;border-radius:4px;" />',
                obj.image.url
            )
        return 'No image'
    image_preview.short_description = 'Preview'


class InventoryItemInline(admin.TabularInline):
    """Inline for inventory - read only link to inventory admin"""
    model = Inventory
    verbose_name_plural = 'Inventory'
    fields = ['quantity', 'reorder_level', 'reorder_quantity', 'stock_status']
    readonly_fields = ['stock_status']
    can_delete = False
    max_num = 1
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'product_count', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    def product_count(self, obj):
        return obj.products.filter(is_active=True).count()
    product_count.short_description = 'Active Products'


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'logo_preview', 'product_count', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    def logo_preview(self, obj):
        if obj.logo:
            return format_html(
                '<img src="{}" width="40" height="40" style="object-fit:cover;border-radius:50%;" />',
                obj.logo.url
            )
        return 'No logo'
    logo_preview.short_description = 'Logo'
    
    def product_count(self, obj):
        return obj.products.filter(is_active=True).count()
    product_count.short_description = 'Active Products'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """
    Section B3 - Product Admin with stock status, inline variants/images/inventory.
    """
    list_display = [
        'name', 'category', 'brand', 'price_ksh', 'stock_status_badge',
        'is_active', 'created_at'
    ]
    list_filter = [
        'category', 'brand', 'is_active', 'created_at'
    ]
    search_fields = ['name', 'sku', 'description']
    ordering = ['-created_at']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sku', 'barcode', 'product_type', 'category', 'brand')
        }),
        ('Media', {
            'fields': ('primary_image', 'primary_image_preview'),
            'classes': ('collapse',)
        }),
        ('Pricing', {
            'fields': ('cost_price', 'selling_price', 'original_price', 'discount')
        }),
        ('Details', {
            'fields': ('description', 'ingredients', 'how_to_use', 'weight', 'dimensions')
        }),
        ('Status', {
            'fields': ('is_active', 'rating', 'review_count')
        }),
    )
    
    readonly_fields = ['primary_image_preview', 'rating', 'review_count', 'created_at', 'updated_at']
    inlines = [ProductImageInline, InventoryItemInline, ProductVariantInline]
    
    def primary_image_preview(self, obj):
        if obj.primary_image:
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover;border-radius:4px;" />',
                obj.primary_image.url
            )
        return 'No image'
    primary_image_preview.short_description = 'Image'
    
    def price_ksh(self, obj):
        """Display price in KSH with discount indicator"""
        original_price = float(obj.original_price or 0)
        current_price = float(obj.price or 0)
        if obj.has_discount:
            return format_html(
                '<span style="text-decoration:line-through;color:#9ca3af;">KSh {:.2f}</span><br>'
                '<span style="color:#22c55e;font-weight:bold;">KSh {:.2f}</span> '
                '<span style="background:#ef4444;color:white;padding:1px 4px;border-radius:2px;font-size:10px;">-{}%</span>',
                f"{original_price:.2f}", f"{current_price:.2f}", obj.discount
            )
        return format_html('<span>KSh {}</span>', f"{current_price:.2f}")
    price_ksh.short_description = 'Price (KSH)'
    
    def stock_status_badge(self, obj):
        status = obj.get_inventory_status()
        stock_quantity = status.get('stock_quantity', 0)
        stock_status = status.get('stock_status', 'out_of_stock')
        
        colors = {
            'in_stock': '#22c55e',
            'low_stock': '#f59e0b',
            'out_of_stock': '#ef4444',
        }
        color = colors.get(stock_status, '#6b7280')
        
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;">{} ({})</span>',
            color, stock_status.replace('_', ' ').title(), stock_quantity
        )
    stock_status_badge.short_description = 'Stock'
    
    actions = ['activate_products', 'deactivate_products', 'export_to_csv']
    
    @admin.action(description='Activate selected products')
    def activate_products(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f'{queryset.count()} products activated.')
    
    @admin.action(description='Deactivate selected products')
    def deactivate_products(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} products deactivated.')
    
    @admin.action(description='Export selected products to CSV')
    def export_to_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        from django.utils import timezone
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="products_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'SKU', 'Category', 'Brand', 'Price', 'Stock', 'Status', 'Created'])
        
        for product in queryset:
            status = product.get_inventory_status()
            writer.writerow([
                product.name,
                product.sku,
                product.category.name if product.category else '',
                product.brand.name if product.brand else '',
                float(product.price),
                status.get('stock_quantity', 0),
                'Active' if product.is_active else 'Inactive',
                product.created_at.strftime('%Y-%m-%d')
            ])
        
        return response


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'color', 'sku', 'additional_cost', 'is_active']
    list_filter = ['is_active', 'color', 'size']
    search_fields = ['product__name', 'sku']
    list_editable = ['is_active', 'additional_cost']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'image_preview', 'is_primary', 'created_at']
    list_filter = ['is_primary', ('created_at', admin.DateFieldListFilter)]
    search_fields = ['product__name', 'alt_text']
    list_editable = ['is_primary']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover;border-radius:4px;" />',
                obj.image.url
            )
        return 'No image'
    image_preview.short_description = 'Preview'
