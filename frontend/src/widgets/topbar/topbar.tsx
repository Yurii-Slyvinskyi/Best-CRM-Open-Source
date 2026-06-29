import { Fragment, useEffect, useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { navigationItems } from '../../entities/navigation';
import { getUnreadNotificationsCount } from '../../entities/notification';
import { LogoutButton } from '../../features/logout';
import { useAuth } from '../../features/auth';

type Breadcrumb = {
  label: string;
  to?: string;
};

function toTitle(segment: string) {
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] === 'dashboard') {
    return [{ label: 'Dashboard' }];
  }

  const [section, detail] = segments;
  const match = navigationItems.find((item) => item.path === `/${section}`);
  const sectionLabel = match?.label ?? toTitle(section);
  const crumbs: Breadcrumb[] = [{ label: 'Dashboard', to: '/dashboard' }];

  if (detail) {
    const singularLabel = sectionLabel.replace(/s$/, '');
    crumbs.push({ label: sectionLabel, to: `/${section}` });
    crumbs.push({ label: `${singularLabel} #${detail}` });
  } else {
    crumbs.push({ label: sectionLabel });
  }

  return crumbs;
}

export function Topbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }

    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const result = await getUnreadNotificationsCount();

        if (isMounted) {
          setUnreadCount(result.count);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  const breadcrumbs = buildBreadcrumbs(location.pathname);

  return (
    <header className="border-b border-gray-300 bg-white shadow-sm">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
        <nav className="flex min-w-0 items-center gap-2 text-[13.5px]" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && (
                  <ChevronRight className="h-[18px] w-[18px] shrink-0 text-gray-300" aria-hidden="true" />
                )}
                {isLast || !crumb.to ? (
                  <span className="truncate font-semibold text-gray-950" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.to} className="shrink-0 text-gray-400 transition hover:text-gray-600">
                    {crumb.label}
                  </Link>
                )}
              </Fragment>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/notifications"
            className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
