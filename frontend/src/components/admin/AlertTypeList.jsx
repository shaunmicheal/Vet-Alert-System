// Alert type breakdown.
export default function AlertTypeList({ alertTypes, total }) {
  const safeTotal = total || 0
  const rows = [
    { key: 'POSSIBLE_CLUSTER', label: 'Possible cluster', colour: 'bg-amber-500' },
    { key: 'HIGH_RISK', label: 'High risk', colour: 'bg-red-500' },
    { key: 'SYSTEM', label: 'System', colour: 'bg-slate-500' },
  ]

  const sorted = rows
    .map((row) => ({
      ...row,
      count: (alertTypes || {})[row.key] || 0,
    }))
    .filter((row) => row.count > 0)

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-charcoal-100 bg-cream-100 px-4 py-5">
        <p className="text-sm font-semibold text-charcoal-800">No alerts generated</p>
        <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
          Alerts are raised automatically when the platform has reason to review a
          report. Generated totals are listed here as historical counts.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {sorted.map((row) => (
        <li key={row.key}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-charcoal-600">{row.label}</span>
            <span className="font-semibold text-charcoal-900">
              {row.count}{' '}
              <span className="ml-1 text-xs font-normal text-charcoal-500">
                ({Math.round((row.count / safeTotal) * 100)}%)
              </span>
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal-100">
              <div
                className={`h-2 rounded-full ${row.colour}`}
                style={{
                  width: `${Math.round((row.count / safeTotal) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-charcoal-500 tabular-nums">{row.count}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
