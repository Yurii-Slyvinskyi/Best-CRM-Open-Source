import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../../../entities/user';
import { canManageUser } from '../model/users-helpers';
import { RoleBadge } from './role-badge';
import { UserDetailItem } from './user-detail-item';

type UserCardsProps = {
  users: UserProfile[];
  currentUserId: number | undefined;
  onEdit: (companyUser: UserProfile) => void;
};

export function UserCards({ users, currentUserId, onEdit }: UserCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:hidden">
      {users.length === 0 && (
        <div className="rounded-lg border border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-600 shadow-sm md:col-span-2">
          No users match the selected role filter.
        </div>
      )}

      {users.map((companyUser) => (
        <article key={companyUser.id} className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-base font-semibold text-gray-950">{companyUser.username}</h3>
              <p className="mt-1 break-all text-sm leading-6 text-gray-600">{companyUser.email || 'Not set'}</p>
            </div>
            <RoleBadge role={companyUser.role} />
          </div>

          <dl className="mt-4 space-y-3 rounded-md border border-gray-100 bg-gray-50 p-3">
            <UserDetailItem label="Phone" value={companyUser.phone || 'Not set'} />
            <UserDetailItem label="Address" value={companyUser.address || 'Not set'} />
            <UserDetailItem label="Company" value={companyUser.company || 'Not assigned'} />
          </dl>

          {canManageUser(companyUser, currentUserId) ? (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => onEdit(companyUser)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </button>
            </div>
          ) : companyUser.id === currentUserId ? (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <Link
                to="/profile"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Link>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
