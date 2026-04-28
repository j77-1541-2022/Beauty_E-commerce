from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import F, Q, Sum
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from orders.models import Order, OrderItem
from notifications.models import DealerNotification
from products.models import Product
from users.models import DealerProfile

from .models import (
    DealerInventory,
    DealerReport,
    DealerSalesAnalytics,
    DealerStockMovement,
    DecisionSupportMetric,
)
from .permissions import IsDealer
from .serializers import (
    DealerInventorySerializer,
    DealerProductCreateUpdateSerializer,
    DealerProductDetailSerializer,
    DealerProductListSerializer,
    DealerProfileSerializer,
    DealerReportSerializer,
    DealerSalesAnalyticsSerializer,
    DecisionSupportMetricSerializer,
)

COMPLETED_ORDER_STATUSES = ['delivered']

class DealerViewSet(viewsets.ViewSet):
    """ViewSet for dealer operations"""
    permission_classes = [IsDealer]

    def partial_update(self, request, pk=None):
        """Support PATCH /api/v1/dealer/products/<id>/ for updating dealer products."""
        try:
            product = self._get_dealer_products(request).get(id=pk)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DealerProductCreateUpdateSerializer(
            product, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(DealerProductDetailSerializer(product, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _get_dealer_profile(self, request):
        """Get or create dealer profile for user."""
        profile, created = DealerProfile.objects.get_or_create(
            user=request.user,
            defaults={
                'business_name': request.user.username,
                'commission_rate': 10.00
            }
        )
        return profile

    def _get_dealer_products(self, request):
        """Get all products belonging to this dealer."""
        dealer_profile = self._get_dealer_profile(request)
        return Product.objects.filter(dealer=dealer_profile)

    def _calculate_pending_payout(self, dealer_profile):
        """Calculate dynamic pending payout from delivered orders minus paid-out earnings."""
        completed_orders = Order.objects.filter(
            items__product__dealer=dealer_profile,
            status__in=COMPLETED_ORDER_STATUSES,
        ).distinct()

        total_revenue = Decimal('0.00')
        for order in completed_orders:
            for item in order.items.filter(product__dealer=dealer_profile):
                total_revenue += item.quantity * item.unit_price

        commission_rate = dealer_profile.commission_rate / Decimal('100')
        total_earnings = total_revenue * (Decimal('1.00') - commission_rate)
        pending_payout = total_earnings - dealer_profile.total_earnings
        return max(Decimal('0.00'), pending_payout)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dealer dashboard with key statistics."""
        profile = self._get_dealer_profile(request)
        dealer_products = self._get_dealer_products(request)
        
        # Get orders containing dealer's products
        order_items = OrderItem.objects.filter(product__in=dealer_products)
        orders = Order.objects.filter(items__in=order_items).distinct()
        
        total_orders = orders.count()
        pending_orders = orders.filter(status__in=['pending', 'processing']).count()
        completed_orders = orders.filter(status__in=COMPLETED_ORDER_STATUSES).count()
        
        # Calculate revenue for this month (delivered orders only)
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_items = order_items.filter(
            order__created_at__gte=month_start,
            order__status__in=COMPLETED_ORDER_STATUSES
        )
        month_revenue_gross = sum(
            item.quantity * item.unit_price
            for item in month_items
        )
        month_revenue = sum(
            item.quantity * (item.unit_price * (1 - profile.commission_rate / 100))
            for item in month_items
        )
        
        # Calculate last month revenue for growth (delivered orders only)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        last_month_items = order_items.filter(
            order__created_at__gte=last_month_start,
            order__created_at__lt=month_start,
            order__status__in=COMPLETED_ORDER_STATUSES
        )
        last_month_revenue = sum(
            item.quantity * (item.unit_price * (1 - profile.commission_rate / 100))
            for item in last_month_items
        )
        
        sales_growth_percent = (
            ((month_revenue - last_month_revenue) / last_month_revenue * 100)
            if last_month_revenue > 0 else 0
        )
        
        # Top 5 products by delivered sales
        top_products = (
            order_items.filter(order__status__in=COMPLETED_ORDER_STATUSES)
            .values('product__id', 'product__name')
            .annotate(total_sold=Sum('quantity'))
            .order_by('-total_sold')[:5]
        )
        
        # Inventory alerts
        low_stock_products = DealerInventory.objects.filter(
            dealer=profile,
            stock_quantity__lte=F('reorder_level')
        )
        
        reorder_recommendations = []
        for inv in low_stock_products:
            suggested_order = max(0, inv.reorder_level * 2 - inv.stock_quantity)
            reorder_recommendations.append({
                'product_id': inv.product.id,
                'product_name': inv.product.name,
                'current_stock': inv.stock_quantity,
                'reorder_level': inv.reorder_level,
                'suggested_order': suggested_order
            })
        
        recent_orders = (
            orders.order_by('-created_at')[:5]
            .values('id', 'order_number', 'status', 'total_amount', 'created_at')
        )
        
        return Response({
            'stats': {
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'completed_orders': completed_orders,
                'total_sales_ksh': round(float(month_revenue_gross), 2),
                'total_revenue_ksh': round(float(month_revenue), 2),
                'pending_payout_ksh': float(self._calculate_pending_payout(profile)),
                'products_listed': dealer_products.filter(is_active=True).count(),
                'sales_growth_percent': round(float(sales_growth_percent), 1)
            },
            'recent_orders': [
                {
                    'id': o['id'],
                    'order_number': o['order_number'],
                    'status': o['status'],
                    'amount': float(o['total_amount']),
                    'date': o['created_at'].isoformat() if o['created_at'] else None
                } for o in recent_orders
            ],
            'top_products': [
                {
                    'product_id': p['product__id'],
                    'product_name': p['product__name'],
                    'total_sold': p['total_sold']
                } for p in top_products
            ],
            'low_stock_alerts': reorder_recommendations
        })

    @action(detail=False, methods=['get', 'patch'])
    def profile(self, request):
        """View or update dealer profile."""
        profile = self._get_dealer_profile(request)
        
        if request.method == 'PATCH':
            serializer = DealerProfileSerializer(
                profile, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = DealerProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def contact_support(self, request):
        """Submit dealer support request and notify support team."""
        profile = self._get_dealer_profile(request)

        subject = (request.data.get('subject') or '').strip()
        message = (request.data.get('message') or '').strip()
        category = (request.data.get('category') or 'general').strip().lower()
        priority = (request.data.get('priority') or 'normal').strip().lower()

        if len(subject) < 5:
            return Response(
                {'error': 'Subject must be at least 5 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(message) < 10:
            return Response(
                {'error': 'Message must be at least 10 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        ticket_id = f"SUP-{now.strftime('%Y%m%d%H%M%S')}-{profile.id}"

        support_email = getattr(settings, 'SUPPORT_EMAIL', '') or getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@glowbeyond.com')

        email_subject = f"[Dealer Support][{priority.upper()}][{category}] {subject} ({ticket_id})"
        email_body = (
            f"Ticket ID: {ticket_id}\n"
            f"Dealer: {profile.business_name}\n"
            f"Dealer ID: {profile.id}\n"
            f"User: {request.user.username} ({request.user.email})\n"
            f"Priority: {priority}\n"
            f"Category: {category}\n\n"
            f"Message:\n{message}\n"
        )

        email_sent = True
        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[support_email],
                fail_silently=False,
            )
        except Exception:
            email_sent = False

        DealerNotification.objects.create(
            dealer=profile,
            notification_type='system',
            title='Support request submitted',
            message=f'Ticket {ticket_id} was submitted to support ({category}, {priority}).',
            reference_id=ticket_id,
        )

        return Response(
            {
                'success': True,
                'ticket_id': ticket_id,
                'email_sent': email_sent,
                'support_email': support_email,
                'message': 'Support request submitted successfully.'
            },
            status=status.HTTP_201_CREATED if email_sent else status.HTTP_202_ACCEPTED
        )

    @action(detail=False, methods=['get', 'post'])
    def products(self, request):
        """List or create dealer products."""
        dealer_profile = self._get_dealer_profile(request)
        dealer_products = self._get_dealer_products(request)
        
        if request.method == 'POST':
            serializer = DealerProductCreateUpdateSerializer(
                data=request.data, context={'request': request}
            )
            if serializer.is_valid():
                product = serializer.save(dealer=dealer_profile)
                return Response(
                    DealerProductDetailSerializer(product, context={'request': request}).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # List products
        page = request.query_params.get('page', 1)
        paginator_size = 20
        
        queryset = dealer_products.order_by('-created_at')
        total = queryset.count()
        start = (int(page) - 1) * paginator_size
        products = queryset[start:start + paginator_size]
        
        serializer = DealerProductListSerializer(
            products, many=True, context={'request': request}
        )
        return Response({
            'count': total,
            'page': int(page),
            'page_size': paginator_size,
            'results': serializer.data
        })

    @action(detail=True, methods=['get', 'patch'], url_path=r'products')
    def product_detail(self, request, pk=None):
        """Get or update specific product."""
        try:
            product = self._get_dealer_products(request).get(id=pk)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'PATCH':
            serializer = DealerProductCreateUpdateSerializer(
                product, data=request.data, partial=True, context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(
                    DealerProductDetailSerializer(product, context={'request': request}).data
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = DealerProductDetailSerializer(product, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['delete'], url_path=r'products/(?P<product_id>\d+)')
    def delete_product(self, request, product_id=None):
        """Delete a product (soft delete)."""
        try:
            product = self._get_dealer_products(request).get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        product.is_active = False
        product.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get', 'post'])
    def inventory(self, request):
        """Manage dealer inventory."""
        dealer_profile = self._get_dealer_profile(request)
        
        if request.method == 'POST':
            product_id = request.data.get('product')
            try:
                product = self._get_dealer_products(request).get(id=product_id)
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            inv, created = DealerInventory.objects.update_or_create(
                dealer=dealer_profile,
                product=product,
                defaults={
                    'stock_quantity': request.data.get('stock_quantity', 0),
                    'reorder_level': request.data.get('reorder_level', 10),
                    'reorder_quantity': request.data.get('reorder_quantity', 50),
                }
            )
            
            return Response(
                DealerInventorySerializer(inv).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        
        # List inventory
        inventories = DealerInventory.objects.filter(dealer=dealer_profile)
        serializer = DealerInventorySerializer(inventories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], url_path=r'inventory/(?P<inventory_id>\d+)')
    def update_inventory(self, request, inventory_id=None):
        """Update inventory stock levels."""
        dealer_profile = self._get_dealer_profile(request)
        
        try:
            inv = DealerInventory.objects.get(id=inventory_id, dealer=dealer_profile)
        except DealerInventory.DoesNotExist:
            return Response(
                {'error': 'Inventory not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if 'stock_quantity' in request.data:
            inv.stock_quantity = request.data.get('stock_quantity')
        if 'reorder_level' in request.data:
            inv.reorder_level = request.data.get('reorder_level')
        if 'reorder_quantity' in request.data:
            inv.reorder_quantity = request.data.get('reorder_quantity')
        
        inv.save()
        
        return Response(DealerInventorySerializer(inv).data)

    @action(detail=False, methods=['get'])
    def inventory_movements(self, request):
        """Get inventory movement history."""
        dealer_profile = self._get_dealer_profile(request)
        product_id = request.query_params.get('product_id')
        
        movements = DealerStockMovement.objects.filter(
            dealer_inventory__dealer=dealer_profile
        )
        
        if product_id:
            movements = movements.filter(dealer_inventory__product_id=product_id)
        
        movements = movements.order_by('-created_at')[:100]
        
        data = []
        for mov in movements:
            data.append({
                'id': mov.id,
                'product_id': mov.dealer_inventory.product.id,
                'product_name': mov.dealer_inventory.product.name,
                'movement_type': mov.movement_type,
                'quantity': mov.quantity,
                'quantity_before': mov.quantity_before,
                'quantity_after': mov.quantity_after,
                'reason': mov.reason,
                'reference': mov.reference,
                'created_at': mov.created_at.isoformat()
            })
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def orders(self, request):
        """Get orders containing dealer's products."""
        status_filter = request.query_params.get('status', None)
        search = request.query_params.get('search', None)
        
        dealer_products = self._get_dealer_products(request)
        order_items = OrderItem.objects.filter(product__in=dealer_products)
        orders = Order.objects.filter(items__in=order_items).distinct()
        
        if status_filter:
            orders = orders.filter(status=status_filter)
        
        if search:
            orders = orders.filter(order_number__icontains=search)
        
        orders = orders.order_by('-created_at')
        
        data = []
        for order in orders:
            dealer_items = order.items.filter(product__in=dealer_products)
            total_for_dealer = sum(item.quantity * item.unit_price for item in dealer_items)
            customer_name = (
                order.created_by.first_name or order.created_by.username
                if order.created_by else order.customer_name
            )
            customer_email = order.created_by.email if order.created_by else order.customer_email
            
            data.append({
                'id': order.id,
                'order_number': order.order_number,
                'customer_name': customer_name,
                'customer_email': customer_email,
                'status': order.status,
                'total_amount': float(total_for_dealer),
                'created_at': order.created_at.isoformat(),
                'items': [
                    {
                        'product_id': item.product.id,
                        'product_name': item.product.name,
                        'quantity': item.quantity,
                        'price': float(item.unit_price)
                    } for item in dealer_items
                ]
            })
        
        return Response(data)

    @action(detail=True, methods=['patch'], url_path='order_status')
    def order_status(self, request, pk=None):
        """Update status for a single dealer-related order."""
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'status is required'}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid options: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        dealer_products = self._get_dealer_products(request)
        try:
            order = Order.objects.filter(items__product__in=dealer_products).distinct().get(id=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        old_status = order.status
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        from orders.models import OrderStatusHistory
        OrderStatusHistory.objects.create(
            order=order,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            notes=f'Status updated by dealer {request.user.username}'
        )

        return Response({
            'success': True,
            'order_id': order.id,
            'old_status': old_status,
            'new_status': new_status
        })

    @action(detail=False, methods=['patch'])
    def bulk_update_status(self, request):
        """Bulk update order statuses for dealer's orders."""
        order_ids = request.data.get('order_ids', [])
        new_status = request.data.get('status')
        
        if not order_ids or not new_status:
            return Response(
                {'error': 'order_ids and status are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new_status
        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid options: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dealer_products = self._get_dealer_products(request)
        dealer_order_ids = set(
            Order.objects.filter(items__product__in=dealer_products).distinct().values_list('id', flat=True)
        )
        
        # Only update orders that contain dealer's products
        order_ids_to_update = [oid for oid in order_ids if oid in dealer_order_ids]
        
        if not order_ids_to_update:
            return Response(
                {'error': 'No valid dealer orders found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        for order_id in order_ids_to_update:
            try:
                order = Order.objects.get(id=order_id)
                old_status = order.status
                order.status = new_status
                order.save()
                
                # Record status history
                from orders.models import OrderStatusHistory
                OrderStatusHistory.objects.create(
                    order=order,
                    old_status=old_status,
                    new_status=new_status,
                    changed_by=request.user,
                    notes=f'Bulk update by dealer {request.user.username}'
                )
                updated_count += 1
            except Order.DoesNotExist:
                continue
        
        return Response({
            'success': True,
            'message': f'Updated {updated_count} order(s)',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get sales analytics."""
        dealer_profile = self._get_dealer_profile(request)
        days = int(request.query_params.get('days', 30))
        
        start_date = (timezone.now() - timedelta(days=days)).date()
        
        analytics = DealerSalesAnalytics.objects.filter(
            dealer=dealer_profile,
            date__gte=start_date
        ).order_by('date')
        
        serializer = DealerSalesAnalyticsSerializer(analytics, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'post'])
    def reports(self, request):
        """Generate or list dealer reports."""
        dealer_profile = self._get_dealer_profile(request)
        
        if request.method == 'POST':
            report_type = request.data.get('report_type', 'monthly')
            report = DealerReport.generate_report(dealer_profile, report_type)
            serializer = DealerReportSerializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # List reports
        reports = DealerReport.objects.filter(dealer=dealer_profile).order_by('-period_end')
        serializer = DealerReportSerializer(reports, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def decision_metrics(self, request):
        """Get decision support metrics."""
        dealer_profile = self._get_dealer_profile(request)
        
        # Calculate all metrics
        DecisionSupportMetric.calculate_all_metrics(dealer_profile)
        
        metrics = DecisionSupportMetric.objects.filter(
            dealer=dealer_profile
        ).order_by('-metric_type', '-calculated_at')
        
        serializer = DecisionSupportMetricSerializer(metrics, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def product_analytics(self, request, pk=None):
        """Get analytics for a specific product."""
        dealer_profile = self._get_dealer_profile(request)
        
        try:
            product = self._get_dealer_products(request).get(id=pk)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get last 30 days
        period_start = (timezone.now() - timedelta(days=30))
        
        order_items = OrderItem.objects.filter(
            product=product,
            order__created_at__gte=period_start
        )
        
        total_sold = order_items.aggregate(Sum('quantity'))['quantity__sum'] or 0
        total_revenue = sum(item.quantity * item.unit_price for item in order_items)
        total_orders = Order.objects.filter(
            items__in=order_items
        ).distinct().count()
        
        try:
            inv = DealerInventory.objects.get(dealer=dealer_profile, product=product)
            inventory_data = DealerInventorySerializer(inv).data
        except DealerInventory.DoesNotExist:
            inventory_data = None
        
        return Response({
            'product_id': product.id,
            'product_name': product.name,
            'total_sold': total_sold,
            'total_revenue': float(total_revenue),
            'total_orders': total_orders,
            'average_price': float(total_revenue / total_sold) if total_sold > 0 else 0,
            'inventory': inventory_data
        })

    @action(detail=False, methods=['post'], url_path=r'inventory/(?P<inventory_id>\d+)/adjust')
    def adjust_stock(self, request, inventory_id=None):
        """Adjust inventory stock with reason."""
        dealer_profile = self._get_dealer_profile(request)
        
        try:
            inv = DealerInventory.objects.get(id=inventory_id, dealer=dealer_profile)
        except DealerInventory.DoesNotExist:
            return Response(
                {'error': 'Inventory not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        quantity_change = request.data.get('quantity_change', 0)
        reason = request.data.get('reason', '')
        
        inv.adjust_stock(quantity_change, reason)
        return Response(DealerInventorySerializer(inv).data)

    @action(detail=False, methods=['get'])
    def earnings(self, request):
        """Get dealer earnings and commission data."""
        dealer_profile = self._get_dealer_profile(request)
        
        # Get current month
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)
        
        # Get last month
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end_exclusive = current_month_start
        
        # Calculate current month earnings
        current_month_orders = Order.objects.filter(
            items__product__dealer=dealer_profile,
            created_at__gte=current_month_start,
            created_at__lt=next_month_start,
            status__in=COMPLETED_ORDER_STATUSES
        ).distinct()
        
        current_month_revenue = sum(
            sum(item.quantity * item.unit_price for item in order.items.filter(product__dealer=dealer_profile))
            for order in current_month_orders
        )
        
        current_month_commission = current_month_revenue * (dealer_profile.commission_rate / 100)
        current_month_earnings = current_month_revenue - current_month_commission
        
        # Calculate last month earnings
        last_month_orders = Order.objects.filter(
            items__product__dealer=dealer_profile,
            created_at__gte=last_month_start,
            created_at__lt=last_month_end_exclusive,
            status__in=COMPLETED_ORDER_STATUSES
        ).distinct()
        
        last_month_revenue = sum(
            sum(item.quantity * item.unit_price for item in order.items.filter(product__dealer=dealer_profile))
            for order in last_month_orders
        )
        
        last_month_commission = last_month_revenue * (dealer_profile.commission_rate / 100)
        last_month_earnings = last_month_revenue - last_month_commission
        
        # Calculate total lifetime earnings
        all_completed_orders = Order.objects.filter(
            items__product__dealer=dealer_profile,
            status__in=COMPLETED_ORDER_STATUSES
        ).distinct()
        
        total_revenue = sum(
            sum(item.quantity * item.unit_price for item in order.items.filter(product__dealer=dealer_profile))
            for order in all_completed_orders
        )
        
        total_commission = total_revenue * (dealer_profile.commission_rate / 100)
        total_earnings = total_revenue - total_commission
        
        # Get monthly breakdown for last 6 months
        monthly_breakdown = []

        def _month_start_for_offset(base_month_start, offset):
            year = base_month_start.year
            month = base_month_start.month - offset
            while month <= 0:
                month += 12
                year -= 1
            return base_month_start.replace(year=year, month=month, day=1)

        for i in range(5, -1, -1):
            month_start = _month_start_for_offset(current_month_start, i)
            month_end_exclusive = (month_start + timedelta(days=32)).replace(day=1)
            
            month_orders = Order.objects.filter(
                items__product__dealer=dealer_profile,
                created_at__gte=month_start,
                created_at__lt=month_end_exclusive,
                status__in=COMPLETED_ORDER_STATUSES
            ).distinct()
            
            month_rev = sum(
                sum(item.quantity * item.unit_price for item in order.items.filter(product__dealer=dealer_profile))
                for order in month_orders
            )
            
            month_comm = month_rev * (dealer_profile.commission_rate / 100)
            month_earn = month_rev - month_comm
            
            monthly_breakdown.append({
                'month': month_start.strftime('%b %Y'),
                'earnings_ksh': float(month_earn),
                'revenue_ksh': float(month_rev),
                'commission_ksh': float(month_comm)
            })

        pending_payout = self._calculate_pending_payout(dealer_profile)
        
        return Response({
            'commission_rate': float(dealer_profile.commission_rate),
            'this_month_ksh': float(current_month_earnings),
            'last_month_ksh': float(last_month_earnings),
            'total_lifetime_ksh': float(total_earnings),
            'pending_payout_ksh': float(pending_payout),
            'monthly_breakdown': monthly_breakdown,
            'total_orders': all_completed_orders.count(),
            'current_month_orders': current_month_orders.count()
        })

    @action(detail=False, methods=['get'])
    def payouts(self, request):
        """Get dealer payout history"""
        from .models import Payout
        dealer_profile = self._get_dealer_profile(request)
        payouts = Payout.objects.filter(dealer=dealer_profile).order_by('-created_at')
        
        data = []
        for payout in payouts:
            data.append({
                'id': payout.id,
                'amount': float(payout.amount),
                'status': payout.status,
                'mpesa_receipt_number': payout.mpesa_receipt_number,
                'period_start': payout.period_start.strftime('%b %d, %Y'),
                'period_end': payout.period_end.strftime('%b %d, %Y'),
                'created_at': payout.created_at.strftime('%b %d, %Y'),
                'completed_at': payout.completed_at.strftime('%b %d, %Y') if payout.completed_at else None,
                'failure_reason': payout.failure_reason,
            })
        
        return Response({'payouts': data})
    
    @action(detail=False, methods=['post'])
    def request_payout(self, request):
        """Request a payout for pending earnings"""
        from .models import Payout
        from django.db import transaction
        
        dealer_profile = self._get_dealer_profile(request)
        pending_available = self._calculate_pending_payout(dealer_profile)
        minimum_payout = Decimal('100.00')

        requested_amount_raw = request.data.get('amount')
        if requested_amount_raw in [None, '']:
            payout_amount = pending_available
        else:
            try:
                payout_amount = Decimal(str(requested_amount_raw).replace(',', '').strip())
            except Exception:
                return Response({
                    'success': False,
                    'error': 'Invalid payout amount.'
                }, status=400)
        
        # Check if there's a pending payout amount
        if pending_available <= 0:
            return Response({
                'success': False,
                'error': 'No pending payout available from delivered sales yet.'
            }, status=400)

        if payout_amount <= 0:
            return Response({
                'success': False,
                'error': 'Payout amount must be greater than zero.'
            }, status=400)

        if payout_amount > pending_available:
            return Response({
                'success': False,
                'error': f'Requested amount exceeds available payout. Available: KSh {pending_available:,.2f}.'
            }, status=400)

        if payout_amount < minimum_payout:
            return Response({
                'success': False,
                'error': f'Minimum payout is KSh 100. Requested: KSh {payout_amount:,.2f}.'
            }, status=400)
        
        # Check for existing pending/processing payouts
        existing_payout = Payout.objects.filter(
            dealer=dealer_profile,
            status__in=['pending', 'processing']
        ).first()
        
        if existing_payout:
            return Response({
                'success': False,
                'error': f'Payout already in progress (Status: {existing_payout.status})'
            }, status=400)
        
        # Calculate period (last 30 days)
        period_end = timezone.now().date()
        period_start = period_end - timedelta(days=30)
        
        with transaction.atomic():
            # Create payout record
            payout = Payout.objects.create(
                dealer=dealer_profile,
                amount=payout_amount,
                status='pending',
                period_start=period_start,
                period_end=period_end
            )
            
            # In a real implementation, this would trigger M-Pesa B2C
            # For now, simulate successful payout
            payout.status = 'completed'
            payout.mpesa_receipt_number = f'SFT{timezone.now().strftime("%y%m%d")}{payout.id:04d}'
            payout.completed_at = timezone.now()
            payout.save()
            
            # Update dealer totals
            dealer_profile.total_earnings += payout.amount
            remaining_pending = max(Decimal('0.00'), pending_available - payout.amount)
            dealer_profile.pending_payout = remaining_pending
            dealer_profile.save(update_fields=['total_earnings', 'pending_payout'])
        
        return Response({
            'success': True,
            'message': f'Payout of KSh {payout.amount:,.2f} completed successfully',
            'payout': {
                'id': payout.id,
                'amount': float(payout.amount),
                'status': payout.status,
                'mpesa_receipt_number': payout.mpesa_receipt_number,
                'completed_at': payout.completed_at.strftime('%b %d, %Y %H:%M')
            },
            'remaining_pending_ksh': float(remaining_pending)
        })

    @action(detail=False, methods=['get'])
    def reports_inventory(self, request):
        """Get inventory status report for CSV export"""
        dealer_profile = self._get_dealer_profile(request)
        inventories = DealerInventory.objects.filter(dealer=dealer_profile).select_related('product')

        data = []
        for inv in inventories:
            data.append({
                'product_name': inv.product.name,
                'category': inv.product.category.name if inv.product.category else 'Uncategorized',
                'current_stock': inv.stock_quantity,
                'reorder_level': inv.reorder_level,
                'status': 'Low' if inv.is_low_stock else 'OK',
                'unit_price': float(inv.product.cost_price or 0),
                'value_kes': float(inv.stock_quantity * (inv.product.cost_price or 0)),
                'sku': inv.product.sku or 'N/A'
            })

        return Response({'inventory_data': data, 'total_value': sum(item['value_kes'] for item in data)})

    @action(detail=False, methods=['get'])
    def reports_low_stock(self, request):
        """Get low stock report for PDF export"""
        dealer_profile = self._get_dealer_profile(request)
        low_stock_items = DealerInventory.objects.filter(
            dealer=dealer_profile,
            stock_quantity__lte=F('reorder_level')
        ).select_related('product')

        data = []
        for inv in low_stock_items:
            suggested_reorder = max(0, inv.reorder_level * 2 - inv.stock_quantity)
            data.append({
                'product_name': inv.product.name,
                'category': inv.product.category.name if inv.product.category else 'Uncategorized',
                'current_stock': inv.stock_quantity,
                'reorder_level': inv.reorder_level,
                'suggested_reorder': suggested_reorder,
                'sku': inv.product.sku or 'N/A',
                'supplier_contact': inv.product.supplier.email if hasattr(inv.product, 'supplier') and inv.product.supplier else 'N/A'
            })

        return Response({'low_stock_data': data, 'total_low_stock_items': len(data)})

    @action(detail=False, methods=['get'])
    def reports_stock_movement(self, request):
        """Get stock movement report with date range"""
        dealer_profile = self._get_dealer_profile(request)

        # Get query parameters
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')
        product_id = request.query_params.get('product_id')

        movements = DealerStockMovement.objects.filter(
            dealer_inventory__dealer=dealer_profile
        ).select_related('dealer_inventory__product')

        if product_id:
            movements = movements.filter(dealer_inventory__product_id=product_id)

        if start_date and end_date:
            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            movements = movements.filter(created_at__date__range=[start, end])

        # Aggregate by date
        from django.db.models import Sum
        from django.db.models.functions import TruncDate

        daily_data = movements.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total_in=Sum('quantity', filter=Q(movement_type='in')),
            total_out=Sum('quantity', filter=Q(movement_type='out')),
            total_adjustment=Sum('quantity', filter=Q(movement_type='adjustment')),
            total_sale=Sum('quantity', filter=Q(movement_type='sale'))
        ).order_by('date')

        # Get transaction details
        transactions = movements[:100].values(
            'id', 'movement_type', 'quantity', 'quantity_before', 'quantity_after',
            'reason', 'reference', 'created_at', 'dealer_inventory__product__name'
        )

        return Response({
            'daily_summary': list(daily_data),
            'transactions': list(transactions),
            'products': list(self._get_dealer_products(request).values('id', 'name'))
        })

    @action(detail=False, methods=['get'])
    def reports_valuation(self, request):
        """Get inventory valuation report with category breakdown"""
        dealer_profile = self._get_dealer_profile(request)
        inventories = DealerInventory.objects.filter(dealer=dealer_profile).select_related('product', 'product__category')

        # Total valuation
        total_value = Decimal('0.00')

        # Category breakdown
        from collections import defaultdict
        category_data = defaultdict(lambda: {'total_value': Decimal('0.00'), 'item_count': 0})

        for inv in inventories:
            cat_name = inv.product.category.name if inv.product.category else 'Uncategorized'
            unit_value = inv.product.cost_price or inv.product.selling_price or Decimal('0.00')
            value = unit_value * inv.stock_quantity
            total_value += value
            category_data[cat_name]['total_value'] += value
            category_data[cat_name]['item_count'] += 1

        # Convert to list with percentages
        category_breakdown = []
        for cat_name, data in category_data.items():
            percentage = ((data['total_value'] / total_value) * Decimal('100.00')) if total_value > 0 else Decimal('0.00')
            category_breakdown.append({
                'category': cat_name,
                'total_value_kes': float(data['total_value']),
                'item_count': data['item_count'],
                'percentage': float(round(percentage, 2))
            })

        category_breakdown.sort(key=lambda x: x['total_value_kes'], reverse=True)

        return Response({
            'total_value_kes': float(total_value),
            'total_products': inventories.count(),
            'category_breakdown': category_breakdown
        })

    @action(detail=False, methods=['get'])
    def analytics_forecast(self, request):
        """Get demand forecast using simple exponential smoothing"""
        from datetime import datetime, timedelta

        dealer_profile = self._get_dealer_profile(request)
        product_id = request.query_params.get('product_id')
        dealer_products = self._get_dealer_products(request)

        products = []
        if product_id:
            try:
                products = [dealer_products.get(id=product_id)]
            except Product.DoesNotExist:
                return Response({'error': 'Product not found'}, status=404)
        else:
            products = list(dealer_products.order_by('name'))

        if not products:
            return Response({'future_forecast': [], 'historical_data': [], 'alpha': 0.3})

        # Get last 90 days of sales data
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=90)
        alpha = 0.3

        def build_forecast_rows(product):
            daily_sales = []
            current_date = start_date

            while current_date <= end_date:
                sales = OrderItem.objects.filter(
                    product=product,
                    order__created_at__date=current_date,
                    order__status__in=COMPLETED_ORDER_STATUSES
                ).aggregate(total=Sum('quantity'))['total'] or 0

                daily_sales.append({'date': current_date.isoformat(), 'sales': int(sales)})
                current_date += timedelta(days=1)

            smoothed = daily_sales[0]['sales'] if daily_sales else 0
            for i, day in enumerate(daily_sales):
                if i > 0:
                    smoothed = alpha * day['sales'] + (1 - alpha) * smoothed

            last_date = datetime.strptime(daily_sales[-1]['date'], '%Y-%m-%d').date() if daily_sales else end_date
            current_forecast = smoothed
            rows = []

            for i in range(1, 31):
                future_date = last_date + timedelta(days=i)
                current_forecast = alpha * smoothed + (1 - alpha) * current_forecast
                rows.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'date': future_date.isoformat(),
                    'forecast': round(current_forecast, 2),
                    'lower': round(current_forecast * 0.8, 2),
                    'upper': round(current_forecast * 1.2, 2)
                })

            return daily_sales, rows

        if product_id:
            product = products[0]
            forecast_history, future_forecast = build_forecast_rows(product)
            return Response({
                'product_id': product.id,
                'product_name': product.name,
                'historical_data': [
                    {
                        'date': row['date'],
                        'actual': row['sales'],
                        'forecast': row['sales'],
                        'lower': round(row['sales'] * 0.8, 2),
                        'upper': round(row['sales'] * 1.2, 2)
                    }
                    for row in forecast_history
                ],
                'future_forecast': future_forecast,
                'alpha': alpha
            })

        future_forecast = []
        for product in products:
            _, rows = build_forecast_rows(product)
            future_forecast.extend(rows)

        return Response({
            'rows': future_forecast,
            'future_forecast': future_forecast,
            'alpha': alpha
        })

    @action(detail=False, methods=['get'])
    def analytics_abc(self, request):
        """Get ABC Analysis - Pareto classification of products"""
        dealer_profile = self._get_dealer_profile(request)
        dealer_products = self._get_dealer_products(request)

        # Get sales value per product (last 90 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=90)

        product_sales = OrderItem.objects.filter(
            product__in=dealer_products,
            order__created_at__range=[start_date, end_date],
            order__status__in=COMPLETED_ORDER_STATUSES
        ).values('product__id', 'product__name').annotate(
            total_value=Sum(F('quantity') * F('unit_price')),
            total_quantity=Sum('quantity')
        ).order_by('-total_value')

        if not product_sales:
            return Response({'abc_data': [], 'summary': {'a_count': 0, 'b_count': 0, 'c_count': 0}})

        # Calculate cumulative percentage
        total_value = sum(item['total_value'] or 0 for item in product_sales)
        cumulative = 0

        abc_data = []
        for item in product_sales:
            value = item['total_value'] or 0
            cumulative += value
            cumulative_pct = (cumulative / total_value * 100) if total_value > 0 else 0

            if cumulative_pct <= 80:
                classification = 'A'
            elif cumulative_pct <= 95:
                classification = 'B'
            else:
                classification = 'C'

            abc_data.append({
                'product_id': item['product__id'],
                'product_name': item['product__name'],
                'sales_value': float(value),
                'sales_quantity': item['total_quantity'] or 0,
                'cumulative_percentage': round(cumulative_pct, 2),
                'classification': classification,
                'percentage_of_total': round((value / total_value * 100), 2) if total_value > 0 else 0
            })

        summary = {
            'a_count': len([x for x in abc_data if x['classification'] == 'A']),
            'b_count': len([x for x in abc_data if x['classification'] == 'B']),
            'c_count': len([x for x in abc_data if x['classification'] == 'C']),
            'a_value': sum(x['sales_value'] for x in abc_data if x['classification'] == 'A'),
            'b_value': sum(x['sales_value'] for x in abc_data if x['classification'] == 'B'),
            'c_value': sum(x['sales_value'] for x in abc_data if x['classification'] == 'C'),
            'total_value': float(total_value)
        }

        return Response({'abc_data': abc_data, 'summary': summary})

    @action(detail=False, methods=['get'])
    def analytics_eoq(self, request):
        """Calculate EOQ (Economic Order Quantity) for a product"""
        import math

        dealer_profile = self._get_dealer_profile(request)
        product_id = request.query_params.get('product_id')
        dealer_products = self._get_dealer_products(request)

        if product_id:
            try:
                products = [dealer_products.get(id=product_id)]
            except Product.DoesNotExist:
                return Response({'error': 'Product not found'}, status=404)
        else:
            products = list(dealer_products.order_by('name'))

        if not products:
            return Response({'eoq_data': []})

        # Calculate annual demand (based on last 90 days * 4)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=90)
        ordering_cost = float(request.query_params.get('ordering_cost', 500))
        holding_cost_percent = float(request.query_params.get('holding_cost_percent', 20))
        lead_time_days = int(request.query_params.get('lead_time', 7))
        safety_stock_days = int(request.query_params.get('safety_days', 3))

        def build_eoq_row(product):
            inventory = DealerInventory.objects.filter(dealer=dealer_profile, product=product).first()
            quarterly_demand = OrderItem.objects.filter(
                product=product,
                order__created_at__range=[start_date, end_date],
                order__status__in=COMPLETED_ORDER_STATUSES
            ).aggregate(total=Sum('quantity'))['total'] or 0

            annual_demand = quarterly_demand * 4
            unit_cost = float(product.cost_price or product.selling_price or 0)
            holding_cost_per_unit = unit_cost * (holding_cost_percent / 100)
            eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit) if annual_demand > 0 and holding_cost_per_unit > 0 else 0
            daily_demand = annual_demand / 365 if annual_demand > 0 else 0
            reorder_point = (daily_demand * lead_time_days) + (daily_demand * safety_stock_days)
            safety_stock = daily_demand * safety_stock_days
            annual_ordering_cost = (annual_demand / eoq) * ordering_cost if eoq > 0 else 0
            annual_holding_cost = (eoq / 2) * holding_cost_per_unit if eoq > 0 else 0

            return {
                'product_id': product.id,
                'product_name': product.name,
                'current_stock': inventory.stock_quantity if inventory else 0,
                'reorder_level': inventory.reorder_level if inventory else 0,
                'annual_demand': annual_demand,
                'daily_demand': round(daily_demand, 2),
                'eoq': round(eoq, 0),
                'reorder_point': round(reorder_point, 0),
                'safety_stock': round(safety_stock, 0),
                'lead_time_days': lead_time_days,
                'costs': {
                    'unit_cost': unit_cost,
                    'ordering_cost': ordering_cost,
                    'holding_cost_percent': holding_cost_percent,
                    'holding_cost_per_unit': round(holding_cost_per_unit, 2),
                    'annual_ordering_cost': round(annual_ordering_cost, 2),
                    'annual_holding_cost': round(annual_holding_cost, 2),
                    'total_annual_cost': round(annual_ordering_cost + annual_holding_cost, 2)
                }
            }

        if product_id:
            product = products[0]
            return Response(build_eoq_row(product))

        eoq_data = [build_eoq_row(product) for product in products]
        return Response({'eoq_data': eoq_data})

    @action(detail=False, methods=['get'])
    def analytics_reorder_recommendations(self, request):
        """Get reorder recommendations with urgency levels"""
        dealer_profile = self._get_dealer_profile(request)

        # Get all low stock items
        low_stock_items = DealerInventory.objects.filter(
            dealer=dealer_profile
        ).select_related('product')

        recommendations = []

        for inv in low_stock_items:
            # Calculate urgency based on stock vs reorder level
            stock_ratio = inv.stock_quantity / inv.reorder_level if inv.reorder_level > 0 else 0

            if inv.stock_quantity <= 0:
                urgency = 'Critical'
                urgency_color = 'red'
            elif stock_ratio <= 0.5:
                urgency = 'High'
                urgency_color = 'orange'
            elif stock_ratio <= 1.0:
                urgency = 'Medium'
                urgency_color = 'yellow'
            else:
                continue  # Skip if stock is above reorder level

            suggested_order = max(0, inv.reorder_level * 2 - inv.stock_quantity)

            recommendations.append({
                'product_id': inv.product.id,
                'product_name': inv.product.name,
                'current_stock': inv.stock_quantity,
                'reorder_level': inv.reorder_level,
                'suggested_order_quantity': suggested_order,
                'urgency': urgency,
                'urgency_color': urgency_color,
                'unit_price': float(inv.product.selling_price or 0),
                'estimated_order_value': float(suggested_order * (inv.product.selling_price or 0)),
                'supplier_email': inv.product.supplier.email if hasattr(inv.product, 'supplier') and inv.product.supplier else None
            })

        # Sort by urgency and then by value
        urgency_order = {'Critical': 0, 'High': 1, 'Medium': 2}
        recommendations.sort(key=lambda x: (urgency_order.get(x['urgency'], 3), -x['estimated_order_value']))

        return Response({
            'recommendations': recommendations,
            'total_suggested_value': sum(r['estimated_order_value'] for r in recommendations),
            'critical_count': len([r for r in recommendations if r['urgency'] == 'Critical']),
            'high_count': len([r for r in recommendations if r['urgency'] == 'High']),
            'medium_count': len([r for r in recommendations if r['urgency'] == 'Medium'])
        })

    @action(detail=False, methods=['get'])
    def dashboard_charts(self, request):
        """Get data for dealer dashboard charts"""
        dealer_profile = self._get_dealer_profile(request)
        dealer_products = self._get_dealer_products(request)

        # 1. Stock by Category (for Pie Chart)
        from collections import defaultdict
        category_data = defaultdict(lambda: {'stock_value': 0, 'product_count': 0})

        inventories = DealerInventory.objects.filter(dealer=dealer_profile).select_related('product', 'product__category')
        for inv in inventories:
            cat_name = inv.product.category.name if inv.product.category else 'Uncategorized'
            value = float(inv.stock_quantity * (inv.product.selling_price or 0))
            category_data[cat_name]['stock_value'] += value
            category_data[cat_name]['product_count'] += 1

        stock_by_category = [
            {'category': cat, 'stock_value': data['stock_value'], 'product_count': data['product_count']}
            for cat, data in category_data.items()
        ]
        stock_by_category.sort(key=lambda x: x['stock_value'], reverse=True)

        # 2. Stock Movement Trend (last 6 months)
        from django.db.models.functions import TruncMonth
        from datetime import timedelta

        end_date = timezone.now()
        start_date = end_date - timedelta(days=180)

        movements = DealerStockMovement.objects.filter(
            dealer_inventory__dealer=dealer_profile,
            created_at__gte=start_date
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total_quantity=Sum('quantity')
        ).order_by('month')

        stock_movement = [
            {'month': m['month'].strftime('%b %Y') if m['month'] else '', 'total_quantity': m['total_quantity'] or 0}
            for m in movements
        ]

        # 3. Income vs Expenditure (last 6 months)
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        income_vs_expenditure = []

        for i in range(5, -1, -1):
            month_start = (current_month_start - timedelta(days=i * 30)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1)

            month_items = OrderItem.objects.filter(
                product__in=dealer_products,
                order__created_at__gte=month_start,
                order__created_at__lt=month_end,
                order__status__in=COMPLETED_ORDER_STATUSES
            ).select_related('product')

            month_income = sum(float(item.quantity * item.unit_price) for item in month_items)
            month_expenditure = sum(float(item.quantity * (item.product.cost_price or 0)) for item in month_items)

            income_vs_expenditure.append({
                'month': month_start.strftime('%b %Y'),
                'income': round(month_income, 2),
                'expenditure': round(month_expenditure, 2)
            })

        # 4. Top Products by Sales (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)

        top_products = OrderItem.objects.filter(
            product__in=dealer_products,
            order__created_at__gte=thirty_days_ago,
            order__status__in=COMPLETED_ORDER_STATUSES
        ).values('product__id', 'product__name').annotate(
            total_sold=Sum('quantity')
        ).order_by('-total_sold')[:5]

        top_products_chart = [
            {'product_name': p['product__name'][:20] + '...' if len(p['product__name']) > 20 else p['product__name'],
             'total_sold': p['total_sold']}
            for p in top_products
        ]

        return Response({
            'stock_by_category': stock_by_category,
            'stock_movement': stock_movement,
            'income_vs_expenditure': income_vs_expenditure,
            'top_products_chart': top_products_chart
        })

    @action(detail=False, methods=['post'], url_path='what-if')
    def what_if_analysis(self, request):
        """
        POST /api/dealer/what-if/ - What-If Analysis (DSS for dealers)
        
        Inputs:
        - product_id: Product to analyze
        - demand_multiplier: Factor to multiply current demand (default 1.0)
        - lead_time_multiplier: Factor to adjust lead time (default 1.0)
        - holding_cost_percent: Annual holding cost as % of product cost (default 20)
        - ordering_cost: Cost per order (default 500)
        - service_level: Desired service level 0-1 (default 0.95 for 95%)
        
        Computes:
        - EOQ (Economic Order Quantity)
        - Reorder Point
        - Safety Stock
        - Total Cost
        """
        import math
        
        dealer_profile = self._get_dealer_profile(request)
        dealer_products = self._get_dealer_products(request)
        
        # Get inputs
        product_id = request.data.get('product_id')
        demand_multiplier = float(request.data.get('demand_multiplier', 1.0))
        lead_time_multiplier = float(request.data.get('lead_time_multiplier', 1.0))
        holding_cost_percent = float(request.data.get('holding_cost_percent', 20.0))
        ordering_cost = float(request.data.get('ordering_cost', 500.0))
        service_level = float(request.data.get('service_level', 0.95))
        
        # Get product
        try:
            product = dealer_products.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)
        
        # Get inventory record
        try:
            inventory = DealerInventory.objects.get(dealer=dealer_profile, product=product)
        except DealerInventory.DoesNotExist:
            return Response({'error': 'Product not in dealer inventory'}, status=404)
        
        # Calculate historical demand (last 90 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=90)
        quarterly_demand = OrderItem.objects.filter(
            product=product,
            order__created_at__range=[start_date, end_date],
            order__status__in=COMPLETED_ORDER_STATUSES
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        # Annual demand with multiplier
        annual_demand = (quarterly_demand * 4) * demand_multiplier
        
        # Holding cost per unit per year
        holding_cost_per_unit = (product.cost_price or 0) * (holding_cost_percent / 100.0)
        
        # Calculate EOQ using formula: EOQ = sqrt(2DS/H)
        if holding_cost_per_unit > 0:
            eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit)
        else:
            eoq = 0
        
        # Lead time in days (default 7, multiplied by factor)
        lead_time_days = max(1, int(7 * lead_time_multiplier))
        
        # Average daily demand
        daily_demand = annual_demand / 365.0
        
        # Reorder point = (daily_demand * lead_time_days) + safety_stock
        # For 95% service level, safety factor ≈ 1.65 (from normal distribution)
        # Standard deviation ≈ sqrt(lead_time_days) * daily_demand
        service_factor_map = {
            0.90: 1.28,
            0.95: 1.65,
            0.99: 2.33,
        }
        service_factor = service_factor_map.get(round(service_level * 20) / 20, 1.65)
        
        std_dev = math.sqrt(lead_time_days) * daily_demand
        safety_stock = service_factor * std_dev
        reorder_point = (daily_demand * lead_time_days) + safety_stock
        
        # Total annual cost
        holding_cost_annual = (eoq / 2) * holding_cost_per_unit  # Average inventory * cost
        ordering_cost_annual = (annual_demand / eoq) * ordering_cost if eoq > 0 else 0
        total_cost = holding_cost_annual + ordering_cost_annual
        
        return Response({
            'product_id': product.id,
            'product_name': product.name,
            'scenario': {
                'demand_multiplier': demand_multiplier,
                'lead_time_multiplier': lead_time_multiplier,
                'holding_cost_percent': holding_cost_percent,
                'ordering_cost': ordering_cost,
                'service_level': service_level,
            },
            'metrics': {
                'historical_quarterly_demand': quarterly_demand,
                'annual_demand': round(annual_demand, 2),
                'daily_demand': round(daily_demand, 2),
                'eoq': round(eoq, 2),
                'reorder_point': round(reorder_point, 2),
                'safety_stock': round(safety_stock, 2),
                'lead_time_days': lead_time_days,
                'service_factor': service_factor,
                'holding_cost_per_unit_annual': round(holding_cost_per_unit, 2),
            },
            'costs': {
                'annual_holding_cost': round(holding_cost_annual, 2),
                'annual_ordering_cost': round(ordering_cost_annual, 2),
                'total_annual_cost': round(total_cost, 2),
                'cost_per_unit': round(total_cost / annual_demand, 4) if annual_demand > 0 else 0,
            },
            'recommendations': {
                'order_quantity': round(eoq, 0),
                'reorder_when_stock_reaches': round(reorder_point, 0),
                'minimum_safety_stock': round(safety_stock, 0),
                'current_stock': inventory.stock_quantity,
                'is_below_reorder_point': inventory.stock_quantity < reorder_point,
            }
        })
