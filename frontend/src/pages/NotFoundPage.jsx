import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiHome } from 'react-icons/fi'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { homePathForRole } from '../utils/constants'

// Professional 404 page with a way back to the right place.
export default function NotFoundPage() {
  useDocumentTitle('Page not found')

  const { user } = useAuth()
  const navigate = useNavigate()
  const homePath = user ? homePathForRole(user.role) : '/login'
  const homeLabel = user ? 'Go to my workspace' : 'Go to sign in'

  return (
    <div className="flex min-h-screen flex-col bg-cream-50">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to={homePath} aria-label="VetAlert Zimbabwe home">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="card w-full max-w-lg px-6 py-12 text-center sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-earth-600">Error 404</p>
          <p className="mt-3 text-6xl font-black text-forest-700" aria-hidden="true">
            404
          </p>
          <h1 className="mt-4 text-xl font-bold text-charcoal-900 sm:text-2xl">
            We couldn’t find that page
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-charcoal-600">
            The page may have moved, the link may be broken, or the address may be incorrect.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link to={homePath} className="btn btn-primary">
              <FiHome className="h-4 w-4" aria-hidden="true" />
              {homeLabel}
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go back
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}