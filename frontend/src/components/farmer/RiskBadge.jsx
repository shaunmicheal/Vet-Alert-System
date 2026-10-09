const RISK_STYLES = Object.freeze({
  LOW: { label: 'Low', className: 'border-forest-200 bg-forest-50 text-forest-800' },
  MODERATE: { label: 'Moderate', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  HIGH: { label: 'High', className: 'border-red-200 bg-red-50 text-red-800' },
})

export default function RiskBadge({ riskLevel }) {
  const style = RISK_STYLES[riskLevel]

  if (!style) {
    return (
      <span className="inline-flex items-center rounded-full border border-charcoal-200 bg-charcoal-100 px-2.5 py-0.5 text-xs font-medium text-charcoal-600">
        Not assessed
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
