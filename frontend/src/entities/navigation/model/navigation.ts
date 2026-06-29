import {
  Bell,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FolderKanban,
  Gauge,
  MessageSquareText,
  ReceiptText,
  Users,
} from 'lucide-react';
import type { AppRouteId, NavigationItem } from './types';
import type { UserRole } from '../../user';

const allRoles: UserRole[] = ['manager', 'worker', 'client'];

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: Gauge,
    roles: allRoles,
  },
  {
    id: 'projects',
    label: 'Projects',
    path: '/projects',
    icon: FolderKanban,
    roles: allRoles,
  },
  {
    id: 'worklogs',
    label: 'Worklogs',
    path: '/worklogs',
    icon: ClipboardList,
    roles: ['manager'],
  },
  {
    id: 'worklogs',
    label: 'My Worklogs',
    path: '/worklogs',
    icon: ClipboardList,
    roles: ['worker'],
  },
  {
    id: 'finance',
    label: 'Finance',
    path: '/finance',
    icon: CircleDollarSign,
    roles: ['manager'],
  },
  {
    id: 'teams',
    label: 'Teams',
    path: '/teams',
    icon: Users,
    roles: ['manager'],
  },
  {
    id: 'users',
    label: 'Users',
    path: '/users',
    icon: BriefcaseBusiness,
    roles: ['manager'],
  },
  {
    id: 'salaries',
    label: 'Salaries',
    path: '/salaries',
    icon: ReceiptText,
    roles: ['worker'],
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/payments',
    icon: CreditCard,
    roles: ['client'],
  },
  {
    id: 'reviews',
    label: 'Reviews',
    path: '/reviews',
    icon: MessageSquareText,
    roles: ['client'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    roles: allRoles,
  },
];

export const routeAccess: Record<AppRouteId, UserRole[]> = {
  dashboard: allRoles,
  projects: allRoles,
  projectDetail: allRoles,
  worklogs: ['manager', 'worker'],
  finance: ['manager'],
  teams: ['manager'],
  users: ['manager'],
  profile: allRoles,
  salaries: ['worker'],
  payments: ['client'],
  reviews: ['client'],
  notifications: allRoles,
};
