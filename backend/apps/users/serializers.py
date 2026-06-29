from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    company = serializers.StringRelatedField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role', 'address', 'company']
        read_only_fields = ['role', 'company']


class UserManagementSerializer(serializers.ModelSerializer):
    """Lets a manager edit the same fields they set when creating a company user.

    `company` is read-only (taken from the manager context, never trusted from the
    payload) and `password` is optional so an edit can leave it unchanged.
    """
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'address', 'role', 'password', 'company']

    def validate_role(self, value):
        request = self.context['request']
        if request.user.role == 'manager' and value not in ('worker', 'client'):
            raise serializers.ValidationError('Managers can only assign the worker or client role.')
        return value

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='client')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'phone', 'address', 'role']

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        validated_data["role"] = validated_data.get("role", "client")
        validated_data["phone"] = validated_data.get("phone", "")
        validated_data["address"] = validated_data.get("address", "")

        # Connecting the manager's company
        validated_data["company"] = self.context['request'].user.company

        return User.objects.create_user(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        credentials = {
            'password': attrs.get('password')
        }

        if 'username' in attrs:
            credentials['username'] = attrs.get('username')
        elif 'email' in attrs:
            try:
                user = User.objects.get(email=attrs.get('email'))
                credentials['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password")

        return super().validate(credentials)
