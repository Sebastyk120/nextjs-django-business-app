from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.forms import PasswordResetForm


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data"""
    groups = serializers.StringRelatedField(many=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'groups']
        read_only_fields = ['username', 'email', 'groups']


class LoginSerializer(serializers.Serializer):
    """Serializer for login validation"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciales incorrectas')
            if not user.is_active:
                raise serializers.ValidationError('Usuario inactivo')
            data['user'] = user
        else:
            raise serializers.ValidationError('Username y password son requeridos')

        return data


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset validation"""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        # Check if email exists in the database
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('No existe un usuario con este email')
        return value
