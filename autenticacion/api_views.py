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
        response = Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
        # Explicitly delete cookies to prevent auto-login loop
        response.delete_cookie('sessionid')
        response.delete_cookie('csrftoken')
        return response


class CheckAuthAPIView(APIView):
    """
    API endpoint to check authentication status
    GET: Returns current user info if authenticated
    Also ensures CSRF cookie is set for subsequent requests
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # Ensure CSRF cookie is set for subsequent POST/PUT/DELETE requests
        csrf_token = get_token(request)
        
        if request.user.is_authenticated:
            return Response({
                'authenticated': True,
                'user': UserSerializer(request.user).data,
                'csrfToken': csrf_token  # Return token in body as JS cannot read cross-domain cookies
            }, status=status.HTTP_200_OK)
        
        return Response({
            'authenticated': False,
            'csrfToken': csrf_token
        }, status=status.HTTP_200_OK)


class CSRFTokenAPIView(APIView):
    """
    API endpoint to ensure CSRF cookie is set
    GET: Triggers Django to set the CSRF cookie
    Needed for cross-origin requests in production
    """
    permission_classes = [AllowAny]

    def get(self, request):
        csrf_token = get_token(request)  # This ensures the CSRF cookie is set/refreshed
        return Response({
            'csrfToken': csrf_token
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
                # Determinar el dominio correcto para el enlace de reset
                # El formulario de confirmación está en el backend Django
                if settings.DEBUG:
                    domain = request.get_host()
                else:
                    # En producción, usar el dominio del API donde Django sirve el formulario
                    domain = 'api.heavensfruit.com'
                
                opts = {
                    'use_https': not settings.DEBUG,  # HTTPS en producción
                    'token_generator': default_token_generator,
                    'from_email': settings.DEFAULT_FROM_EMAIL,
                    'email_template_name': 'registration/password_reset_email.html',
                    'subject_template_name': 'registration/password_reset_subject.txt',
                    'request': request,
                    'html_email_template_name': None,
                    'domain_override': domain,
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
