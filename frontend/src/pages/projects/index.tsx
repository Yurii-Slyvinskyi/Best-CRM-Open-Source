import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import {
  createProject,
  getProjects,
  type Project,
  type ProjectFormPayload,
} from '../../entities/project';
import { getTeams, type Team } from '../../entities/team';
import { getUsers, hasRole, type UserProfile } from '../../entities/user';
import { useAuth } from '../../features/auth';
import { ProjectForm } from '../../features/project-form';
import { getApiErrorMessage } from '../../shared/api';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { Modal } from '../../shared/ui/modal';
import { PageShell } from '../../shared/ui/page-shell';
import { filterProjects } from './model/project-filters';
import { ProjectFilters } from './ui/project-filters';
import { ProjectGrid } from './ui/project-grid';

export function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const canFilterByClient = hasRole(user, 'manager');
  const canFilterByTeam = hasRole(user, 'manager');

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [projectsResult, usersResult, teamsResult] = await Promise.allSettled([
        getProjects(),
        hasRole(user, 'manager') ? getUsers() : Promise.resolve([]),
        canFilterByTeam ? getTeams() : Promise.resolve([]),
      ]);

      if (projectsResult.status === 'rejected') {
        throw projectsResult.reason;
      }

      setProjects(projectsResult.value);

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
      }

      if (teamsResult.status === 'fulfilled') {
        setTeams(teamsResult.value);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Projects could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [canFilterByTeam, user?.role]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreateProject(payload: ProjectFormPayload) {
    const project = await createProject(payload);
    setIsCreateOpen(false);
    setNotice(`Project "${project.name}" created.`);
    await loadProjects();
  }

  function resetFilters() {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setClientFilter('');
    setTeamFilter('');
  }

  function getClientLabel(clientId: number) {
    const client = users.find((currentUser) => currentUser.id === clientId);
    if (!client && user?.id === clientId) {
      return `${user.username} #${clientId}`;
    }

    return client ? `${client.username} #${client.id}` : `Client #${clientId}`;
  }

  function getTeamLabel(teamId: number) {
    const team = teams.find((currentTeam) => currentTeam.id === teamId);
    return team ? `${team.name} #${team.id}` : `Team #${teamId}`;
  }

  const clientFilterOptions = useMemo(() => (
    Array.from(new Set(projects.map((project) => project.client)))
      .sort((a, b) => a - b)
      .map((clientId) => ({
        value: String(clientId),
        label: getClientLabel(clientId),
      }))
  ), [projects, users]);

  const teamFilterOptions = useMemo(() => (
    Array.from(new Set(projects.flatMap((project) => project.assigned_team)))
      .sort((a, b) => a - b)
      .map((teamId) => ({
        value: String(teamId),
        label: getTeamLabel(teamId),
      }))
  ), [projects, teams]);

  const filteredProjects = useMemo(() => {
    return filterProjects(
      projects,
      {
        search,
        status: statusFilter,
        priority: priorityFilter,
        client: clientFilter,
        team: teamFilter,
      },
      canFilterByClient,
      canFilterByTeam,
    );
  }, [canFilterByClient, canFilterByTeam, clientFilter, priorityFilter, projects, search, statusFilter, teamFilter]);

  const hasActiveFilters = Boolean(
    search || statusFilter || priorityFilter || (canFilterByClient && clientFilter) || (canFilterByTeam && teamFilter),
  );

  return (
    <PageShell
      eyebrow="CRM PROJECTS"
      title="Projects"
      subtitle="All current and past construction projects across your teams."
      width="wide"
      actions={hasRole(user, 'manager') ? (
        <button
          type="button"
          onClick={() => {
            setNotice('');
            setIsCreateOpen(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New project
        </button>
      ) : undefined}
    >
      {notice && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
          {notice}
        </div>
      )}

      {isLoading && (
        <LoadingState
          title="Loading projects"
          description="Fetching the current project list."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load projects" message={error} />
      )}

      {!isLoading && !error && projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="There are no projects in your current backend scope yet."
        />
      )}

      {!isLoading && !error && projects.length > 0 && (
        <>
          <ProjectFilters
            search={search}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            clientFilter={clientFilter}
            teamFilter={teamFilter}
            canFilterByClient={canFilterByClient}
            canFilterByTeam={canFilterByTeam}
            clientOptions={clientFilterOptions}
            teamOptions={teamFilterOptions}
            hasActiveFilters={hasActiveFilters}
            filteredCount={filteredProjects.length}
            totalCount={projects.length}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onPriorityFilterChange={setPriorityFilter}
            onClientFilterChange={setClientFilter}
            onTeamFilterChange={setTeamFilter}
            onReset={resetFilters}
          />

          <ProjectGrid projects={filteredProjects} />
        </>
      )}

      {isCreateOpen && (
        <Modal size="3xl">
          <ProjectForm
            mode="create"
            onSubmit={handleCreateProject}
            onCancel={() => setIsCreateOpen(false)}
          />
        </Modal>
      )}
    </PageShell>
  );
}
