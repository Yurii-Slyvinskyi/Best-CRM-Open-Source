import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from apps.finances.models import Payment, Transaction
from apps.finances.views import FinancialNotificationsMixin
import logging

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_payment_success(session)
    elif event['type'] == 'checkout.session.async_payment_failed':
        session = event['data']['object']
        handle_payment_failed(session)

    return HttpResponse(status=200)


def handle_payment_success(session):
    payment = Payment.objects.filter(session_id=session['id']).first()
    if not payment:
        return HttpResponse("Payment not found", status=404)

    try:
        payment.status = 'confirmed'
        payment.save()

        notifier = FinancialNotificationsMixin()
        notifier.send_payment_success_notification(payment)

        if payment.company:
            Transaction.objects.create(
                company=payment.company,
                amount=payment.amount,
                currency=payment.currency,
                transaction_type='income',
                description=f"Payment from {payment.client.username if payment.client else 'client'} for project {payment.project.name if payment.project else 'N/A'}"
            )

    except Exception as e:
        return HttpResponse(f"Error processing payment: {str(e)}", status=500)

    return HttpResponse(status=200)


def handle_payment_failed(session):
    payment = Payment.objects.filter(session_id=session['id']).first()
    if not payment:
        return

    payment.status = 'failed'
    payment.save()

    notifier = FinancialNotificationsMixin()
    session.get('last_payment_error', {}).get('message', 'Unknown error')
    notifier.send_payment_failed_notification(payment)
