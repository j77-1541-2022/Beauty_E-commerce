from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from products.models import Product
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer, ReviewAdminSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating', 'helpful_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        if self.request.user.is_staff:
            return ReviewAdminSerializer
        return ReviewSerializer

    def get_queryset(self):
        queryset = Review.objects.all()
        
        # Filter by product
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Non-staff users only see approved reviews
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_approved=True)
        
        return queryset.select_related('user', 'product')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def helpful(self, request, pk=None):
        """Mark a review as helpful"""
        review = self.get_object()
        review.helpful_count += 1
        review.save()
        return Response({'helpful_count': review.helpful_count})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Admin: Approve a review"""
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        review = self.get_object()
        review.is_approved = True
        review.save()
        return Response({'status': 'review approved'})

    @action(detail=False, methods=['get'])
    def product_reviews(self, request):
        """Get all approved reviews for a specific product"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        reviews = Review.objects.filter(product_id=product_id, is_approved=True)
        serializer = ReviewSerializer(reviews, many=True)
        
        # Calculate average rating
        avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0
        total_reviews = reviews.count()
        
        return Response({
            'reviews': serializer.data,
            'average_rating': round(avg_rating, 1),
            'total_reviews': total_reviews
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_reviews(self, request):
        """Get current user's reviews"""
        reviews = Review.objects.filter(user=request.user)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
