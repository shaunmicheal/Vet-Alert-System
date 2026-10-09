import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import Logo from '../components/Logo'
import UnauthorizedState from '../components/ui/UnauthorizedState'
import { useAuth } from '../hooks/useAuth'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { homePathForRole } from '../utils/constants'

export default function UnauthorizedPage() {
  useDocumentTitle('Access denied')

  const { user } = useAuth()
  const navigate = useNavigate()

  const description = user
    ? `You are signed in as ${user.name} (${
        user.role === 'FARMER'
          ? 'Farmer'
          : user.role === 'ADMIN'
            ? 'Administrator'
            : 'Veterinary Professional'
      }), and that role does not include access to this area.`
    : 'You need to sign in to continue. If you believe this is a mistake, please contact your VetAlert administrator.'

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to={user ? homePathForRole(user.role) : '/login'} aria-label="VetAlert Zimbabwe home">
          <Logo />
        </Link>
      </header>

      <UnauthorizedState
        description={description}
        action={
          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(user ? homePathForRole(user.role) : '/login')}
            >
              {user ? 'Go to my workspace' : 'Go to sign in'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go back
            </button>
          </div>
        }
      />
    </div>
  )
}
