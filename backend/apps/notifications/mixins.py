from django.utils.timezone import now
from .tasks import send_notification_task


class UserNotificationsMixin:
    """Mixin for user-related notifications (always async)"""

    def _get_client_ip(self, request=None):
        """Get client IP address from request"""
        request = request or getattr(self, 'request', None)
        if not request:
            return None
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

    def send_login_notification(self, user, request=None):
        """Send login notification to user (async)"""
        ip_address = self._get_client_ip(request)
        extra_context = {
            'ip_address': ip_address,
            'login_time': now()
        }
        send_notification_task.delay(
            object_id=user.id,
            object_type='user',
            notification_type='login',
            extra_context=extra_context
        )

    def send_registration_notification(self, user):
        """Send registration notification to user and managers (async)"""
        send_notification_task.delay(
            object_id=user.id,
            object_type='user',
            notification_type='registered'
        )

    def send_role_change_notification(self, user, old_role):
        """Send notification about role change (async)"""
        extra_context = {
            'old_role': old_role,
            'new_role': user.role
        }
        send_notification_task.delay(
            object_id=user.id,
            object_type='user',
            notification_type='role_changed',
            extra_context=extra_context
        )


class ProjectNotificationsMixin:
    """Mixin for project-related notifications (always async)"""

    def send_project_created_notification(self, project):
        """Send project created notification to client, managers and team (async)"""

        # Notification for client
        if project.client:
            send_notification_task.delay(
                object_id=project.client.id,
                object_type='user',
                notification_type='project_created',
                extra_context={
                    'project_name': project.name,
                    'project_id': project.id
                }
            )

        # Notification for managers
        managers = project.company.users.filter(role='manager')
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='project_created',
                extra_context={
                    'project_name': project.name,
                    'project_id': project.id
                }
            )

        # Notification for team workers
        for team in project.assigned_team.all():
            for worker in team.workers.all():
                send_notification_task.delay(
                    object_id=worker.id,
                    object_type='user',
                    notification_type='project_created',
                    extra_context={
                        'project_name': project.name,
                        'project_id': project.id
                    })

    def send_project_updated_notification(self, project):
        """Send project updated notification to client, managers and team (async)"""

        if project.client:
            send_notification_task.delay(
                object_id=project.client.id,
                object_type='user',
                notification_type='project_updated',
                extra_context={
                    'project_name': project.name,
                    'project_id': project.id
                }
            )

        managers = project.company.users.filter(role='manager')
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='project_updated',
                extra_context={
                    'project_name': project.name,
                    'project_id': project.id
                }
            )

        for team in project.assigned_team.all():
            for worker in team.workers.all():
                send_notification_task.delay(
                    object_id=worker.id,
                    object_type='user',
                    notification_type='project_updated',
                    extra_context={
                        'project_name': project.name,
                        'project_id': project.id
                    })

    def send_project_status_updated_notification(self, project, new_status):
        """Send project-status updated notification to client, managers and team (async)"""
        context = {
            'project_name': project.name,
            'project_id': project.id,
            'new_status': new_status
        }

        if project.client:
            send_notification_task.delay(
                object_id=project.client.id,
                object_type='user',
                notification_type='project_status_updated',
                extra_context=context
            )

        managers = project.company.users.filter(role='manager')
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='project_status_updated',
                extra_context={
                    'project_name': project.name,
                    'project_id': project.id
                }
            )

        for team in project.assigned_team.all():
            for worker in team.workers.all():
                send_notification_task.delay(
                    object_id=worker.id,
                    object_type='user',
                    notification_type='project_status_updated',
                    extra_context={
                        'project_name': project.name,
                        'project_id': project.id
                    })

    def send_project_deleted_notification(self, project_name, client, company, team_workers):
        """Send project deleted notification to client, managers and team (async)"""

        if client:
            send_notification_task.delay(
                object_id=client.id,
                object_type='user',
                notification_type='project_deleted',
                extra_context={
                    'project_name': project_name
                }
            )

        managers = company.users.filter(role='manager')
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='project_deleted',
                extra_context={
                    'project_name': project_name
                }
            )

        for team in team_workers:
            for worker in team.workers.all():
                send_notification_task.delay(
                    object_id=worker.id,
                    object_type='user',
                    notification_type='project_deleted',
                    extra_context={
                        'project_name': project_name
                    }
                )


class FinancialNotificationsMixin:
    """Mixin for financial notifications (always async)"""

    def send_payment_created_notification(self, payment):
        """Send payment created notification to client and managers"""
        context = {
            'project_name': payment.project.name if payment.project else "No Project",
            'amount': payment.amount,
            'currency': payment.currency,
            'payment_date': payment.created_at.strftime("%Y-%m-%d %H:%M"),
            'manager_name': payment.manager.get_full_name(),
        }

        # Notification for client
        if payment.client:
            send_notification_task.delay(
                object_id=payment.client.id,
                object_type='user',
                notification_type='payment_created',
                extra_context=context
            )

        # Notification for company managers (excluding the payment creator)
        managers = payment.company.users.filter(role='manager').exclude(id=payment.manager.id)
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='payment_created',
                extra_context=context
            )

    def send_payment_success_notification(self, payment):
        """Send payment success notification"""
        context = {
            'project_name': payment.project.name if payment.project else "No Project",
            'amount': payment.amount,
            'currency': payment.currency,
            'payment_date': payment.created_at.strftime("%Y-%m-%d %H:%M"),
        }

        # Notification for client
        if payment.client:
            send_notification_task.delay(
                object_id=payment.client.id,
                object_type='user',
                notification_type='payment_success',
                extra_context=context
            )

        # Notification for manager who created the payment
        send_notification_task.delay(
            object_id=payment.manager.id,
            object_type='user',
            notification_type='payment_success',
            extra_context=context
        )

    def send_payment_failed_notification(self, payment):
        """Send payment failed notification"""
        context = {
            'project_name': payment.project.name if payment.project else "No Project",
            'amount': payment.amount,
            'currency': payment.currency,
            'payment_date': payment.created_at.strftime("%Y-%m-%d %H:%M"),
            'manager_name': payment.manager.get_full_name(),
        }

        # Notification for client
        if payment.client:
            send_notification_task.delay(
                object_id=payment.client.id,
                object_type='user',
                notification_type='payment_failed',
                extra_context=context
            )

        # Notification for manager who created the payment
        send_notification_task.delay(
            object_id=payment.manager.id,
            object_type='user',
            notification_type='payment_failed',
            extra_context=context
        )

    def send_salary_created_notification(self, salary):
        """Send salary created notification to worker and managers"""
        context = {
            'worker_name': salary.worker.get_full_name(),
            'amount': salary.amount,
            'currency': salary.currency,
            'payment_date': salary.date_paid.strftime("%Y-%m-%d"),
            'manager_name': salary.manager.get_full_name(),
        }

        # Notification for worker
        send_notification_task.delay(
            object_id=salary.worker.id,
            object_type='user',
            notification_type='salary_created',
            extra_context=context
        )

        # Notification for other managers in company
        managers = salary.company.users.filter(role='manager').exclude(id=salary.manager.id)
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='salary_created',
                extra_context=context
            )


class ReviewsNotificationMixin:
    """Mixin for review-related notifications (always async)"""

    def send_review_created_notification(self, review):
        """Send review created notification to client, managers and team"""
        context = {
            'project_name': review.project.name,
            'review_id': review.id,
            'client_name': review.client.username if review.client else 'Unknown',
            'rating': review.rating,
            'timestamp': now()
        }

        # Notification for client (review author)
        if review.client:
            send_notification_task.delay(
                object_id=review.client.id,
                object_type='user',
                notification_type='review_created',
                extra_context=context
            )

        # Notification for managers
        managers = review.project.company.users.filter(role='manager')
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='review_created',
                extra_context=context
            )

        # Notification for team workers
        for team in review.project.assigned_team.all():
            for worker in team.workers.all():
                send_notification_task.delay(
                    object_id=worker.id,
                    object_type='user',
                    notification_type='review_created',
                    extra_context=context
                )

    def send_review_updated_notification(self, review):
        """Send review updated notification to client, managers and team"""
        context = {
            'project_name': review.project.name,
            'review_id': review.id,
            'client_name': review.client.username if review.client else 'Unknown',
            'new_rating': review.rating,
            'timestamp': now()
        }

        # Notification for client (review author)
        if review.client:
            send_notification_task.delay(
                object_id=review.client.id,
                object_type='user',
                notification_type='review_updated',
                extra_context=context
            )

        # Notification for managers
        managers = review.project.company.users.filter(role='manager')
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='review_updated',
                extra_context=context
            )

        # Notification for team workers
        for team in review.project.assigned_team.all():
            for worker in team.workers.all():
                send_notification_task.delay(
                    object_id=worker.id,
                    object_type='user',
                    notification_type='review_updated',
                    extra_context=context
                )

    def send_review_deleted_notification(self, project_name, client, company, team_workers):
        """Send review deleted notification to client, managers and team"""
        context = {
            'project_name': project_name,
            'timestamp': now()
        }

        # Notification for client (review author)
        if client:
            send_notification_task.delay(
                object_id=client.id,
                object_type='user',
                notification_type='review_deleted',
                extra_context=context
            )

        # Notification for managers
        managers = company.users.filter(role='manager')
        for manager in managers:
            send_notification_task.delay(
                object_id=manager.id,
                object_type='user',
                notification_type='review_deleted',
                extra_context=context
            )

        # Notification for team workers
        for worker in team_workers:
            send_notification_task.delay(
                object_id=worker.id,
                object_type='user',
                notification_type='review_deleted',
                extra_context=context
            )
