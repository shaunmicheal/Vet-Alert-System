import { Link } from 'react-router-dom'
import { FiAlertTriangle } from 'react-icons/fi'

const ALERT_TYPE_LABELS = Object.freeze({
  POSSIBLE_CLUSTER: 'Possible cluster',
  HIGH_RISK: 'High risk',
  SYSTEM: 'System',
})

export default function AlertOverviewCard({ alerts }) {
  const data = alerts || {}
  const total = data.total || 0
  const active = data.active || 0
  const byType = data.byType || {}

  return (
    <section className="card p-5" aria-labelledby="alert-overview-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="alert-overview-title"
          className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
        >
          Alert overview
        </h2>
        <Link
          to="/admin/alerts"
          className="text-sm font-semibold text-forest-700 underline-offset-2 hover:underline"
        >
          Open alerts
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-charcoal-100 bg-cream-100 px-4 py-5">
          <FiAlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-charcoal-400"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-charcoal-800">No alerts yet</p>
            <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
              High-risk reports and possible clusters detected by the platform will appear here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end gap-3">
            <p className={`text-3xl font-bold ${active > 0 ? 'text-red-700' : 'text-charcoal-900'}`}>
              {active}
            </p>
            <p className="pb-1 text-sm text-charcoal-600">active of {total} generated</p>
          </div>

          <dl className="mt-4 space-y-2 border-t border-charcoal-100 pt-3">
            {Object.entries(ALERT_TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center justify-between gap-2 text-sm">
                <dt className="text-charcoal-600">{label}</dt>
                <dd className="font-semibold text-charcoal-900">{byType[type] || 0}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <p className="mt-4 border-t border-charcoal-100 pt-3 text-xs leading-relaxed text-charcoal-500">
        Alerts flag patterns that deserve review - they are not confirmed events. Type counts are
        totals generated so far.
      </p>
    </section>
  )
}
