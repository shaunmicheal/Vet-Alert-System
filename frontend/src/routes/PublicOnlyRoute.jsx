import { Navigate, Outlet } from 'react-router-dom'
import LoadingScreen from '../components/ui/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { homePathForRole } from '../utils/constants'

// Keeps signed-in users away from the public login/registration pages
// and sends them to their own role's workspace instead.
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