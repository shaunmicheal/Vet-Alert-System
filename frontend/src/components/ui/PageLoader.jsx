import Spinner from './Spinner'

/**
 * Inline fallback shown while a lazily loaded route chunk downloads.
 * Used by AppShell and AuthLayout Suspense boundaries so the surrounding
 * layout stays visible during navigation.
 */
export default function PageLoader({ label = 'Loading page…' }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-24"
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-7 w-7 text-forest-700" />
      <p className="text-sm font-medium text-charcoal-600">{label}</p>
    </div>
  )
}