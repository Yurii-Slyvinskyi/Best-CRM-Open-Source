import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FolderKanban,
  MessageSquareText,
  UserCircle,
  Users,
} from 'lucide-react';
import {
  getFinancialReports,
  type FinancialReport,
} from '../../entities/finance';
import { getUnreadNotificationsCount } from '../../entities/notification';
import { getProjects, searchProjects, type Project } from '../../entities/project';
import { type UserRole } from '../../entities/user';
import { useAuth } from '../../features/auth';
import { getApiErrorMessage } from '../../shared/api';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { PageShell } from '../../shared/ui/page-shell';
import {
  getFinanceTotalsByCurrency,
  getHighPriorityProjects,
  getLatestReport,
  getOverdueProjects,
  getProjectStatusCounts,
} from './model/dashboard-helpers';
import { AttentionList } from './ui/attention-list';
import { DashboardSearch } from './ui/dashboard-search';
import { FinanceSummary } from './ui/finance-summary';
import { ProjectStatusSummary } from './ui/project-status-summary';
import { QuickActions, type DashboardQuickAction } from './ui/quick-actions';

type OptionalFailure = {
  label: string;
};

function getRoleLabel(role: UserRole | undefined) {
  if (!role) {
    return 'User';
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getOptionalFailure(label: string, result: PromiseSettledResult<unknown>) {
  return result.status === 'rejected' ? { label } : null;
}

export function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [optionalFailures, setOptionalFailures] = useState<OptionalFailure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const role = user?.role;
  const isManager = role === 'manager';
  const isWorker = role === 'worker';

  const loadDashboard = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setOptionalFailures([]);

    try {
      const [projectsResult, unreadCountResult] = await Promise.allSettled([
        getProjects(),
        getUnreadNotificationsCount(),
      ]);

      if (projectsResult.status === 'rejected') {
        throw projectsResult.reason;
      }

      const failures = [
        getOptionalFailure('Unread notifications', unreadCountResult),
      ].filter(Boolean) as OptionalFailure[];

      setProjects(projectsResult.value);
      setUnreadNotificationsCount(
        unreadCountResult.status === 'fulfilled' ? unreadCountResult.value.count : 0,
      );
      setFinancialReports([]);

      if (role === 'manager') {
        const [financialReportsResult] = await Promise.allSettled([getFinancialReports()]);

        const reportFailure = getOptionalFailure('Finance reports', financialReportsResult);
        if (reportFailure) {
          failures.push(reportFailure);
        }

        setFinancialReports(
          financialReportsResult.status === 'fulfilled' ? financialReportsResult.value : [],
        );
      }

      setOptionalFailures(failures);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Projects could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, role, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const projectCounts = useMemo(() => getProjectStatusCounts(projects), [projects]);
  const highPriorityProjects = useMemo(() => getHighPriorityProjects(projects), [projects]);
  const overdueProjects = useMemo(() => getOverdueProjects(projects), [projects]);
  const searchResults = useMemo(() => searchProjects(projects, search), [projects, search]);
  const latestReport = useMemo(() => getLatestReport(financialReports), [financialReports]);
  const financeTotalsByCurrency = useMemo(() => (
    getFinanceTotalsByCurrency(latestReport)
  ), [latestReport]);

  const quickActions = useMemo<DashboardQuickAction[]>(() => {
    if (isManager) {
      return [
        {
          icon: FolderKanban,
          label: 'Projects',
          description: 'Review and manage project delivery.',
          to: '/projects',
        },
        {
          icon: ClipboardList,
          label: 'Worklogs',
          description: 'Inspect hours logged by teams and workers.',
          to: '/worklogs',
        },
        {
          icon: Users,
          label: 'Teams',
          description: 'Manage worker assignments by team.',
          to: '/teams',
        },
        {
          icon: CircleDollarSign,
          label: 'Finance',
          description: 'Open payments, transactions, salaries, and reports.',
          to: '/finance',
        },
      ];
    }

    if (isWorker) {
      return [
        {
          icon: FolderKanban,
          label: 'Projects',
          description: 'Open projects assigned or visible to you.',
          to: '/projects',
        },
        {
          icon: ClipboardList,
          label: 'Worklogs',
          description: 'Create and review your worklog entries.',
          to: '/worklogs',
        },
        {
          icon: UserCircle,
          label: 'Profile',
          description: 'Review your account and contact details.',
          to: '/profile',
        },
      ];
    }

    return [
      {
        icon: FolderKanban,
        label: 'Projects',
        description: 'Review your project status and details.',
        to: '/projects',
      },
      {
        icon: CreditCard,
        label: 'Payments',
        description: 'View payment status and checkout links.',
        to: '/payments',
      },
      {
        icon: MessageSquareText,
        label: 'Reviews',
        description: 'Manage project reviews.',
        to: '/reviews',
      },
      {
        icon: UserCircle,
        label: 'Profile',
        description: 'Update your account and contact details.',
        to: '/profile',
      },
    ];
  }, [isManager, isWorker]);

  return (
    <PageShell
      eyebrow="CRM operations"
      title={`Welcome, ${user?.username ?? 'there'}`}
      subtitle={`${getRoleLabel(role)} dashboard for finding projects, finance, and attention items.`}
      width="wide"
    >
      {isLoading && (
        <LoadingState
          title="Loading dashboard"
          description="Fetching projects and role-specific operational data."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load dashboard" message={error} />
      )}

      {!isLoading && !error && (
        <div className="space-y-5">
          <DashboardSearch
            query={search}
            results={searchResults}
            onQueryChange={setSearch}
          />

          {optionalFailures.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Some optional dashboard data is unavailable: {optionalFailures.map((failure) => failure.label).join(', ')}.
            </div>
          )}

          <QuickActions actions={quickActions} />

          {isManager && (
            <FinanceSummary
              totalsByCurrency={financeTotalsByCurrency}
              generatedAt={latestReport?.generated_at}
              isUnavailable={optionalFailures.some((failure) => failure.label === 'Finance reports')}
            />
          )}

          <ProjectStatusSummary
            total={projectCounts.total}
            active={projectCounts.active}
            completed={projectCounts.completed}
            highPriority={projectCounts.highPriority}
          />

          <AttentionList
            highPriorityProjects={highPriorityProjects}
            overdueProjects={overdueProjects}
            unreadNotificationsCount={unreadNotificationsCount}
          />
        </div>
      )}
    </PageShell>
  );
}
