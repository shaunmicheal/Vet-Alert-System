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
      <span className="badge border-charcoal-200 bg-charcoal-100 text-charcoal-600">
        {type || 'Unknown type'}
      </span>
    )
  }

  return (
    <span
      className={`badge font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  )
}
