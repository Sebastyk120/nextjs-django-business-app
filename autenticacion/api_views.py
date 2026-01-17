from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.middleware.csrf import get_token
from .serializers import LoginSerializer, UserSerializer, PasswordResetSerializer


class LoginAPIView(APIView):
    """
    API endpoint for user login
    POST: Login with username and password
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'redirect_url': '/home/',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': serializer.errors.get('non_field_errors', ['Credenciales incorrectas'])[0]
        }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutAPIView(APIView):
    """
    API endpoint for user logout
    POST: Logout current user
    """
    permission_classes = [AllowAny]  # Allow anyone to logout

    def post(self, request):
        logout(request)
        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class CheckAuthAPIView(APIView):
    """
    API endpoint to check authentication status
    GET: Returns current user info if authenticated
    Also ensures CSRF cookie is set for subsequent requests
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Ensure CSRF cookie is set for subsequent POST/PUT/DELETE requests
        get_token(request)
        
        if request.user.is_authenticated:
            return Response({
                'authenticated': True,
                'user': UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'authenticated': False
        }, status=status.HTTP_200_OK)


class CSRFTokenAPIView(APIView):
    """
    API endpoint to ensure CSRF cookie is set
    GET: Triggers Django to set the CSRF cookie
    Needed for cross-origin requests in production
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # The ensure_csrf_cookie decorator would be ideal here, but for class-based views
        # we need to use the method decorator. However, for simplicity, we can manually
        # ensure the cookie is rotated by calling get_token which forces Django to set it.
        # The key is that Django will set the cookie in the response automatically.
        get_token(request)  # This ensures the CSRF cookie is set/refreshed
        return Response({
            'detail': 'CSRF cookie set'
        }, status=status.HTTP_200_OK)


class PasswordResetAPIView(APIView):
    """
    API endpoint for password reset request
    POST: Send password reset email
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # Use Django's PasswordResetForm
            form_data = {'email': email}
            form = PasswordResetForm(form_data)
            
            if form.is_valid():
                opts = {
                    'use_https': request.is_secure(),
                    'token_generator': default_token_generator,
                    'from_email': settings.DEFAULT_FROM_EMAIL,
                    'email_template_name': 'registration/password_reset_email.html',
                    'subject_template_name': 'registration/password_reset_subject.txt',
                    'request': request,
                    'html_email_template_name': None,
                }
                form.save(**opts)
                
                return Response({
                    'success': True,
                    'message': 'Password reset email sent'
                }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': 'Invalid email',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
