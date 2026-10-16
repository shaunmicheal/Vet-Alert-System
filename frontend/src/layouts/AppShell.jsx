import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FiChevronRight, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import Logo from '../components/Logo'
import PageLoader from '../components/ui/PageLoader'
import RouteErrorBoundary from '../components/ui/RouteErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import { initialsFor } from '../pages/account/accountShared'
import { homePathForRole } from '../utils/constants'
import { navigationForRole, ROLE_LABELS } from '../utils/navigation'

function NavItems({ items, onNavigate, variant }) {
  const isDark = variant === 'dark'

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => {
                const base =
                  'flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2'
                if (isDark) {
                  return isActive
                    ? `${base} bg-forest-800 text-white focus-visible:outline-forest-200`
                    : `${base} text-forest-100/75 hover:bg-white/5 hover:text-white focus-visible:outline-forest-200`
                }
                return isActive
                  ? `${base} bg-forest-100 text-forest-900`
                  : `${base} text-charcoal-600 hover:bg-charcoal-100 hover:text-charcoal-900`
              }}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">{item.label}</span>
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

function InitialsAvatar({ user, className }) {
  const name = user ? user.name || '' : ''
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-forest-700 font-bold text-white ${className}`}
      role="img"
      aria-label={name || 'Signed-in user'}
    >
      {initialsFor(name)}
    </span>
  )
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const drawerRef = useRef(null)
  const drawerWasOpenRef = useRef(false)
  const location = useLocation()

  const role = user ? user.role : null
  const items = navigationForRole(role)
  const roleLabel = ROLE_LABELS[role] || 'Workspace'
  const homePath = homePathForRole(role)
  const accountPath = `${homePath}/account`

  const openAccount = (closeMobileNav) => {
    if (closeMobileNav) setMobileNavOpen(false)
    navigate(accountPath)
  }

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (mobileNavOpen) {
      drawerWasOpenRef.current = true
      drawerRef.current?.focus()
      return undefined
    }
    if (drawerWasOpenRef.current) {
      drawerWasOpenRef.current = false
      menuButtonRef.current?.focus()
    }
    return undefined
  }, [mobileNavOpen])

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const drawer = drawerRef.current
      if (!drawer) return
      const focusable = drawer.querySelectorAll('a[href], button:not([disabled])')
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === drawer)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileNavOpen])

  return (
    <div className="min-h-screen bg-cream-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-forest-200 focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-forest-800 focus:shadow-[var(--shadow-overlay)]"
      >
        Skip to main content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--layout-sidebar)] flex-col bg-forest-950 lg:flex">
        <div className="flex h-16 items-center border-b border-forest-800 px-5">
          <Link to={homePath} aria-label="VetAlert Zimbabwe home">
            <Logo tone="light" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-forest-300">
            {roleLabel}
          </p>
          <NavItems items={items} variant="dark" />
        </nav>

        <div className="border-t border-forest-800 p-4">
          <button
            type="button"
            onClick={() => openAccount(false)}
            aria-label="Manage profile and account settings"
            title="Manage profile"
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-200"
          >
            <InitialsAvatar user={user} className="h-9 w-9 text-sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">
                {user ? user.name : ''}
              </span>
              <span className="block truncate text-xs text-forest-200/80">
                {user ? user.email : ''}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-forest-300/90">
                Manage profile
              </span>
            </span>
            <FiChevronRight className="h-4 w-4 shrink-0 text-forest-200/70" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-sm font-medium text-forest-100 transition hover:bg-forest-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-200"
          >
            <FiLogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-charcoal-900/50"
            aria-label="Close navigation menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-forest-950 shadow-xl outline-none"
          >
            <div className="flex h-16 items-center justify-between border-b border-forest-800 px-4">
              <Link
                to={homePath}
                aria-label="VetAlert Zimbabwe home"
                onClick={() => setMobileNavOpen(false)}
              >
                <Logo tone="light" />
              </Link>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-forest-100 transition hover:bg-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-200"
                aria-label="Close navigation menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-forest-300">
                {roleLabel}
              </p>
              <NavItems items={items} variant="dark" onNavigate={() => setMobileNavOpen(false)} />
            </nav>

            <div className="border-t border-forest-800 p-4">
              <button
                type="button"
                onClick={() => openAccount(true)}
                aria-label="Manage profile and account settings"
                title="Manage profile"
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-200"
              >
                <InitialsAvatar user={user} className="h-9 w-9 text-sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {user ? user.name : ''}
                  </span>
                  <span className="block truncate text-xs text-forest-200/80">
                    {user ? user.email : ''}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-forest-300/90">
                    Manage profile
                  </span>
                </span>
                <FiChevronRight
                  className="h-4 w-4 shrink-0 text-forest-200/70"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={logout}
                className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-sm font-medium text-forest-100 transition hover:bg-forest-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-200"
              >
                <FiLogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-[var(--layout-sidebar)]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-charcoal-200/70 bg-white/90 px-4 backdrop-blur-sm sm:px-6">
          <button
            ref={menuButtonRef}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-charcoal-600 transition hover:bg-charcoal-100 hover:text-charcoal-900 lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <span className="lg:hidden">
            <Logo compact />
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm font-medium text-charcoal-700 sm:block">
              {user ? user.name : ''}
            </span>
            <span className="sm:hidden">
              <InitialsAvatar user={user} className="h-8 w-8 text-xs" />
            </span>
            <button
              type="button"
              onClick={logout}
              className="btn btn-ghost px-3 py-2 lg:hidden"
            >
              <FiLogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="page-container outline-none"
        >
          <RouteErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  )
}
