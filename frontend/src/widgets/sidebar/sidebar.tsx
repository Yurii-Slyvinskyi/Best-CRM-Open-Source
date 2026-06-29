import { Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationItems, type NavigationItem } from '../../entities/navigation';
import { hasRole } from '../../entities/user';
import { useAuth } from '../../features/auth';
import { roleLabels } from '../../shared/config/roles';
import { cn } from '../../shared/lib/cn';

const navigationSections: Array<{ label: string; itemIds: NavigationItem['id'][] }> = [
  { label: 'Main', itemIds: ['dashboard', 'projects', 'worklogs'] },
  { label: 'Finance', itemIds: ['finance', 'salaries', 'payments'] },
  { label: 'People', itemIds: ['teams', 'users'] },
  { label: 'Other', itemIds: ['reviews', 'notifications'] },
];

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return null;
  }

  const profileInitials = user.username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';
  const items = navigationItems.filter((item) => hasRole(user, item.roles));
  const sectionItemIds = new Set(navigationSections.flatMap((section) => section.itemIds));
  const sections = navigationSections
    .map((section) => ({
      ...section,
      items: items.filter((item) => section.itemIds.includes(item.id)),
    }))
    .filter((section) => section.items.length > 0);
  const ungroupedItems = items.filter((item) => !sectionItemIds.has(item.id));

  if (ungroupedItems.length > 0) {
    sections.push({ label: 'More', itemIds: [], items: ungroupedItems });
  }

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isProjectActive = item.path === '/projects' && location.pathname.startsWith('/projects');

    return (
      <NavLink
        key={`${item.path}-${item.label}`}
        to={item.path}
        className={({ isActive }) => cn(
          'flex h-[42px] shrink-0 items-center gap-[11px] rounded-[5px] px-[11px] text-[13.5px] font-medium tracking-normal transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ECF1FC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1F26] lg:w-full',
          isActive || isProjectActive
            ? 'bg-[rgba(47,84,201,0.16)] font-semibold text-white'
            : 'text-[#9AA0AC] hover:bg-[#262A33] hover:text-[#E6E8EC]',
        )}
      >
        <Icon className="h-[19px] w-[19px] shrink-0" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="border-b border-[#2A2E37] bg-[#1C1F26] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[232px] lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex min-h-16 items-center gap-3 border-b border-[#2A2E37] px-4 py-3 lg:min-h-0 lg:border-b-0 lg:px-3 lg:pb-[18px] lg:pt-4">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-[#2F54C9] text-[13px] font-bold text-white">
          C
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-bold tracking-normal text-white">Construction CRM</p>
          <p className="mt-1 truncate text-[11.5px] font-medium text-[#7A828F]">Portfolio workspace</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-3 lg:py-0">
        {sections.map((section, sectionIndex) => (
          <div key={section.label} className="contents lg:block">
            <div
              className={cn(
                'hidden px-[10px] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5C6270] lg:mb-1 lg:block',
                sectionIndex === 0 ? 'lg:mt-1' : 'lg:mt-4',
              )}
            >
              {section.label}
            </div>
            <div className="contents lg:flex lg:flex-col lg:gap-1">
              {section.items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#2A2E37] px-3 py-3 lg:mt-auto">
        <NavLink
          to="/profile"
          className={({ isActive }) => cn(
            'grid w-full grid-cols-[34px_minmax(0,1fr)_19px] items-center gap-[11px] rounded-[5px] px-[8px] py-[5px] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ECF1FC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1F26]',
            isActive ? 'bg-[rgba(47,84,201,0.16)]' : 'hover:bg-[#262A33]',
          )}
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[5px] bg-[#334052] text-[13px] font-bold leading-none text-white">
            {profileInitials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold leading-5 text-white">
              {user.username}
            </span>
            <span className="block truncate text-[11.5px] font-medium leading-4 text-[#9AA0AC]">
              {roleLabels[user.role]}
            </span>
          </span>
          <Settings className="h-[19px] w-[19px] text-[#9AA0AC]" aria-hidden="true" />
        </NavLink>
      </div>
    </aside>
  );
}
