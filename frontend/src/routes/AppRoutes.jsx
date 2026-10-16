import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoadingScreen from '../components/ui/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import AuthLayout from '../layouts/AuthLayout'
import AppShell from '../layouts/AppShell'
import NotFoundPage from '../pages/NotFoundPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import { homePathForRole, ROLES } from '../utils/constants'

/*
 * Route-level code splitting: page components load on demand so the initial
 * bundle stays small. Shared shells (AppShell, AuthLayout), route guards and
 * the 404/unauthorized pages stay eager. Suspense fallbacks render inside the
 * shells; lazy-load failures are caught by RouteErrorBoundary.
 */
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const FarmerDashboardPage = lazy(() => import('../pages/farmer/FarmerDashboardPage'))
const FarmerAccountPage = lazy(() => import('../pages/farmer/FarmerAccountPage'))
const FarmProfilePage = lazy(() => import('../pages/farmer/FarmProfilePage'))
const HealthReportFormPage = lazy(() => import('../pages/farmer/HealthReportFormPage'))
const HealthReportsPage = lazy(() => import('../pages/farmer/HealthReportsPage'))
const HealthReportDetailPage = lazy(() => import('../pages/farmer/HealthReportDetailPage'))
const AnimalsPage = lazy(() => import('../pages/farmer/AnimalsPage'))
const ReferralsPage = lazy(() => import('../pages/farmer/ReferralsPage'))
const ReferralDetailPage = lazy(() => import('../pages/farmer/ReferralDetailPage'))
const RemindersPage = lazy(() => import('../pages/farmer/RemindersPage'))
const VeterinaryDirectoryPage = lazy(() => import('../pages/farmer/VeterinaryDirectoryPage'))
const VetDashboardPage = lazy(() => import('../pages/vet/VetDashboardPage'))
const VetCasesPage = lazy(() => import('../pages/vet/VetCasesPage'))
const VetCaseDetailPage = lazy(() => import('../pages/vet/VetCaseDetailPage'))
const VetProfilePage = lazy(() => import('../pages/vet/VetProfilePage'))
const VetAccountPage = lazy(() => import('../pages/vet/VetAccountPage'))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'))
const AdminAlertsPage = lazy(() => import('../pages/admin/AdminAlertsPage'))
const AdminAlertDetailPage = lazy(() => import('../pages/admin/AdminAlertDetailPage'))
const AdminStatisticsPage = lazy(() => import('../pages/admin/AdminStatisticsPage'))
const AdminOversightPage = lazy(() => import('../pages/admin/AdminOversightPage'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'))
const AdminUserDetailPage = lazy(() => import('../pages/admin/AdminUserDetailPage'))
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'))
const AdminReportDetailPage = lazy(() => import('../pages/admin/AdminReportDetailPage'))
const AdminReferralsPage = lazy(() => import('../pages/admin/AdminReferralsPage'))
const AdminReferralDetailPage = lazy(() => import('../pages/admin/AdminReferralDetailPage'))
const AdminVeterinaryPage = lazy(() => import('../pages/admin/AdminVeterinaryPage'))
const AdminAccountPage = lazy(() => import('../pages/admin/AdminAccountPage'))
const AdminVeterinaryDetailPage = lazy(() => import('../pages/admin/AdminVeterinaryDetailPage'))

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Restoring your session…" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={homePathForRole(user.role)} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.FARMER]} />}>
        <Route path="/farmer" element={<AppShell />}>
          <Route index element={<FarmerDashboardPage />} />
          <Route path="farm" element={<FarmProfilePage />} />
          <Route path="reports/new" element={<HealthReportFormPage />} />
          <Route path="reports" element={<HealthReportsPage />} />
          <Route path="reports/:id" element={<HealthReportDetailPage />} />
          <Route path="animals" element={<AnimalsPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="referrals/:id" element={<ReferralDetailPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route
            path="veterinarians"
            element={<VeterinaryDirectoryPage />}
          />
          <Route path="account" element={<FarmerAccountPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.VETERINARY_PROFESSIONAL]} />}>
        <Route path="/vet" element={<AppShell />}>
          <Route index element={<VetDashboardPage />} />
          <Route path="cases" element={<VetCasesPage />} />
          <Route path="cases/:id" element={<VetCaseDetailPage />} />
          <Route path="profile" element={<VetProfilePage />} />
          <Route path="account" element={<VetAccountPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="alerts" element={<AdminAlertsPage />} />
          <Route path="alerts/:id" element={<AdminAlertDetailPage />} />
          <Route path="statistics" element={<AdminStatisticsPage />} />
          <Route path="oversight" element={<AdminOversightPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="reports/:id" element={<AdminReportDetailPage />} />
          <Route path="referrals" element={<AdminReferralsPage />} />
          <Route path="referrals/:id" element={<AdminReferralDetailPage />} />
          <Route path="veterinary" element={<AdminVeterinaryPage />} />
          <Route path="veterinary/:id" element={<AdminVeterinaryDetailPage />} />
          <Route path="account" element={<AdminAccountPage />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
