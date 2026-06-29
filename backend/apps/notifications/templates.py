class NotificationTemplates:
    """Centralized template configuration using strings"""
    TEMPLATES = {
        # Users notifications
        'login': {
            'client': {
                'template': 'emails/users/login.html',
                'subject': 'Login Notification'
            },
            'worker': {
                'template': 'emails/users/login.html',
                'subject': 'Login Notification'
            },
            'manager': {
                'template': 'emails/users/login.html',
                'subject': 'Login Notification'
            },

        },
        'registered': {
            'client': {
                'template': 'emails/users/registered_user.html',
                'subject': 'Welcome to our platform!'
            },
            'worker': {
                'template': 'emails/users/registered_user.html',
                'subject': 'Welcome to our platform!'
            },
            'manager': {
                'template': 'emails/users/registered_manager.html',
                'subject': 'New User Registration'
            }
        },
        'role_changed': {
            'client': {
                'template': 'emails/users/role_changed_user.html',
                'subject': 'Your Role Has Been Updated'
            },
            'worker': {
                'template': 'emails/users/registered_user.html',
                'subject': 'Welcome to our platform!'
            },
            'manager': {
                'template': 'emails/users/role_changed_manager.html',
                'subject': 'User Role Change Notification'
            }
        },

        # Projects notifications
        'project_created': {
            'client': {
                'template': 'emails/projects/project_created.html',
                'subject': 'New Project Created: {project_name}'
            },
            'manager': {
                'template': 'emails/projects/project_created.html',
                'subject': 'New Project: {project_name}'
            },
            'worker': {
                'template': 'emails/projects/project_created_team.html',
                'subject': 'You have been assigned to a new project: {project_name}'
            }
        },
        'project_updated': {
            'client': {
                'template': 'emails/projects/project_updated.html',
                'subject': 'Project Updated: {project_name}'
            },
            'manager': {
                'template': 'emails/projects/project_updated.html',
                'subject': 'Project Updated: {project_name}'
            },
            'worker': {
                'template': 'emails/projects/project_updated.html',
                'subject': 'Project Update: {project_name}'
            }
        },
        'project_status_updated': {
            'client': {
                'template': 'emails/projects/project_status_updated.html',
                'subject': 'Project Updated: {project_name}'
            },
            'manager': {
                'template': 'emails/projects/project_status_updated.html',
                'subject': 'Project Updated: {project_name}'
            },
            'worker': {
                'template': 'emails/projects/project_status_updated.html',
                'subject': 'Project Updated: {project_name}'
            }
        },
        'project_deleted': {
            'client': {
                'template': 'emails/projects/project_deleted.html',
                'subject': 'Project Deleted: {project_name}'
            },
            'manager': {
                'template': 'emails/projects/project_deleted.html',
                'subject': 'Project Deleted: {project_name}'
            },
            'worker': {
                'template': 'emails/projects/project_deleted.html',
                'subject': 'Project Deleted: {project_name}'
            }
        },

        # Finances notifications
        # Payments
        'payment_created': {
            'client': {
                'template': 'emails/finances/payment_created.html',
                'subject': 'A New Payment Has Been Created for Project: {project_name}'
            },
            'manager': {
                'template': 'emails/finances/payment_created.html',
                'subject': 'A New Payment Has Been Created for Project: {project_name}'
            },
        },
        'payment_success': {
            'client': {
                'template': 'emails/finances/payment_success.html',
                'subject': 'Payment Successful for Project: {project_name}'
            },
            'manager': {
                'template': 'emails/finances/payment_success.html',
                'subject': 'Payment Successful for Project: {project_name}'
            },
        },
        'payment_failed': {
            'client': {
                'template': 'emails/finances/payment_failed.html',
                'subject': 'Payment Failed for Project: {project_name}'
            },
            'manager': {
                'template': 'emails/finances/payment_failed.html',
                'subject': 'Payment Failed for Project: {project_name}'
            },
        },

        # Salaries
        'salary_created': {
            'worker': {
                'template': 'emails/finances/salary_created.html',
                'subject': 'New Salary Payment: {worker_name}'
            },
            'manager': {
                'template': 'emails/finances/salary_created.html',
                'subject': 'New Salary Payment: {worker_name}'
            },
        },

        # Reviews notifications
        'review_created': {
            'client': {
                'template': 'emails/reviews/review_created.html',
                'subject': 'Your Review for {project_name}'
            },
            'manager': {
                'template': 'emails/reviews/review_created.html',
                'subject': 'New Review for Project: {project_name}'
            },
            'worker': {
                'template': 'emails/reviews/review_created.html',
                'subject': 'New Review for Your Project: {project_name}'
            }
        },
        'review_updated': {
            'client': {
                'template': 'emails/reviews/review_updated.html',
                'subject': 'Your Review Updated for {project_name}'
            },
            'manager': {
                'template': 'emails/reviews/review_updated.html',
                'subject': 'Review Updated for Project: {project_name}'
            },
            'worker': {
                'template': 'emails/reviews/review_updated.html',
                'subject': 'Review Update for Your Project: {project_name}'
            }
        },
        'review_deleted': {
            'client': {
                'template': 'emails/reviews/review_deleted.html',
                'subject': 'Review Deleted for {project_name}'
            },
            'manager': {
                'template': 'emails/reviews/review_deleted.html',
                'subject': 'Review Deleted for Project: {project_name}'
            },
            'worker': {
                'template': 'emails/reviews/review_deleted.html',
                'subject': 'Review Removed from Your Project: {project_name}'
            }
        },
    }
