import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { getProjects, type Project } from '../../entities/project';
import { getTeams, type Team } from '../../entities/team';
import { getUsers, hasRole, type UserProfile } from '../../entities/user';
import {
  createWorklog,
  deleteWorklog,
  getWorklogs,
  updateWorklog,
  type Worklog,
} from '../../entities/worklog';
import { useAuth } from '../../features/auth';
import { getApiErrorMessage } from '../../shared/api';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { PageShell } from '../../shared/ui/page-shell';
import {
  buildWorklogPayload,
  getInitialCreateValues,
  getInitialEditValues,
  validateWorklogForm,
  type WorklogFormErrors,
  type WorklogFormValues,
} from './model/worklog-form';
import { WorklogFilters } from './ui/worklog-filters';
import { WorklogFormModal } from './ui/worklog-form-modal';
import { WorklogTable } from './ui/worklog-table';

export function WorklogsPage() {
  const { user } = useAuth();
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState(getInitialCreateValues);
  const [createErrors, setCreateErrors] = useState<WorklogFormErrors>({});
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorklog, setEditingWorklog] = useState<Worklog | null>(null);
  const [editValues, setEditValues] = useState(getInitialCreateValues);
  const [editErrors, setEditErrors] = useState<WorklogFormErrors>({});
  const [editError, setEditError] = useState('');
  const [savingEditId, setSavingEditId] = useState<number | null>(null);
  const [deletingWorklogId, setDeletingWorklogId] = useState<number | null>(null);
  const canFilterByWorker = hasRole(user, 'manager');
  const isManager = hasRole(user, 'manager');

  const loadWorklogs = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [worklogsResult, projectsResult, teamsResult, usersResult] = await Promise.allSettled([
        getWorklogs(),
        getProjects(),
        getTeams(),
        hasRole(user, 'manager') ? getUsers() : Promise.resolve([]),
      ]);

      if (worklogsResult.status === 'rejected') {
        throw worklogsResult.reason;
      }

      if (projectsResult.status === 'rejected') {
        throw projectsResult.reason;
      }

      if (teamsResult.status === 'rejected') {
        throw teamsResult.reason;
      }

      if (usersResult.status === 'rejected') {
        throw usersResult.reason;
      }

      setWorklogs(worklogsResult.value);
      setProjects(projectsResult.value);
      setTeams(teamsResult.value);
      setUsers(usersResult.value);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Worklogs could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadWorklogs();
  }, [loadWorklogs]);

  const projectById = useMemo(() => new Map(
    projects.map((project) => [project.id, project]),
  ), [projects]);

  const teamById = useMemo(() => new Map(
    teams.map((team) => [team.id, team]),
  ), [teams]);

  const userById = useMemo(() => new Map(
    users.map((currentUser) => [currentUser.id, currentUser]),
  ), [users]);

  function getWorkerLabel(workerId: number) {
    const worker = userById.get(workerId);

    if (!worker && user?.id === workerId) {
      return user.username;
    }

    return worker ? worker.username : `Worker #${workerId}`;
  }

  function getProjectLabel(projectId: number) {
    const project = projectById.get(projectId);
    return project ? project.name : `Project #${projectId}`;
  }

  function getTeamLabel(teamId: number) {
    const team = teamById.get(teamId);
    return team ? team.name : `Team #${teamId}`;
  }

  const projectFilterOptions = useMemo(() => (
    Array.from(new Set(worklogs.map((worklog) => worklog.project)))
      .sort((a, b) => a - b)
      .map((projectId) => ({
        value: String(projectId),
        label: getProjectLabel(projectId),
      }))
  ), [projectById, worklogs]);

  const teamFilterOptions = useMemo(() => (
    Array.from(new Set(worklogs.map((worklog) => worklog.team)))
      .sort((a, b) => a - b)
      .map((teamId) => ({
        value: String(teamId),
        label: getTeamLabel(teamId),
      }))
  ), [teamById, worklogs]);

  const workerFilterOptions = useMemo(() => (
    Array.from(new Set(worklogs.map((worklog) => worklog.worker)))
      .sort((a, b) => a - b)
      .map((workerId) => ({
        value: String(workerId),
        label: getWorkerLabel(workerId),
      }))
  ), [user?.id, user?.username, userById, worklogs]);

  const workerCreateOptions = useMemo(() => (
    users
      .filter((currentUser) => currentUser.role === 'worker')
      .sort((a, b) => a.username.localeCompare(b.username))
  ), [users]);

  const activeProjectOptions = useMemo(() => (
    projects
      .filter((project) => project.status !== 'completed')
      .sort((a, b) => a.name.localeCompare(b.name))
  ), [projects]);

  const selectedCreateProject = useMemo(() => (
    createValues.project
      ? projectById.get(Number(createValues.project)) ?? null
      : null
  ), [createValues.project, projectById]);

  const selectedEditProject = useMemo(() => (
    editValues.project
      ? projectById.get(Number(editValues.project)) ?? null
      : null
  ), [editValues.project, projectById]);

  const availableCreateTeams = useMemo(() => (
    teams
      .filter((team) => {
        const matchesProject = !selectedCreateProject || selectedCreateProject.assigned_team.includes(team.id);
        const matchesWorker = !isManager || !createValues.worker || team.workers.includes(Number(createValues.worker));

        return matchesProject && matchesWorker;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  ), [createValues.worker, isManager, selectedCreateProject, teams]);

  const availableEditTeams = useMemo(() => (
    teams
      .filter((team) => {
        const matchesProject = !selectedEditProject || selectedEditProject.assigned_team.includes(team.id);
        const matchesWorker = !isManager || !editValues.worker || team.workers.includes(Number(editValues.worker));

        return matchesProject && matchesWorker;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  ), [editValues.worker, isManager, selectedEditProject, teams]);

  useEffect(() => {
    if (
      createValues.team
      && !availableCreateTeams.some((team) => team.id === Number(createValues.team))
    ) {
      setCreateValues((current) => ({
        ...current,
        team: '',
      }));
    }
  }, [availableCreateTeams, createValues.team]);

  useEffect(() => {
    if (
      editValues.team
      && !availableEditTeams.some((team) => team.id === Number(editValues.team))
    ) {
      setEditValues((current) => ({
        ...current,
        team: '',
      }));
    }
  }, [availableEditTeams, editValues.team]);

  const filteredWorklogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return worklogs.filter((worklog) => {
      const workerLabel = getWorkerLabel(worklog.worker);
      const projectLabel = getProjectLabel(worklog.project);
      const teamLabel = getTeamLabel(worklog.team);
      const description = worklog.description ?? '';
      const matchesSearch = !normalizedSearch || [
        description,
        workerLabel,
        projectLabel,
        teamLabel,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesProject = !projectFilter || String(worklog.project) === projectFilter;
      const matchesTeam = !isManager || !teamFilter || String(worklog.team) === teamFilter;
      const matchesWorker = !canFilterByWorker || !workerFilter || String(worklog.worker) === workerFilter;
      const matchesDate = !dateFilter || worklog.date === dateFilter;

      return matchesSearch && matchesProject && matchesTeam && matchesWorker && matchesDate;
    });
  }, [
    canFilterByWorker,
    dateFilter,
    isManager,
    projectById,
    projectFilter,
    search,
    teamById,
    teamFilter,
    user?.id,
    user?.username,
    userById,
    workerFilter,
    worklogs,
  ]);

  const hasActiveFilters = Boolean(
    search || projectFilter || dateFilter || (isManager && (teamFilter || workerFilter)),
  );

  function resetFilters() {
    setSearch('');
    setProjectFilter('');
    setTeamFilter('');
    setWorkerFilter('');
    setDateFilter('');
  }

  function updateCreateField(field: keyof WorklogFormValues, value: string) {
    setCreateValues((current) => ({
      ...current,
      [field]: value,
    }));
    setCreateErrors((current) => ({
      ...current,
      [field]: '',
    }));
  }

  function closeCreateForm() {
    setIsCreateOpen(false);
    setCreateValues(getInitialCreateValues());
    setCreateErrors({});
    setCreateError('');
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateWorklogForm(createValues, isManager);

    if (Object.values(validationErrors).some(Boolean)) {
      setCreateErrors(validationErrors);
      return;
    }

    setIsCreating(true);
    setCreateError('');
    setCreateErrors({});
    setNotice('');

    try {
      await createWorklog(buildWorklogPayload(createValues, isManager));
      closeCreateForm();
      setNotice('Worklog created.');
      await loadWorklogs();
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Worklog could not be created.'));
    } finally {
      setIsCreating(false);
    }
  }

  function updateEditField(field: keyof WorklogFormValues, value: string) {
    setEditValues((current) => ({
      ...current,
      [field]: value,
    }));
    setEditErrors((current) => ({
      ...current,
      [field]: '',
    }));
  }

  function openEditForm(worklog: Worklog) {
    const worklogProject = projectById.get(worklog.project);

    if (worklogProject?.status === 'completed') {
      setNotice('Completed project worklogs cannot be edited.');
      return;
    }

    setEditingWorklog(worklog);
    setEditValues(getInitialEditValues(worklog));
    setEditErrors({});
    setEditError('');
    setNotice('');
  }

  function closeEditForm() {
    setEditingWorklog(null);
    setEditValues(getInitialCreateValues());
    setEditErrors({});
    setEditError('');
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingWorklog) {
      return;
    }

    const validationErrors = validateWorklogForm(editValues, isManager);

    if (Object.values(validationErrors).some(Boolean)) {
      setEditErrors(validationErrors);
      return;
    }

    setSavingEditId(editingWorklog.id);
    setEditError('');
    setEditErrors({});
    setNotice('');

    try {
      await updateWorklog(editingWorklog.id, buildWorklogPayload(editValues, isManager));
      closeEditForm();
      setNotice('Worklog updated.');
      await loadWorklogs();
    } catch (err) {
      setEditError(getApiErrorMessage(err, 'Worklog could not be updated.'));
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleDeleteWorklog(worklog: Worklog) {
    const confirmed = window.confirm(`Delete worklog #${worklog.id}?`);

    if (!confirmed) {
      return;
    }

    setDeletingWorklogId(worklog.id);
    setNotice('');

    try {
      await deleteWorklog(worklog.id);
      setNotice('Worklog deleted.');
      await loadWorklogs();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Worklog could not be deleted.'));
    } finally {
      setDeletingWorklogId(null);
    }
  }

  return (
    <PageShell
      eyebrow="CRM WORKLOGS"
      title="Worklogs"
      subtitle="Hours and field notes for active project work."
      width="wide"
      actions={(
        <button
          type="button"
          onClick={() => {
            setNotice('');
            setCreateError('');
            setCreateErrors({});
            setIsCreateOpen(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New worklog
        </button>
      )}
    >
      {notice && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
          {notice}
        </div>
      )}

      {isLoading && (
        <LoadingState
          title="Loading worklogs"
          description="Fetching worklog rows, projects, teams, and available worker labels."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load worklogs" message={error} />
      )}

      {!isLoading && !error && worklogs.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No worklogs found"
          description="There are no worklog rows in your current backend scope yet."
        />
      )}

      {!isLoading && !error && worklogs.length > 0 && (
        <>
          <WorklogFilters
            search={search}
            projectFilter={projectFilter}
            teamFilter={teamFilter}
            workerFilter={workerFilter}
            dateFilter={dateFilter}
            projectOptions={projectFilterOptions}
            teamOptions={teamFilterOptions}
            workerOptions={workerFilterOptions}
            isManager={isManager}
            canFilterByWorker={canFilterByWorker}
            hasActiveFilters={hasActiveFilters}
            filteredCount={filteredWorklogs.length}
            totalCount={worklogs.length}
            onSearchChange={setSearch}
            onProjectFilterChange={setProjectFilter}
            onTeamFilterChange={setTeamFilter}
            onWorkerFilterChange={setWorkerFilter}
            onDateFilterChange={setDateFilter}
            onReset={resetFilters}
          />

          <WorklogTable
            worklogs={filteredWorklogs}
            projectById={projectById}
            savingEditId={savingEditId}
            deletingWorklogId={deletingWorklogId}
            getWorkerLabel={getWorkerLabel}
            getProjectLabel={getProjectLabel}
            getTeamLabel={getTeamLabel}
            onEdit={openEditForm}
            onDelete={handleDeleteWorklog}
          />
        </>
      )}

      {isCreateOpen && (
        <WorklogFormModal
          eyebrow="New worklog"
          title="Create worklog"
          description="Record hours against an active project and an available team."
          values={createValues}
          errors={createErrors}
          formError={createError}
          isManager={isManager}
          isSubmitting={isCreating}
          submitLabel="Create worklog"
          submitPendingLabel="Creating..."
          workerOptions={workerCreateOptions}
          projectOptions={activeProjectOptions}
          teamOptions={availableCreateTeams}
          onFieldChange={updateCreateField}
          onSubmit={handleCreateSubmit}
          onCancel={closeCreateForm}
        />
      )}

      {editingWorklog && (
        <WorklogFormModal
          eyebrow="Edit worklog"
          title={`Update worklog #${editingWorklog.id}`}
          description="Update hours, notes, project, and team assignment within your backend scope."
          values={editValues}
          errors={editErrors}
          formError={editError}
          isManager={isManager}
          isSubmitting={savingEditId === editingWorklog.id}
          submitLabel="Save changes"
          submitPendingLabel="Saving..."
          workerOptions={workerCreateOptions}
          projectOptions={activeProjectOptions}
          teamOptions={availableEditTeams}
          onFieldChange={updateEditField}
          onSubmit={handleEditSubmit}
          onCancel={closeEditForm}
        />
      )}
    </PageShell>
  );
}
