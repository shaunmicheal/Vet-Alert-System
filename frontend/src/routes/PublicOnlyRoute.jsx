import { Navigate, Outlet } from 'react-router-dom'
import LoadingScreen from '../components/ui/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { homePathForRole } from '../utils/constants'

export default function PublicOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Restoring your session…" />
  }

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return <Outlet />
}
