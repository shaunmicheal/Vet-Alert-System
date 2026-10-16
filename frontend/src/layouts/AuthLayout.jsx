import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import PageLoader from '../components/ui/PageLoader'
import RouteErrorBoundary from '../components/ui/RouteErrorBoundary'
import { LIVESTOCK_IMAGES } from '../utils/livestockImages'

const CURRENT_YEAR = new Date().getFullYear()

export default function AuthLayout() {
  const location = useLocation()
  const isRegister = location.pathname.startsWith('/register')

  return (
    <div className="relative flex min-h-screen flex-col bg-forest-950">
      <img
        src={LIVESTOCK_IMAGES.signIn.src}
        alt=""
        aria-hidden="true"
        fetchPriority={LIVESTOCK_IMAGES.signIn.fetchPriority}
        decoding="async"
        width={LIVESTOCK_IMAGES.signIn.width}
        height={LIVESTOCK_IMAGES.signIn.height}
        className="absolute inset-0 h-full w-full bg-forest-950 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-forest-950/85 via-forest-900/75 to-forest-950/90"
      />

      <header className="relative flex items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" aria-label="VetAlert Zimbabwe home" className="w-fit">
          <Logo tone="light" />
        </Link>
        <p className="hidden text-sm font-medium text-forest-100/80 sm:block">
          Protecting livestock health across Zimbabwe.
        </p>
      </header>

      <main className="relative flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:px-6 sm:py-10">
        <div className="my-auto w-full max-w-md rounded-2xl border border-cream-200/60 bg-cream-50/95 px-6 py-8 shadow-2xl backdrop-blur-sm sm:px-8">
          <RouteErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageLoader label="Loading…" />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </div>
      </main>

      <footer className="relative px-5 pb-5 text-center sm:px-8">
        <p className="text-xs text-forest-100/70">
          © {CURRENT_YEAR} VetAlert Zimbabwe
          {isRegister && '. Only farmer accounts can self-register.'}
        </p>
      </footer>
    </div>
  )
}
