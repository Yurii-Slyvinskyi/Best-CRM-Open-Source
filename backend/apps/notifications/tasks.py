from celery import shared_task
import logging

from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from apps.notifications.templates import NotificationTemplates
from apps.notifications.utils import create_notification_record, send_notification_email
from apps.users.models import User

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, name='notifications.send_notification')
def send_notification_task(self, object_id, object_type, notification_type, extra_context=None):
    try:
        user = User.objects.only('id', 'email', 'username', 'role', 'company_id').select_related('company').get(
            id=object_id)

        template_config = NotificationTemplates.TEMPLATES.get(notification_type)

        if not template_config:
            logger.error(f"No template for {notification_type}")
            return False

        # Define the role for template selection
        user_role = user.role
        user_config = template_config.get(user_role)

        if not user_config:
            logger.error(f"[NOTIFY] No template config found for role '{user_role}' in '{notification_type}'")
            return False

        # Base context
        context = {
            'user': user,
            'username': user.username,
            'email': user.email,
            'ip_address': extra_context.get('ip_address', '') if extra_context else '',
            'login_time': extra_context.get('login_time', timezone.now()) if extra_context else timezone.now(),
            'timestamp': timezone.now()
        }

        # Add additional context, if any
        if extra_context:
            context.update(extra_context)

        subject = user_config['subject'].format(**context)

        send_notification_email(
            recipient_email=user.email,
            subject=subject,
            html_template=user_config['template'],
            context=context
        )

        notification = create_notification_record(
            recipient=user,
            subject=subject,
            message=strip_tags(render_to_string(user_config['template'], context)))
        notification.email_sent = True
        notification.save()

        return True

    except Exception as e:
        logger.error(f"Notification task failed: {e}")
        raise self.retry(exc=e, countdown=60)
