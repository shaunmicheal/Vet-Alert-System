import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import { homePathForRole } from '../utils/constants'
import { navigationForRole, ROLE_LABELS } from '../utils/navigation'

const initialsFor = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'

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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition'
                if (isDark) {
                  return isActive
                    ? `${base} bg-forest-700 text-white`
                    : `${base} text-forest-100 hover:bg-forest-800 hover:text-white`
                }
                return isActive
                  ? `${base} bg-forest-50 text-forest-800`
                  : `${base} text-charcoal-600 hover:bg-charcoal-100 hover:text-charcoal-900`
              }}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

// Authenticated application shell: responsive sidebar (desktop), slide-in
// navigation (mobile), top bar with identity + logout, and a page container.
// Role-specific navigation comes from utils/navigation.js.
export default function AppShell() {
  const { user, logout } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const role = user ? user.role : null
  const items = navigationForRole(role)
  const roleLabel = ROLE_LABELS[role] || 'Workspace'
  const homePath = homePathForRole(role)
  const initials = initialsFor(user ? user.name : '')

  // Close the mobile drawer when it loses the route (links close it directly
  // via onNavigate / onClick below - no effect needed).
  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  // Close the drawer with the Escape key.
  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileNavOpen])

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-forest-900 lg:flex">
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
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-earth-500 text-sm font-bold text-white"
              aria-hidden="true"
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user ? user.name : ''}</p>
              <p className="truncate text-xs text-forest-200/80">{user ? user.email : ''}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-sm font-medium text-forest-100 transition hover:bg-forest-800 hover:text-white"
          >
            <FiLogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>
      {/* Mobile drawer */}
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
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-forest-900 shadow-xl">
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
                className="rounded-lg p-2 text-forest-100 hover:bg-forest-800"
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
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-earth-500 text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {user ? user.name : ''}
                  </p>
                  <p className="truncate text-xs text-forest-200/80">{user ? user.email : ''}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-sm font-medium text-forest-100 transition hover:bg-forest-800 hover:text-white"
              >
                <FiLogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-charcoal-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-charcoal-600 transition hover:bg-charcoal-100 hover:text-charcoal-900 lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <span className="lg:hidden">
            <Logo compact />
          </span>

          <p className="hidden text-sm text-charcoal-500 lg:block">{roleLabel} workspace</p>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm font-medium text-charcoal-700 sm:block">
              {user ? user.name : ''}
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-700 text-xs font-bold text-cream-50 sm:hidden"
              aria-hidden="true"
            >
              {initials}
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

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}