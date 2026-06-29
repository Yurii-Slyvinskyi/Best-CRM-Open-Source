import json
import pytest
import stripe
from datetime import datetime
from django.urls import reverse
from unittest.mock import patch

from apps.finances.models import FinancialReport, Transaction


@pytest.mark.django_db
class TestStripeWebhook:

    def test_checkout_session_completed_success(self, client, payment):
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": payment.session_id,
                    "payment_intent": "pi_test_123",
                    "created": int(datetime.now().timestamp())
                }
            }
        }

        url = reverse('stripe_webhook')

        with patch('stripe.Webhook.construct_event', return_value=event):
            response = client.post(
                url,
                data=json.dumps({}),
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='mocked'
            )

        payment.refresh_from_db()
        assert response.status_code == 200
        assert payment.status == 'confirmed'
        assert Transaction.objects.filter(
            company=payment.company,
            amount=payment.amount,
            transaction_type='income'
        ).exists()

        report = FinancialReport.objects.get(company=payment.company)
        assert report.total_income == payment.amount
        assert report.total_expenses == 0
        assert report.net_profit == payment.amount

    def test_checkout_session_async_payment_failed(self, client, payment):
        event = {
            "type": "checkout.session.async_payment_failed",
            "data": {
                "object": {
                    "id": payment.session_id,
                    "last_payment_error": {"message": "Card declined"}
                }

            }
        }

        url = reverse('stripe_webhook')

        with patch('stripe.Webhook.construct_event', return_value=event):
            response = client.post(
                url,
                data=json.dumps({}),
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='mocked'
            )

        payment.refresh_from_db()
        assert response.status_code == 200
        assert payment.status == 'failed'

    def test_invalid_signature(self, client):
        url = reverse('stripe_webhook')

        with patch('stripe.Webhook.construct_event',
                   side_effect=stripe.error.SignatureVerificationError(
                       "Invalid signature",
                       sig_header="mocked"
                   )):
            response = client.post(
                url,
                data=json.dumps({}),
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='mocked'
            )

        assert response.status_code == 400

    def test_invalid_payload(self, client):
        url = reverse('stripe_webhook')

        with patch('stripe.Webhook.construct_event', side_effect=ValueError("Invalid payload")):
            response = client.post(
                url,
                data="not a json",
                content_type='application/json',
                HTTP_STRIPE_SIGNATURE='whatever'
            )

        assert response.status_code == 400
