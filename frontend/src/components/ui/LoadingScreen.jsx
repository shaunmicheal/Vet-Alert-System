import Spinner from './Spinner'

export default function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-cream-50"
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-8 w-8 text-forest-700" />
      <p className="text-sm font-medium text-charcoal-600">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  )
}
