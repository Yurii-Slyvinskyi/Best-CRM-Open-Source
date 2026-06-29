import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '../../user';

export type AppRouteId =
  | 'dashboard'
  | 'projects'
  | 'projectDetail'
  | 'worklogs'
  | 'finance'
  | 'teams'
  | 'users'
  | 'profile'
  | 'salaries'
  | 'payments'
  | 'reviews'
  | 'notifications';

export type NavigationItem = {
  id: AppRouteId;
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
};
