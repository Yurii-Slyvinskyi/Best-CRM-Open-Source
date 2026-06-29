import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../../widgets/sidebar';
import { Topbar } from '../../../widgets/topbar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-200 text-gray-900">
      <div className="lg:flex">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
