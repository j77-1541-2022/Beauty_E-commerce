from django.db import models
from django.conf import settings
from products.models import Product

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)], default=5)
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    is_approved = models.BooleanField(default=False, help_text="Admin approval required")
    is_featured = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['product', 'user']  # One review per user per product
        verbose_name = "Product Review"
        verbose_name_plural = "Product Reviews"

    def __str__(self):
        return f"{self.user.username}'s review for {self.product.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update product rating
        self.product.update_rating()
