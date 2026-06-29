from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.chats.models import ChatMessage, ChatRoom
from apps.companies.models import Company
from apps.finances.models import Transaction
from apps.finances.utils import update_financial_report
from apps.notifications.models import Notification
from apps.projects.models import Project
from apps.reviews.models import Review
from apps.teams.models import Team
from apps.users.models import User
from apps.worklogs.models import WorkLog


class Command(BaseCommand):
    help = "Seed local demo data for the portfolio frontend."

    password = "DemoPass_123!"

    company_data = {
        "main": {
            "name": "Demo Construction CRM",
            "slug": "demo-construction-crm",
        },
        "northside": {
            "name": "Northside Contractors",
            "slug": "northside-contractors",
        },
    }

    user_data = [
        ("demo_manager", "manager@example.com", "manager", "main"),
        ("demo_worker", "worker@example.com", "worker", "main"),
        ("demo_worker_2", "worker2@example.com", "worker", "main"),
        ("demo_client", "client@example.com", "client", "main"),
        ("demo_client_2", "client2@example.com", "client", "main"),
        ("other_manager", "other-manager@example.com", "manager", "northside"),
        ("other_worker", "other-worker@example.com", "worker", "northside"),
        ("other_client", "other-client@example.com", "client", "northside"),
    ]

    team_data = [
        ("Demo Field Team", "main", ["demo_worker"]),
        ("Finishing Crew", "main", ["demo_worker", "demo_worker_2"]),
        ("Exterior Crew", "main", ["demo_worker_2"]),
        ("Northside Field Team", "northside", ["other_worker"]),
    ]

    project_data = [
        {
            "name": "Lakeview Renovation",
            "company": "main",
            "client": "demo_client",
            "teams": ["Demo Field Team", "Finishing Crew"],
            "description": (
                "Interior renovation with framing, materials coordination, "
                "fixture updates, and staged client walkthroughs."
            ),
            "address": "128 Lakeview Drive",
            "status": "partially completed",
            "priority": "high",
            "budget": Decimal("45000.00"),
            "start_date": date(2026, 4, 1),
            "end_date": None,
        },
        {
            "name": "Downtown Office Refresh",
            "company": "main",
            "client": "demo_client",
            "teams": ["Finishing Crew"],
            "description": (
                "Tenant improvement refresh with fixture removal, paint touch-ups, "
                "layout preparation, and final cleanup."
            ),
            "address": "44 Jasper Avenue",
            "status": "assigned",
            "priority": "medium",
            "budget": Decimal("28000.00"),
            "start_date": date(2026, 5, 12),
            "end_date": None,
        },
        {
            "name": "Riverside Deck Build",
            "company": "main",
            "client": "demo_client_2",
            "teams": ["Exterior Crew"],
            "description": (
                "Outdoor deck build with material staging, layout measurements, "
                "footing preparation, and weather-aware scheduling."
            ),
            "address": "912 Riverbend Road",
            "status": "pending",
            "priority": "high",
            "budget": Decimal("18000.00"),
            "start_date": date(2026, 6, 15),
            "end_date": None,
        },
        {
            "name": "Maple Street Repairs",
            "company": "main",
            "client": "demo_client_2",
            "teams": ["Demo Field Team"],
            "description": (
                "Completed repair package covering drywall patching, trim fixes, "
                "minor exterior sealing, and final client handoff."
            ),
            "address": "73 Maple Street",
            "status": "completed",
            "priority": "low",
            "budget": Decimal("7600.00"),
            "start_date": date(2026, 3, 10),
            "end_date": date(2026, 3, 28),
        },
        {
            "name": "Client Portal Demo Project",
            "company": "main",
            "client": "demo_client",
            "teams": ["Demo Field Team"],
            "description": (
                "Cancelled demo project retained to show how inactive projects "
                "appear in client and manager portfolio screens."
            ),
            "address": "15 Portal Lane",
            "status": "cancelled",
            "priority": "medium",
            "budget": Decimal("12000.00"),
            "start_date": date(2026, 2, 5),
            "end_date": None,
        },
        {
            "name": "Northside Warehouse Fitout",
            "company": "northside",
            "client": "other_client",
            "teams": ["Northside Field Team"],
            "description": (
                "Warehouse fitout with framing adjustments, fixture coordination, "
                "and staged operations handoff for the isolation tenant."
            ),
            "address": "500 Northside Industrial Road",
            "status": "assigned",
            "priority": "medium",
            "budget": Decimal("52000.00"),
            "start_date": date(2026, 5, 20),
            "end_date": None,
        },
    ]

    worklog_data = [
        ("Lakeview Renovation", "demo_worker", "Demo Field Team", 6, "Site preparation and protection"),
        ("Lakeview Renovation", "demo_worker_2", "Finishing Crew", 8, "Interior framing and drywall review"),
        ("Lakeview Renovation", "demo_worker", "Finishing Crew", 5, "Client walkthrough and punch list"),
        ("Downtown Office Refresh", "demo_worker_2", "Finishing Crew", 7, "Fixture removal and layout prep"),
        ("Downtown Office Refresh", "demo_worker", "Finishing Crew", 4, "Paint touch-ups and cleanup"),
        ("Riverside Deck Build", "demo_worker_2", "Exterior Crew", 6, "Material staging and measurements"),
        ("Northside Warehouse Fitout", "other_worker", "Northside Field Team", 7, "Warehouse framing layout review"),
    ]

    transaction_data = [
        ("main", "income", Decimal("15000.00"), "Initial client deposit - Lakeview"),
        ("main", "income", Decimal("8000.00"), "Office refresh progress payment"),
        ("main", "expense", Decimal("3200.00"), "Materials purchase - Lakeview"),
        ("main", "expense", Decimal("1800.00"), "Labor and equipment"),
        ("main", "expense", Decimal("950.00"), "Permit and disposal fees"),
        ("northside", "income", Decimal("12000.00"), "Warehouse fitout deposit"),
        ("northside", "expense", Decimal("4100.00"), "Northside materials order"),
    ]

    review_data = [
        (
            "Lakeview Renovation",
            "demo_client",
            5,
            "Clear updates, reliable scheduling, and excellent finish quality.",
        ),
        (
            "Maple Street Repairs",
            "demo_client_2",
            4,
            "Repairs were completed cleanly and the handoff was easy to follow.",
        ),
    ]

    chat_message_data = {
        "Lakeview Renovation": [
            ("demo_manager", "Can I get a progress update before the client walkthrough?"),
            ("demo_worker", "Site protection is complete and framing review is ready."),
            ("demo_worker_2", "Drywall review is finished. I added the remaining punch list notes."),
            ("demo_client", "Thanks, the walkthrough timing still works for me."),
        ],
        "Downtown Office Refresh": [
            ("demo_manager", "Please confirm fixture removal is complete before layout prep."),
            ("demo_worker_2", "Fixture removal is done and the workspace is ready for prep."),
            ("demo_client", "The schedule looks good from our office side."),
        ],
        "Riverside Deck Build": [
            ("demo_manager", "Measurements are the priority before material ordering."),
            ("demo_worker_2", "Measurements are complete and materials are staged."),
        ],
        "Maple Street Repairs": [
            ("demo_manager", "Final repair photos are attached to the closeout notes."),
            ("demo_client_2", "Everything looks clean. Thanks for wrapping this up."),
        ],
        "Client Portal Demo Project": [
            ("demo_manager", "This project is cancelled but remains visible for demo history."),
            ("demo_client", "Understood. I can still see the archived project context."),
        ],
        "Northside Warehouse Fitout": [
            ("other_manager", "Northside team, please confirm warehouse layout status."),
            ("other_worker", "Layout review is complete and ready for next steps."),
        ],
    }

    notification_data = [
        (
            "main",
            "demo_manager",
            "Lakeview progress update",
            "Lakeview Renovation has fresh field progress for manager review.",
        ),
        (
            "main",
            "demo_worker",
            "Assigned project reminder",
            "You have active demo work assigned on Lakeview Renovation.",
        ),
        (
            "main",
            "demo_client",
            "Client project update",
            "Your Lakeview Renovation project has updated schedule and payment context.",
        ),
        (
            "northside",
            "other_manager",
            "Northside fitout update",
            "Northside Warehouse Fitout has new field activity in the isolation tenant.",
        ),
    ]

    legacy_worklog_descriptions = [
        "site preparation",
        "framing work",
        "client walkthrough / finishing details",
    ]
    legacy_transaction_descriptions = [
        "Initial client deposit",
        "Materials purchase",
    ]
    legacy_chat_contents = [
        "Demo schedule is updated for the next site visit.",
        "Framing work is complete and ready for inspection.",
        "Thanks, the walkthrough notes look good from my side.",
    ]
    legacy_notification_subjects = [
        "Demo project ready",
        "Demo worklog reminder",
        "Demo client update",
    ]

    def handle(self, *args, **options):
        companies = self.create_companies()
        users = self.create_users(companies)
        teams = self.create_teams(companies, users)
        projects = self.create_projects(companies, users, teams)

        self.remove_legacy_seed_records(companies, projects)
        self.create_worklogs(users, teams, projects)
        self.create_transactions(companies)
        self.create_reviews(users, projects)
        self.create_chat_messages(users, projects)
        self.create_notifications(companies, users)

        for company in companies.values():
            update_financial_report(company)

        self.stdout.write(self.style.SUCCESS(
            "Demo data ready.\n"
            "Main company credentials:\n"
            "demo_manager / DemoPass_123!\n"
            "demo_worker / DemoPass_123!\n"
            "demo_worker_2 / DemoPass_123!\n"
            "demo_client / DemoPass_123!\n"
            "demo_client_2 / DemoPass_123!\n"
            "Isolation company credentials:\n"
            "other_manager / DemoPass_123!\n"
            "other_worker / DemoPass_123!\n"
            "other_client / DemoPass_123!\n"
            f"Ensured {len(companies)} companies, {len(users)} users, "
            f"{len(teams)} teams, and {len(projects)} projects."
        ))

    def create_companies(self):
        companies = {}

        for key, data in self.company_data.items():
            company, _ = Company.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                }
            )
            companies[key] = company

        return companies

    def create_users(self, companies):
        users = {}

        for username, email, role, company_key in self.user_data:
            company = companies[company_key]
            user = User.objects.filter(username=username).first()

            if user:
                user.email = email
                user.role = role
                user.company = company
                user.set_password(self.password)
                user.save()
            else:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=self.password,
                    role=role,
                    company=company
                )

            users[username] = user

        return users

    def create_teams(self, companies, users):
        teams = {}

        for name, company_key, worker_usernames in self.team_data:
            team, _ = Team.objects.update_or_create(
                name=name,
                defaults={
                    "company": companies[company_key],
                }
            )
            team.workers.set([users[username] for username in worker_usernames])
            teams[name] = team

        return teams

    def create_projects(self, companies, users, teams):
        projects = {}

        for data in self.project_data:
            project, _ = Project.objects.update_or_create(
                name=data["name"],
                company=companies[data["company"]],
                defaults={
                    "description": data["description"],
                    "client": users[data["client"]],
                    "address": data["address"],
                    "status": data["status"],
                    "priority": data["priority"],
                    "budget": data["budget"],
                    "start_date": data["start_date"],
                    "end_date": data["end_date"],
                }
            )
            project.assigned_team.set([teams[name] for name in data["teams"]])
            ChatRoom.objects.get_or_create(project=project)
            projects[data["name"]] = project

        return projects

    def remove_legacy_seed_records(self, companies, projects):
        lakeview_project = projects.get("Lakeview Renovation")

        if lakeview_project:
            WorkLog.objects.filter(
                project=lakeview_project,
                description__in=self.legacy_worklog_descriptions
            ).delete()

            chat_room = ChatRoom.objects.filter(project=lakeview_project).first()
            if chat_room:
                ChatMessage.objects.filter(
                    room=chat_room,
                    content__in=self.legacy_chat_contents
                ).delete()

        Transaction.objects.filter(
            company=companies["main"],
            description__in=self.legacy_transaction_descriptions
        ).delete()

        Notification.objects.filter(
            company=companies["main"],
            subject__in=self.legacy_notification_subjects
        ).delete()

    def create_worklogs(self, users, teams, projects):
        for project_name, worker_username, team_name, hours, description in self.worklog_data:
            WorkLog.objects.update_or_create(
                worker=users[worker_username],
                team=teams[team_name],
                project=projects[project_name],
                description=description,
                defaults={
                    "hours_worked": hours,
                }
            )

    def create_transactions(self, companies):
        for company_key, transaction_type, amount, description in self.transaction_data:
            Transaction.objects.update_or_create(
                company=companies[company_key],
                description=description,
                defaults={
                    "transaction_type": transaction_type,
                    "amount": amount,
                }
            )

    def create_reviews(self, users, projects):
        for project_name, client_username, rating, comment in self.review_data:
            Review.objects.update_or_create(
                project=projects[project_name],
                defaults={
                    "client": users[client_username],
                    "rating": rating,
                    "comment": comment,
                }
            )

    def create_chat_messages(self, users, projects):
        for project_name, messages in self.chat_message_data.items():
            chat_room, _ = ChatRoom.objects.get_or_create(project=projects[project_name])

            for sender_username, content in messages:
                ChatMessage.objects.get_or_create(
                    room=chat_room,
                    sender=users[sender_username],
                    content=content
                )

    def create_notifications(self, companies, users):
        for company_key, recipient_username, subject, message in self.notification_data:
            Notification.objects.update_or_create(
                company=companies[company_key],
                recipient=users[recipient_username],
                subject=subject,
                defaults={
                    "message": message,
                    "email_sent": False,
                }
            )
