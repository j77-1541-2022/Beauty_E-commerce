"""
Comprehensive authentication views with hardened security.
Section A - Registration, Login, Token Refresh, Logout.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from django.core.exceptions import MultipleObjectsReturned

from .models import UserProfile, CustomerProfile, DealerProfile
from .serializers import (
    UserSerializer, UserRegistrationSerializer, LoginSerializer,
    TokenResponseSerializer, PasswordChangeSerializer, LogoutSerializer,
    UserProfileSerializer
)

User = get_user_model()

from cart.services import merge_guest_cart_to_user


class AuthViewSet(viewsets.GenericViewSet):
    """
    ViewSet for authentication operations.
    Handles: register, login, token refresh, logout, password change.
    """
    queryset = User.objects.all()
    
    def get_permissions(self):
        if self.action in ['register', 'login']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'register':
            return UserRegistrationSerializer
        elif self.action == 'login':
            return LoginSerializer
        elif self.action == 'logout':
            return LogoutSerializer
        elif self.action == 'change_password':
            return PasswordChangeSerializer
        return UserSerializer
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        POST /api/auth/register/
        Hardened registration with password validation, email uniqueness check.
        Section A3 - Registration endpoint hardening.
        """
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            # Return consistent error format
            errors = serializer.errors
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Please correct the errors below.',
                    'fields': errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Create user (profile created by signal)
                user = serializer.save()
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                
                # Send welcome email asynchronously (Celery)
                # Note: Celery task would be called here in production
                # send_welcome_email.delay(user.email, user.first_name)
                
                return Response({
                    'success': True,
                    'data': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': UserSerializer(user).data
                    },
                    'message': 'Account created successfully! Welcome to Glow Beyond Beauty.'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'SERVER_ERROR',
                    'message': 'An error occurred while creating your account. Please try again.'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """
        POST /api/auth/token/
        Login with email and password.
        Section A4 - Login endpoint enhancements with account lockout.
        """
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Please provide valid credentials.',
                    'fields': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data.get('email', '').lower().strip()
        username = serializer.validated_data.get('username', '').strip()
        password = serializer.validated_data.get('password', '')
        
        # Determine identifier - use whichever was provided
        identifier = (email or username)
        
        # Find user by email first, then by username
        user = None
        try:
            # Try email lookup (case-insensitive)
            if '@' in identifier:
                user = User.objects.get(email__iexact=identifier)
            else:
                # Try username lookup
                user = User.objects.get(username__iexact=identifier)
        except User.DoesNotExist:
            # Try email as fallback (in case they typed email without @)
            try:
                user = User.objects.get(email__iexact=identifier)
            except User.DoesNotExist:
                pass
        except MultipleObjectsReturned:
            # Multiple users with same email - data integrity issue
            return Response({
                'success': False,
                'error': {
                    'code': 'ACCOUNT_ERROR',
                    'message': 'Multiple accounts found with this email. Please contact support.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user:
            # Security: Don't reveal whether email/username exists or not
            return Response({
                'success': False,
                'error': {
                    'code': 'AUTHENTICATION_REQUIRED',
                    'message': 'Invalid credentials.'
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if account is locked
        if user.is_account_locked():
            retry_after = user.locked_until.isoformat() if user.locked_until else None
            return Response({
                'success': False,
                'error': {
                    'code': 'ACCOUNT_LOCKED',
                    'message': 'Account temporarily locked due to multiple failed login attempts.',
                    'retry_after': retry_after
                }
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check password
        if not user.check_password(password):
            # Record failed login attempt
            user.record_failed_login()
            
            return Response({
                'success': False,
                'error': {
                    'code': 'AUTHENTICATION_REQUIRED',
                    'message': 'Invalid credentials.'
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is active
        if not user.is_active:
            return Response({
                'success': False,
                'error': {
                    'code': 'AUTHENTICATION_REQUIRED',
                    'message': 'This account has been deactivated.'
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Success - reset failed attempts
        user.reset_failed_logins()
        user.update_last_active()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)

        merge_result = merge_guest_cart_to_user(request, user)
        
        return Response({
            'success': True,
            'data': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'guest_cart_merge': merge_result,
            },
            'message': f'Welcome back, {user.first_name}!'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """
        POST /api/auth/logout/
        Blacklist the refresh token and log user out.
        Section A6 - Logout endpoint.
        """
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Refresh token is required.',
                    'fields': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refresh_token = serializer.validated_data.get('refresh_token')
        
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Log to AuditLog would go here (Section F)
            
            return Response({
                'success': True,
                'data': {},
                'message': 'Logged out successfully.'
            }, status=status.HTTP_200_OK)
            
        except TokenError:
            return Response({
                'success': False,
                'error': {
                    'code': 'TOKEN_EXPIRED',
                    'message': 'Session has already expired.'
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'SERVER_ERROR',
                    'message': 'An error occurred during logout.'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def token_refresh(self, request):
        """
        POST /api/auth/token/refresh/
        Refresh access token and return updated user object.
        Section A5 - Token refresh with blacklist.
        """
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Refresh token is required.'
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify and refresh token
            old_token = RefreshToken(refresh_token)
            
            # Check if token is blacklisted
            if old_token.check_blacklist():
                raise TokenError('Token is blacklisted')
            
            # Get user from token
            user_id = old_token['user_id']
            user = User.objects.get(id=user_id)
            
            # Generate new token pair
            new_refresh = RefreshToken.for_user(user)
            
            # Blacklist the old refresh token (if BLACKLIST_AFTER_ROTATION is True, this happens automatically)
            # But we'll do it explicitly for clarity
            try:
                old_token.blacklist()
            except:
                pass  # Token might already be blacklisted
            
            # Update last active
            user.update_last_active()
            
            return Response({
                'success': True,
                'data': {
                    'access': str(new_refresh.access_token),
                    'refresh': str(new_refresh),
                    'user': UserSerializer(user).data
                },
                'message': 'Token refreshed successfully.'
            }, status=status.HTTP_200_OK)
            
        except TokenError:
            return Response({
                'success': False,
                'error': {
                    'code': 'TOKEN_EXPIRED',
                    'message': 'Session expired. Please log in again.'
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'NOT_FOUND',
                    'message': 'User not found.'
                }
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': {
                    'code': 'SERVER_ERROR',
                    'message': 'An error occurred while refreshing token.'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password with validation."""
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Please correct the errors.',
                    'fields': serializer.errors
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Verify old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'Current password is incorrect.',
                    'fields': {'old_password': ['Current password is incorrect.']}
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'success': True,
            'data': {},
            'message': 'Password changed successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user details."""
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Update current user profile."""
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Recalculate profile completion
            user.calculate_profile_completion()
            
            return Response({
                'success': True,
                'data': UserSerializer(user).data,
                'message': 'Profile updated successfully.'
            })
        
        return Response({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Please correct the errors.',
                'fields': serializer.errors
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get customer dashboard with stats."""
        from orders.models import Order
        from cart.models import Cart
        
        user = request.user
        
        # Get user stats
        user_data = UserSerializer(user).data
        
        # Get cart count
        try:
            cart = Cart.objects.filter(user=user).first()
            cart_count = cart.items.count() if cart else 0
        except:
            cart_count = 0
        
        # Get orders count
        try:
            orders_count = Order.objects.filter(user=user).count()
            recent_orders = Order.objects.filter(user=user).order_by('-created_at')[:5]
            orders_data = [
                {
                    'id': order.id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'total': float(order.total_amount),
                    'date': order.created_at.isoformat()
                } for order in recent_orders
            ]
        except:
            orders_count = 0
            orders_data = []
        
        return Response({
            'success': True,
            'data': {
                'user': user_data,
                'loyalty_points': user.loyalty_points,
                'tier': user.tier,
                'cart_count': cart_count,
                'total_orders': orders_count,
                'recent_orders': orders_data
            }
        })


# Standalone views for URL routing
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Standalone register view for URL routing."""
    viewset = AuthViewSet()
    viewset.action = 'register'
    viewset.request = request
    viewset.format_kwarg = None
    return viewset.register(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Standalone login view for URL routing."""
    import traceback
    try:
        # Call the ViewSet action directly
        viewset = AuthViewSet()
        viewset.action = 'login'
        viewset.request = request
        viewset.format_kwarg = None
        return viewset.login(request)
    except Exception as e:
        print(f"LOGIN ERROR: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': {
                'code': 'SERVER_ERROR',
                'message': str(e),
                'traceback': traceback.format_exc()
            }
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Standalone logout view for URL routing."""
    viewset = AuthViewSet()
    viewset.action = 'logout'
    viewset.request = request
    viewset.format_kwarg = None
    return viewset.logout(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    """Standalone token refresh view for URL routing."""
    viewset = AuthViewSet()
    viewset.action = 'token_refresh'
    viewset.request = request
    viewset.format_kwarg = None
    return viewset.token_refresh(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get current user profile."""
    viewset = AuthViewSet()
    viewset.action = 'me'
    viewset.request = request
    viewset.format_kwarg = None
    return viewset.me(request)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """Update current user profile."""
    viewset = AuthViewSet()
    viewset.action = 'update_profile'
    viewset.request = request
    viewset.format_kwarg = None
    return viewset.update_profile(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    """Get customer dashboard stats."""
    viewset = AuthViewSet()
    viewset.action = 'dashboard'
    viewset.request = request
    viewset.format_kwarg = None
    return viewset.dashboard(request)
