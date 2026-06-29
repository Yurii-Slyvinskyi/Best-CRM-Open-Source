import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/app-layout';
import { DashboardPage } from '../../pages/dashboard';
import { FinancePage } from '../../pages/finance';
import { ForbiddenPage } from '../../pages/forbidden';
import { NotificationsPage } from '../../pages/notifications';
import { PaymentsPage } from '../../pages/payments';
import { PaymentCancelPage } from '../../pages/payment-cancel';
import { PaymentSuccessPage } from '../../pages/payment-success';
import { ProfilePage } from '../../pages/profile';
import { ProjectDetailPage } from '../../pages/project-detail';
import { ProjectsPage } from '../../pages/projects';
import { ReviewsPage } from '../../pages/reviews';
import { SalariesPage } from '../../pages/salaries';
import { TeamsPage } from '../../pages/teams';
import { UsersPage } from '../../pages/users';
import { WorklogsPage } from '../../pages/worklogs';
import { LoginPage } from '../../pages/login';
import { AuthGuard, RouteGuard } from './route-guard';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={<RouteGuard routeId="dashboard"><DashboardPage /></RouteGuard>}
          />
          <Route
            path="/projects"
            element={<RouteGuard routeId="projects"><ProjectsPage /></RouteGuard>}
          />
          <Route
            path="/projects/:projectId"
            element={<RouteGuard routeId="projectDetail"><ProjectDetailPage /></RouteGuard>}
          />
          <Route
            path="/worklogs"
            element={<RouteGuard routeId="worklogs"><WorklogsPage /></RouteGuard>}
          />
          <Route
            path="/finance"
            element={<RouteGuard routeId="finance"><FinancePage /></RouteGuard>}
          />
          <Route
            path="/teams"
            element={<RouteGuard routeId="teams"><TeamsPage /></RouteGuard>}
          />
          <Route
            path="/users"
            element={<RouteGuard routeId="users"><UsersPage /></RouteGuard>}
          />
          <Route
            path="/profile"
            element={<RouteGuard routeId="profile"><ProfilePage /></RouteGuard>}
          />
          <Route
            path="/salaries"
            element={<RouteGuard routeId="salaries"><SalariesPage /></RouteGuard>}
          />
          <Route
            path="/payments"
            element={<RouteGuard routeId="payments"><PaymentsPage /></RouteGuard>}
          />
          <Route
            path="/reviews"
            element={<RouteGuard routeId="reviews"><ReviewsPage /></RouteGuard>}
          />
          <Route
            path="/notifications"
            element={<RouteGuard routeId="notifications"><NotificationsPage /></RouteGuard>}
          />
          <Route path="/success" element={<PaymentSuccessPage />} />
          <Route path="/cancel" element={<PaymentCancelPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
