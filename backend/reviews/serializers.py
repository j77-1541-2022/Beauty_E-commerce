from rest_framework import serializers
from .models import Review
from users.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'user_name', 'rating', 'title', 'comment', 
                  'is_approved', 'is_featured', 'helpful_count', 'created_at', 'updated_at']
        read_only_fields = ['is_approved', 'is_featured', 'helpful_count', 'created_at', 'updated_at']

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['product', 'rating', 'title', 'comment']

class ReviewAdminSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Review
        fields = '__all__'
