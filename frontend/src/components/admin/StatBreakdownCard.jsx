export default function StatBreakdownCard({ title, total, rows, emptyTitle, emptyDescription }) {
  const safeTotal = total || 0
  const headingId = `breakdown-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section className="card p-5" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-2">
        <h2
          id={headingId}
          className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
        >
          {title}
        </h2>
        <span className="text-xs text-charcoal-500">{safeTotal} total</span>
      </div>

      {safeTotal === 0 ? (
        <div className="mt-4 rounded-lg border border-charcoal-100 bg-cream-100 px-4 py-5">
          <p className="text-sm font-semibold text-charcoal-800">{emptyTitle}</p>
          {emptyDescription && (
            <p className="mt-1 text-xs leading-relaxed text-charcoal-600">{emptyDescription}</p>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const count = row.count || 0
            const pct = safeTotal > 0 ? Math.round((count / safeTotal) * 100) : 0
            return (
              <li key={row.key}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-charcoal-600">{row.label}</span>
                  <span className="font-semibold text-charcoal-900">
                    {count}
                    <span className="ml-1 text-xs font-normal text-charcoal-500">({pct}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-charcoal-100">
                  <div className="h-1.5 rounded-full bg-forest-700" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
