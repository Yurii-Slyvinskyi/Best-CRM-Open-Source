import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { getProjects, type Project } from '../../entities/project';
import {
  createTeam,
  deleteTeam,
  getTeams,
  updateTeam,
  type Team,
  type TeamPayload,
} from '../../entities/team';
import { getUsers, type UserProfile } from '../../entities/user';
import { getApiErrorMessage } from '../../shared/api';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { Modal } from '../../shared/ui/modal';
import { PageShell } from '../../shared/ui/page-shell';
import { TeamFilters } from './ui/team-filters';
import { TeamForm } from './ui/team-form';
import { TeamTable } from './ui/team-table';

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [teamsResult, usersResult, projectsResult] = await Promise.allSettled([
        getTeams(),
        getUsers(),
        getProjects(),
      ]);

      if (teamsResult.status === 'rejected') {
        throw teamsResult.reason;
      }

      setTeams(teamsResult.value);

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
      }

      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Teams could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  function resetFilters() {
    setSearch('');
    setWorkerFilter('');
  }

  function openCreateForm() {
    setNotice('');
    setActionError('');
    setEditingTeam(null);
    setIsFormOpen(true);
  }

  function openEditForm(team: Team) {
    setNotice('');
    setActionError('');
    setEditingTeam(team);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingTeam(null);
  }

  async function handleSubmitTeam(payload: TeamPayload) {
    if (editingTeam) {
      const team = await updateTeam(editingTeam.id, payload);
      setNotice(`Team "${team.name}" updated.`);
    } else {
      const team = await createTeam(payload);
      setNotice(`Team "${team.name}" created.`);
    }

    closeForm();
    await loadTeams();
  }

  async function handleDeleteTeam(team: Team) {
    setDeletingId(team.id);
    setActionError('');
    setNotice('');

    try {
      await deleteTeam(team.id);
      setPendingDeleteId(null);
      setNotice(`Team "${team.name}" deleted.`);
      await loadTeams();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Team could not be deleted.'));
    } finally {
      setDeletingId(null);
    }
  }

  // Only `worker` accounts are relevant for worker labels/options on this view.
  const workerUsers = useMemo(
    () => users.filter((currentUser) => currentUser.role === 'worker'),
    [users],
  );

  const workersById = useMemo(() => {
    const map = new Map<number, UserProfile>();
    workerUsers.forEach((worker) => map.set(worker.id, worker));
    return map;
  }, [workerUsers]);

  function getWorkerLabel(workerId: number) {
    const worker = workersById.get(workerId);
    return worker ? `${worker.username} #${worker.id}` : `Worker #${workerId}`;
  }

  function getProjectName(project: Project) {
    return project.name || `Project #${project.id}`;
  }

  function getTeamProjects(teamId: number) {
    return projects.filter((project) => project.assigned_team.includes(teamId));
  }

  const workerFilterOptions = useMemo(() => {
    const teamWorkerIds = new Set(teams.flatMap((team) => team.workers));
    return workerUsers
      .filter((worker) => teamWorkerIds.has(worker.id))
      .sort((a, b) => a.id - b.id)
      .map((worker) => ({
        value: String(worker.id),
        label: `${worker.username} #${worker.id}`,
      }));
  }, [teams, workerUsers]);

  const filteredTeams = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return teams.filter((team) => {
      const workerLabels = team.workers.map(getWorkerLabel);
      const projectNames = getTeamProjects(team.id).map(getProjectName);
      const matchesSearch = !normalizedSearch || [
        team.name,
        ...workerLabels,
        ...projectNames,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesWorker = !workerFilter || team.workers.includes(Number(workerFilter));

      return matchesSearch && matchesWorker;
    });
  }, [projects, search, teams, workerFilter, workersById]);

  const hasActiveFilters = Boolean(search || workerFilter);

  return (
    <PageShell
      eyebrow="CRM TEAMS"
      title="Teams"
      subtitle="Manager view for field team assignments and worker coverage."
      width="wide"
      actions={(
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New team
        </button>
      )}
    >
      {notice && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
          {notice}
        </div>
      )}

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {actionError}
        </div>
      )}

      {isLoading && (
        <LoadingState
          title="Loading teams"
          description="Fetching crews, workers, and project coverage."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load teams" message={error} />
      )}

      {!isLoading && !error && teams.length === 0 && (
        <EmptyState
          icon={Users}
          title="No teams found"
          description="There are no teams in your current backend scope yet."
        />
      )}

      {!isLoading && !error && teams.length > 0 && (
        <>
          <TeamFilters
            search={search}
            workerFilter={workerFilter}
            workerOptions={workerFilterOptions}
            hasActiveFilters={hasActiveFilters}
            filteredCount={filteredTeams.length}
            totalCount={teams.length}
            onSearchChange={setSearch}
            onWorkerFilterChange={setWorkerFilter}
            onReset={resetFilters}
          />

          <TeamTable
            teams={filteredTeams}
            pendingDeleteId={pendingDeleteId}
            deletingId={deletingId}
            getWorkerLabel={getWorkerLabel}
            getProjectName={getProjectName}
            getTeamProjects={getTeamProjects}
            onEdit={openEditForm}
            onDelete={handleDeleteTeam}
            onDeletePrompt={(teamId) => {
              setActionError('');
              setPendingDeleteId(teamId);
            }}
            onDeleteCancel={() => setPendingDeleteId(null)}
          />
        </>
      )}

      {isFormOpen && (
        <Modal size="2xl">
          <TeamForm
            mode={editingTeam ? 'edit' : 'create'}
            team={editingTeam}
            workers={workerUsers}
            onSubmit={handleSubmitTeam}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </PageShell>
  );
}
