export default function StatBreakdownCard({ title, total, rows, emptyTitle, emptyDescription }) {
  const safeTotal = total || 0
  const headingId = `breakdown-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section className="card overflow-hidden" aria-labelledby={headingId}>
      <div className="card-header">
        <h2
          id={headingId}
          className="text-base font-semibold tracking-tight text-charcoal-900"
        >
          {title}
        </h2>
        <span className="rounded-full bg-charcoal-100 px-2.5 py-1 text-xs font-semibold text-charcoal-700">{safeTotal} total</span>
      </div>

      {safeTotal === 0 ? (
        <div className="m-5 rounded-xl border border-charcoal-100 bg-cream-100 px-4 py-5">
          <p className="text-sm font-semibold text-charcoal-800">{emptyTitle}</p>
          {emptyDescription && (
            <p className="mt-1 text-xs leading-relaxed text-charcoal-600">{emptyDescription}</p>
          )}
        </div>
      ) : (
        <ul className="space-y-4 px-5 py-5">
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
