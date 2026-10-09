// Visual badge for the backend AlertType enum (POSSIBLE_CLUSTER, HIGH_RISK,
// SYSTEM) - UI metadata only, the backend enum stays the source of truth. The
// tone distinguishes the KIND of administrative alert; it never asserts that
// an event is confirmed.
const TYPE_STYLES = Object.freeze({
  POSSIBLE_CLUSTER: {
    label: 'Possible cluster',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  HIGH_RISK: { label: 'High risk', className: 'border-red-200 bg-red-50 text-red-800' },
  SYSTEM: { label: 'System', className: 'border-sky-200 bg-sky-50 text-sky-900' },
})

export default function AlertTypeBadge({ type }) {
  const style = TYPE_STYLES[type]

  if (!style) {
    return (
      <span className="inline-flex items-center rounded-full border border-charcoal-200 bg-charcoal-100 px-2.5 py-0.5 text-xs font-medium text-charcoal-600">
        {type || 'Unknown type'}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  )
}