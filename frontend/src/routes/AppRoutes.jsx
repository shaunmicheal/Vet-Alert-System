import { Navigate, Route, Routes } from 'react-router-dom'
import LoadingScreen from '../components/ui/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import AuthLayout from '../layouts/AuthLayout'
import AppShell from '../layouts/AppShell'
import NotFoundPage from '../pages/NotFoundPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import AdminAlertDetailPage from '../pages/admin/AdminAlertDetailPage'
import AdminAlertsPage from '../pages/admin/AdminAlertsPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminOversightPage from '../pages/admin/AdminOversightPage'
import AdminStatisticsPage from '../pages/admin/AdminStatisticsPage'
import HealthReportsPage from '../pages/farmer/HealthReportsPage'
import HealthReportDetailPage from '../pages/farmer/HealthReportDetailPage'
import HealthReportFormPage from '../pages/farmer/HealthReportFormPage'
import ReferralsPage from '../pages/farmer/ReferralsPage'
import ReferralDetailPage from '../pages/farmer/ReferralDetailPage'
import RemindersPage from '../pages/farmer/RemindersPage'
import VeterinaryDirectoryPage from '../pages/farmer/VeterinaryDirectoryPage'
import VetDashboardPage from '../pages/vet/VetDashboardPage'
import VetCasesPage from '../pages/vet/VetCasesPage'
import VetCaseDetailPage from '../pages/vet/VetCaseDetailPage'
import VetProfilePage from '../pages/vet/VetProfilePage'
import FarmerDashboardPage from '../pages/farmer/FarmerDashboardPage'
import FarmProfilePage from '../pages/farmer/FarmProfilePage'
import AnimalsPage from '../pages/farmer/AnimalsPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import { homePathForRole, ROLES } from '../utils/constants'

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
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.VETERINARY_PROFESSIONAL]} />}>
        <Route path="/vet" element={<AppShell />}>
          <Route index element={<VetDashboardPage />} />
          <Route path="cases" element={<VetCasesPage />} />
          <Route path="cases/:id" element={<VetCaseDetailPage />} />
          <Route path="profile" element={<VetProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="alerts" element={<AdminAlertsPage />} />
          <Route path="alerts/:id" element={<AdminAlertDetailPage />} />
          <Route path="statistics" element={<AdminStatisticsPage />} />
          <Route path="oversight" element={<AdminOversightPage />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
