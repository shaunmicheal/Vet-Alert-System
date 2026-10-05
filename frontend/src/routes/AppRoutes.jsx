import { Navigate, Route, Routes } from 'react-router-dom'
import { FiCompass } from 'react-icons/fi'
import LoadingScreen from '../components/ui/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import AuthLayout from '../layouts/AuthLayout'
import AppShell from '../layouts/AppShell'
import ModulePlaceholder from '../pages/ModulePlaceholder'
import NotFoundPage from '../pages/NotFoundPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import { homePathForRole, ROLES } from '../utils/constants'

// "/" sends each visitor to their own workspace (or to sign in).
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

// All application routes. Role areas are protected by role; each nav item has
// a placeholder route for now - later phases replace them with real pages.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      {/* Public: login + farmer registration */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Farmer area - FARMER role only */}
      <Route element={<ProtectedRoute roles={[ROLES.FARMER]} />}>
        <Route path="/farmer" element={<AppShell />}>
          <Route index element={<ModulePlaceholder title="Dashboard" icon={FiCompass} />} />
          <Route path="reports" element={<ModulePlaceholder title="Health Reports" />} />
          <Route path="animals" element={<ModulePlaceholder title="My Animals" />} />
          <Route path="referrals" element={<ModulePlaceholder title="Referrals" />} />
          <Route path="reminders" element={<ModulePlaceholder title="Reminders" />} />
          <Route path="veterinarians" element={<ModulePlaceholder title="Veterinary Directory" />} />
        </Route>
      </Route>

      {/* Veterinary professional area - VETERINARY_PROFESSIONAL role only */}
      <Route element={<ProtectedRoute roles={[ROLES.VETERINARY_PROFESSIONAL]} />}>
        <Route path="/vet" element={<AppShell />}>
          <Route index element={<ModulePlaceholder title="Dashboard" icon={FiCompass} />} />
          <Route path="cases" element={<ModulePlaceholder title="Assigned Cases" />} />
          <Route path="profile" element={<ModulePlaceholder title="My Profile" />} />
        </Route>
      </Route>

      {/* Admin area - ADMIN role only */}
      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<AppShell />}>
          <Route index element={<ModulePlaceholder title="Dashboard" icon={FiCompass} />} />
          <Route path="alerts" element={<ModulePlaceholder title="Alerts" />} />
          <Route path="statistics" element={<ModulePlaceholder title="Statistics" />} />
          <Route path="oversight" element={<ModulePlaceholder title="Oversight" />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}