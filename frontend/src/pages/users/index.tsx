import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  deleteUser,
  getUsers,
  registerUser,
  updateUser,
  type UserProfile,
  type UserRole,
} from '../../entities/user';
import { useAuth } from '../../features/auth';
import { getApiErrorMessage } from '../../shared/api';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { Modal } from '../../shared/ui/modal';
import { PageShell } from '../../shared/ui/page-shell';
import {
  buildCreatePayload,
  buildUpdatePayload,
  canManageUser,
  type UserFormValues,
} from './model/users-helpers';
import { UserCards } from './ui/user-cards';
import { UserForm } from './ui/user-form';
import { UserTable } from './ui/user-table';
import { UsersDirectoryHeader } from './ui/users-directory-header';

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState('');

  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);
    setUsersError('');

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setUsersError(getApiErrorMessage(err, 'Users could not be loaded.'));
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => (
    roleFilter === 'all'
      ? users
      : users.filter((currentUser) => currentUser.role === roleFilter)
  ), [roleFilter, users]);

  async function handleCreateSubmit(values: UserFormValues) {
    await registerUser(buildCreatePayload(values));
    setNotice(`User "${values.username.trim()}" created.`);
    setIsCreateOpen(false);
    await loadUsers();
  }

  async function handleEditSubmit(values: UserFormValues) {
    if (!editingUser) {
      return;
    }

    const updated = await updateUser(editingUser.id, buildUpdatePayload(values));
    setUsers((current) => current.map((currentUser) => (
      currentUser.id === updated.id ? updated : currentUser
    )));
    setNotice(`User "${updated.username}" updated.`);
    setEditingUser(null);
  }

  async function handleDeleteUser() {
    if (!editingUser) {
      return;
    }

    const target = editingUser;
    await deleteUser(target.id);
    setUsers((current) => current.filter((currentUser) => currentUser.id !== target.id));
    setNotice(`User "${target.username}" deleted.`);
    setEditingUser(null);
  }

  function openCreate() {
    setNotice('');
    setEditingUser(null);
    setIsCreateOpen(true);
  }

  function openEdit(companyUser: UserProfile) {
    setNotice('');
    setIsCreateOpen(false);
    setEditingUser(companyUser);
  }

  return (
    <PageShell
      eyebrow="CRM USERS"
      title="Users"
      subtitle="Company users, manager account actions, and new account creation."
      width="wide"
      actions={(
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New User
        </button>
      )}
    >
      <section className="space-y-4">
        {notice && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
            {notice}
          </div>
        )}

        {isCreateOpen && (
          <div className="rounded-lg border border-gray-300 bg-white p-5 shadow-sm">
            <UserForm
              mode="create"
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateOpen(false)}
            />
          </div>
        )}

        <UsersDirectoryHeader
          roleFilter={roleFilter}
          showCounts={!isUsersLoading && !usersError}
          filteredCount={filteredUsers.length}
          totalCount={users.length}
          onRoleFilterChange={setRoleFilter}
        />

        {isUsersLoading && (
          <LoadingState title="Loading users" description="Fetching company users." />
        )}

        {!isUsersLoading && usersError && (
          <ErrorState title="Unable to load users" message={usersError} />
        )}

        {!isUsersLoading && !usersError && (
          <>
            <UserCards
              users={filteredUsers}
              currentUserId={user?.id}
              onEdit={openEdit}
            />

            <UserTable
              users={filteredUsers}
              currentUserId={user?.id}
              onEdit={openEdit}
            />
          </>
        )}
      </section>

      {editingUser && (
        <Modal size="2xl">
          <UserForm
            key={editingUser.id}
            mode="edit"
            user={editingUser}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingUser(null)}
            onDelete={handleDeleteUser}
            canDelete={canManageUser(editingUser, user?.id)}
            deleteDisabledReason="You cannot delete your own account."
          />
        </Modal>
      )}
    </PageShell>
  );
}
