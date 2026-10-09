// Active vs acknowledged state of an administrative alert (backend isActive).
// Amber = still needs review; neutral = handled administratively. The badge
// never implies the underlying health situation was resolved.
export default function AlertStatusBadge({ isActive }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        Active
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-charcoal-200 bg-charcoal-100 px-2.5 py-0.5 text-xs font-medium text-charcoal-600">
      Acknowledged
    </span>
  )
}