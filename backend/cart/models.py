from django.db import models
from django.conf import settings
from products.models import Product

class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart', null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True, help_text="For guest users")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Shopping Cart"
        verbose_name_plural = "Shopping Carts"
    
    def __str__(self):
        if self.user:
            return f"{self.user.username}'s Cart"
        return f"Guest Cart ({self.session_key[:8]}...)"
    
    def get_total(self):
        return sum(item.total_price for item in self.items.all())
    
    def get_total_items(self):
        return sum(item.quantity for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['cart', 'product']
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
    @property
    def total_price(self):
        return self.quantity * self.product.selling_price
    
    def get_total_price(self):
        return self.total_price
