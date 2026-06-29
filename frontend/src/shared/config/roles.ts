export type UserRole = 'manager' | 'worker' | 'client';

export const roleLabels: Record<UserRole, string> = {
  manager: 'Manager',
  worker: 'Worker',
  client: 'Client',
};

export const roleBadgeClasses: Record<UserRole, string> = {
  manager: 'border-blue-600 bg-blue-50 text-blue-800',
  worker: 'border-gray-300 bg-white text-gray-800',
  client: 'border-gray-300 bg-white text-gray-800',
};
