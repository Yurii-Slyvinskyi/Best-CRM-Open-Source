from decimal import Decimal
from io import StringIO

import pytest
from django.core.management import call_command

from apps.chats.models import ChatMessage, ChatRoom
from apps.companies.models import Company
from apps.finances.models import FinancialReport, Transaction
from apps.notifications.models import Notification
from apps.projects.models import Project
from apps.reviews.models import Review
from apps.teams.models import Team
from apps.users.models import User
from apps.worklogs.models import WorkLog


@pytest.mark.django_db
class TestSeedDemoDataCommand:
    main_usernames = [
        "demo_manager",
        "demo_worker",
        "demo_worker_2",
        "demo_client",
        "demo_client_2",
    ]
    northside_usernames = [
        "other_manager",
        "other_worker",
        "other_client",
    ]
    main_project_names = [
        "Lakeview Renovation",
        "Downtown Office Refresh",
        "Riverside Deck Build",
        "Maple Street Repairs",
        "Client Portal Demo Project",
    ]
    northside_project_names = [
        "Northside Warehouse Fitout",
    ]

    def test_seed_demo_data_creates_demo_records(self):
        output = StringIO()

        call_command("seed_demo_data", stdout=output)

        main_company = Company.objects.get(slug="demo-construction-crm")
        northside_company = Company.objects.get(slug="northside-contractors")
        main_report = FinancialReport.objects.get(company=main_company)
        northside_report = FinancialReport.objects.get(company=northside_company)

        assert main_company.name == "Demo Construction CRM"
        assert northside_company.name == "Northside Contractors"

        for username in self.main_usernames:
            user = User.objects.get(username=username)
            assert user.company == main_company
            assert user.check_password("DemoPass_123!")

        for username in self.northside_usernames:
            user = User.objects.get(username=username)
            assert user.company == northside_company
            assert user.check_password("DemoPass_123!")

        assert User.objects.get(username="demo_manager").role == "manager"
        assert User.objects.get(username="demo_worker").role == "worker"
        assert User.objects.get(username="demo_worker_2").role == "worker"
        assert User.objects.get(username="demo_client").role == "client"
        assert User.objects.get(username="demo_client_2").role == "client"
        assert User.objects.get(username="other_manager").role == "manager"
        assert User.objects.get(username="other_worker").role == "worker"
        assert User.objects.get(username="other_client").role == "client"

        self.assert_team_workers("Demo Field Team", main_company, ["demo_worker"])
        self.assert_team_workers("Finishing Crew", main_company, ["demo_worker", "demo_worker_2"])
        self.assert_team_workers("Exterior Crew", main_company, ["demo_worker_2"])
        self.assert_team_workers("Northside Field Team", northside_company, ["other_worker"])

        main_projects = Project.objects.filter(company=main_company, name__in=self.main_project_names)
        northside_projects = Project.objects.filter(company=northside_company, name__in=self.northside_project_names)

        assert main_projects.count() == 5
        assert northside_projects.count() == 1
        assert Project.objects.get(name="Lakeview Renovation", company=main_company).assigned_team.count() == 2
        assert Project.objects.get(name="Riverside Deck Build", company=main_company).client.username == "demo_client_2"

        for project in Project.objects.filter(name__in=self.main_project_names + self.northside_project_names):
            assert ChatRoom.objects.filter(project=project).count() == 1

        assert WorkLog.objects.filter(project__company=main_company).count() == 6
        assert WorkLog.objects.filter(project__company=northside_company).count() == 1
        assert not WorkLog.objects.filter(project__status="completed").exists()

        assert Transaction.objects.filter(company=main_company).count() == 5
        assert Transaction.objects.filter(company=northside_company).count() == 2
        assert main_report.total_income == Decimal("23000.00")
        assert main_report.total_expenses == Decimal("5950.00")
        assert main_report.net_profit == Decimal("17050.00")
        assert northside_report.total_income == Decimal("12000.00")
        assert northside_report.total_expenses == Decimal("4100.00")
        assert northside_report.net_profit == Decimal("7900.00")

        assert Review.objects.filter(project__name="Lakeview Renovation", client__username="demo_client", rating=5).exists()
        assert Review.objects.filter(project__name="Maple Street Repairs", client__username="demo_client_2", rating=4).exists()
        assert ChatMessage.objects.filter(room__project__company=main_company).count() == 13
        assert ChatMessage.objects.filter(room__project__company=northside_company).count() == 2
        assert Notification.objects.filter(company=main_company).count() == 3
        assert Notification.objects.filter(company=northside_company).count() == 1

        assert "Demo data ready." in output.getvalue()
        assert "demo_manager / DemoPass_123!" in output.getvalue()
        assert "demo_worker_2 / DemoPass_123!" in output.getvalue()
        assert "demo_client_2 / DemoPass_123!" in output.getvalue()
        assert "other_manager / DemoPass_123!" in output.getvalue()
        assert "other_worker / DemoPass_123!" in output.getvalue()
        assert "other_client / DemoPass_123!" in output.getvalue()

    def test_seed_demo_data_is_idempotent(self):
        call_command("seed_demo_data")

        counts = {
            "companies": Company.objects.filter(slug__in=["demo-construction-crm", "northside-contractors"]).count(),
            "users": User.objects.filter(username__in=self.main_usernames + self.northside_usernames).count(),
            "teams": Team.objects.filter(name__in=[
                "Demo Field Team",
                "Finishing Crew",
                "Exterior Crew",
                "Northside Field Team",
            ]).count(),
            "projects": Project.objects.filter(name__in=self.main_project_names + self.northside_project_names).count(),
            "chat_rooms": ChatRoom.objects.filter(project__name__in=self.main_project_names + self.northside_project_names).count(),
            "worklogs": WorkLog.objects.count(),
            "transactions": Transaction.objects.count(),
            "reports": FinancialReport.objects.count(),
            "reviews": Review.objects.count(),
            "messages": ChatMessage.objects.count(),
            "notifications": Notification.objects.count(),
        }

        call_command("seed_demo_data")

        assert Company.objects.filter(slug__in=["demo-construction-crm", "northside-contractors"]).count() == counts["companies"]
        assert User.objects.filter(username__in=self.main_usernames + self.northside_usernames).count() == counts["users"]
        assert Team.objects.filter(name__in=[
            "Demo Field Team",
            "Finishing Crew",
            "Exterior Crew",
            "Northside Field Team",
        ]).count() == counts["teams"]
        assert Project.objects.filter(name__in=self.main_project_names + self.northside_project_names).count() == counts["projects"]
        assert ChatRoom.objects.filter(project__name__in=self.main_project_names + self.northside_project_names).count() == counts["chat_rooms"]
        assert WorkLog.objects.count() == counts["worklogs"]
        assert Transaction.objects.count() == counts["transactions"]
        assert FinancialReport.objects.count() == counts["reports"]
        assert Review.objects.count() == counts["reviews"]
        assert ChatMessage.objects.count() == counts["messages"]
        assert Notification.objects.count() == counts["notifications"]

        main_company = Company.objects.get(slug="demo-construction-crm")
        northside_company = Company.objects.get(slug="northside-contractors")

        self.assert_team_workers("Demo Field Team", main_company, ["demo_worker"])
        self.assert_team_workers("Finishing Crew", main_company, ["demo_worker", "demo_worker_2"])
        self.assert_team_workers("Exterior Crew", main_company, ["demo_worker_2"])
        self.assert_team_workers("Northside Field Team", northside_company, ["other_worker"])

        main_report = FinancialReport.objects.get(company=main_company)
        northside_report = FinancialReport.objects.get(company=northside_company)
        assert main_report.total_income == Decimal("23000.00")
        assert main_report.total_expenses == Decimal("5950.00")
        assert main_report.net_profit == Decimal("17050.00")
        assert northside_report.total_income == Decimal("12000.00")
        assert northside_report.total_expenses == Decimal("4100.00")
        assert northside_report.net_profit == Decimal("7900.00")

    def assert_team_workers(self, team_name, company, expected_usernames):
        team = Team.objects.get(name=team_name, company=company)
        usernames = set(team.workers.values_list("username", flat=True))
        assert usernames == set(expected_usernames)

    def test_seed_demo_data_removes_legacy_seed_rows(self):
        call_command("seed_demo_data")

        main_company = Company.objects.get(slug="demo-construction-crm")
        project = Project.objects.get(name="Lakeview Renovation", company=main_company)
        room = ChatRoom.objects.get(project=project)
        worker = User.objects.get(username="demo_worker")
        team = Team.objects.get(name="Demo Field Team", company=main_company)

        WorkLog.objects.create(
            worker=worker,
            team=team,
            project=project,
            hours_worked=1,
            description="site preparation"
        )
        Transaction.objects.create(
            company=main_company,
            transaction_type="income",
            amount=Decimal("15000.00"),
            description="Initial client deposit"
        )
        ChatMessage.objects.create(
            room=room,
            sender=worker,
            content="Framing work is complete and ready for inspection."
        )
        Notification.objects.create(
            company=main_company,
            recipient=worker,
            subject="Demo worklog reminder",
            message="Legacy notification",
            email_sent=False
        )

        call_command("seed_demo_data")

        report = FinancialReport.objects.get(company=main_company)
        assert not WorkLog.objects.filter(project=project, description="site preparation").exists()
        assert not Transaction.objects.filter(company=main_company, description="Initial client deposit").exists()
        assert not ChatMessage.objects.filter(room=room, content="Framing work is complete and ready for inspection.").exists()
        assert not Notification.objects.filter(company=main_company, subject="Demo worklog reminder").exists()
        assert report.total_income == Decimal("23000.00")
        assert report.total_expenses == Decimal("5950.00")
        assert report.net_profit == Decimal("17050.00")
