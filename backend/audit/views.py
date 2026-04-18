"""
Audit API Views - Section F
Admin API endpoint for querying audit logs.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import models
from datetime import timedelta

from utils.permissions import IsAdminUser
from utils.api_response import APIResponseMixin

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet, APIResponseMixin):
    """
    Admin-only API for querying audit logs.
    Read-only access to the complete audit trail.
    """
    queryset = AuditLog.objects.all().select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['action', 'resource_type', 'success', 'user_role']
    search_fields = ['user_email', 'resource_name', 'notes']
    ordering_fields = ['created_at', 'action', 'resource_type']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        Supports date range filtering.
        """
        queryset = super().get_queryset()
        
        # Date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # User filtering
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Resource filtering
        resource_id = self.request.query_params.get('resource_id')
        if resource_id:
            queryset = queryset.filter(resource_id=resource_id)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List audit logs with filtering."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                'logs': serializer.data,
                'summary': self._get_summary(queryset)
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return self.success_response(
            data={
                'logs': serializer.data,
                'summary': self._get_summary(queryset)
            },
            message="Audit logs retrieved successfully"
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Get single audit log entry with full details."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Add change summary
        data = serializer.data
        data['changes_summary'] = instance.get_changes_summary()
        
        return self.success_response(
            data=data,
            message="Audit log entry retrieved"
        )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get audit log statistics."""
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        
        queryset = self.get_queryset().filter(created_at__gte=since)
        
        # Action breakdown
        action_stats = queryset.values('action').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Resource type breakdown
        resource_stats = queryset.values('resource_type').annotate(
            count=models.Count('id')
        ).order_by('-count')[:10]
        
        # Success rate
        total = queryset.count()
        successful = queryset.filter(success=True).count()
        failed = queryset.filter(success=False).count()
        
        stats = {
            'period_days': days,
            'total_logs': total,
            'successful_actions': successful,
            'failed_actions': failed,
            'success_rate': round((successful / total * 100), 2) if total > 0 else 0,
            'action_breakdown': list(action_stats),
            'top_resources': list(resource_stats),
        }
        
        return self.success_response(
            data=stats,
            message="Audit statistics retrieved"
        )
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent activity for dashboard."""
        limit = int(request.query_params.get('limit', 20))
        
        logs = self.get_queryset()[:limit]
        serializer = self.get_serializer(logs, many=True)
        
        return self.success_response(
            data=serializer.data,
            message="Recent activity retrieved"
        )
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """Export audit logs to CSV/JSON (placeholder for future implementation)."""
        # This would generate a file export in production
        return self.success_response(
            data={'message': 'Export feature coming soon'},
            message="Export requested"
        )
    
    def _get_summary(self, queryset):
        """Generate summary statistics for the current queryset."""
        return {
            'total': queryset.count(),
            'successful': queryset.filter(success=True).count(),
            'failed': queryset.filter(success=False).count(),
            'unique_users': queryset.exclude(user=None).values('user').distinct().count(),
            'date_range': {
                'earliest': queryset.earliest('created_at').created_at if queryset.exists() else None,
                'latest': queryset.latest('created_at').created_at if queryset.exists() else None,
            }
        }
