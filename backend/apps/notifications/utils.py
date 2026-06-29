from apps.notifications.models import Notification
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def create_notification_record(recipient, subject, message=''):
    """Helper to create notification DB record"""
    return Notification.objects.create(
        company=getattr(recipient, 'company', None),
        recipient=recipient,
        subject=subject,
        message=message,
        email_sent=False
    )


def send_notification_email(recipient_email, subject, html_template, context=None, html_content=None):
    """Send HTML email with plain text alternative"""
    context = context or {}

    if html_content is None:
        html_content = render_to_string(html_template, context)
    text_content = strip_tags(html_content)

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient_email]
    )
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)
