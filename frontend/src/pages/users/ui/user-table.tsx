import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../../../entities/user';
import {
  DataTable,
  DataTableBody,
  DataTableEmptyRow,
  DataTableHeader,
  DataTableShell,
} from '../../../shared/ui/data-table';
import { canManageUser } from '../model/users-helpers';
import { RoleBadge } from './role-badge';

type UserTableProps = {
  users: UserProfile[];
  currentUserId: number | undefined;
  onEdit: (companyUser: UserProfile) => void;
};

export function UserTable({ users, currentUserId, onEdit }: UserTableProps) {
  return (
    <div className="hidden xl:block">
      <DataTableShell>
        <DataTable>
          <DataTableHeader>
            <tr>
              <th className="min-w-[10rem] px-4 py-4">Username</th>
              <th className="min-w-[15rem] px-4 py-4">Email</th>
              <th className="min-w-[8rem] px-4 py-4">Role</th>
              <th className="min-w-[10rem] px-4 py-4">Phone</th>
              <th className="min-w-[16rem] px-4 py-4">Address</th>
              <th className="min-w-[14rem] px-4 py-4">Company</th>
              <th className="min-w-[10rem] px-4 py-4">Actions</th>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {users.length === 0 && (
              <DataTableEmptyRow colSpan={7} message="No users match the selected role filter." />
            )}
            {users.map((companyUser) => (
              <tr key={companyUser.id}>
                <td className="min-w-[10rem] px-4 py-4 font-semibold text-gray-950">{companyUser.username}</td>
                <td className="min-w-[15rem] break-all px-4 py-4">{companyUser.email || 'Not set'}</td>
                <td className="min-w-[8rem] px-4 py-4">
                  <RoleBadge role={companyUser.role} />
                </td>
                <td className="min-w-[10rem] px-4 py-4">{companyUser.phone || 'Not set'}</td>
                <td className="min-w-[16rem] break-words px-4 py-4">{companyUser.address || 'Not set'}</td>
                <td className="min-w-[14rem] break-words px-4 py-4">{companyUser.company || 'Not assigned'}</td>
                <td className="min-w-[10rem] px-4 py-4">
                  {canManageUser(companyUser, currentUserId) ? (
                    <button
                      type="button"
                      onClick={() => onEdit(companyUser)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                  ) : companyUser.id === currentUserId ? (
                    <Link
                      to="/profile"
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTableBody>
        </DataTable>
      </DataTableShell>
    </div>
  );
}
