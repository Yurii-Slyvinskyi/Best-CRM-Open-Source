import stripe.checkout
from django.conf import settings
from rest_framework import serializers
from .models import Payment, Salary, Transaction, FinancialReport


class CompanyValidationMixin:
    """Mixin to validate that the object belongs to the user's company."""

    def validate(self, data):
        user = self.context['request'].user
        company = data.get('company') or self.instance.company if self.instance else None
        if company and company != user.company:
            raise serializers.ValidationError("You can only manage data within your company")
        return data


class PaymentSerializer(CompanyValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['manager', 'company', 'created_at', 'session_id', 'session_url']

    def get_session_url(self, obj):
        return obj.session_url if obj.session_url else None

    def _create_checkout_session(self, amount, project, client, user, currency):
        """Create a Stripe Checkout Session for the given payment details"""
        frontend_base_url = settings.FRONTEND_BASE_URL.rstrip('/')

        return stripe.checkout.Session.create(
            payment_method_types=['card'],
            customer_email=client.email,
            metadata={
                "project_id": project.id,
                "client_id": client.id,
                "manager_id": user.id,
                "company_id": user.company.id
            },
            line_items=[{
                'price_data': {
                    'currency': currency.lower(),
                    'product_data': {'name': f'Payment for {project.name}'},
                    'unit_amount': int(amount * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{frontend_base_url}/success",
            cancel_url=f"{frontend_base_url}/cancel",
        )

    def create(self, validated_data):
        """Create a Stripe Checkout Session in the selected currency (USD/CAD)"""

        user = self.context['request'].user
        currency = validated_data.get('currency', 'USD')
        session = self._create_checkout_session(
            validated_data['amount'],
            validated_data['project'],
            validated_data['client'],
            user,
            currency,
        )

        validated_data['session_id'] = session.id
        validated_data['session_url'] = session.url
        validated_data['status'] = 'pending'
        validated_data['currency'] = currency

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Edit a payment: change status, or edit pending details (re-issuing Stripe)."""

        if instance.status == 'confirmed':
            raise serializers.ValidationError("Confirmed payments can no longer be changed.")

        if 'currency' in validated_data:
            instance.currency = validated_data['currency']

        detail_fields = ('amount', 'project', 'client')
        if any(field in validated_data for field in detail_fields):
            if instance.status != 'pending':
                raise serializers.ValidationError("Only pending payments can have their details edited.")

            for field in detail_fields:
                if field in validated_data:
                    setattr(instance, field, validated_data[field])

            session = self._create_checkout_session(
                instance.amount,
                instance.project,
                instance.client,
                self.context['request'].user,
                instance.currency,
            )

            instance.session_id = session.id
            instance.session_url = session.url
            instance.status = 'pending'

        if 'status' in validated_data:
            instance.status = validated_data['status']

        instance.save()
        return instance


class SalarySerializer(CompanyValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Salary
        fields = '__all__'
        read_only_fields = ['status', 'manager', 'company', 'created_at']


class TransactionSerializer(CompanyValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        # `salary` is an internal link set by the salary flow, never written by clients.
        read_only_fields = ['created_at', 'company', 'salary']

    def create(self, validated_data):
        user = self.context['request'].user
        if 'company' not in validated_data:
            validated_data['company'] = user.company
        return super().create(validated_data)


class FinancialReportSerializer(CompanyValidationMixin, serializers.ModelSerializer):
    # Per-currency breakdown; the legacy total_* fields aggregate every transaction
    # regardless of currency and must not be shown as a single multi-currency total.
    totals_by_currency = serializers.SerializerMethodField()

    class Meta:
        model = FinancialReport
        fields = '__all__'
        read_only_fields = [
            'company',
            'start_date',
            'end_date',
            'total_income',
            'total_expenses',
            'net_profit',
            'generated_at'
        ]

    def get_totals_by_currency(self, obj):
        from .utils import totals_by_currency
        return totals_by_currency(obj.company)
