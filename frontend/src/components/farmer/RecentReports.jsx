import { Link } from 'react-router-dom'
import { FiFileText } from 'react-icons/fi'
import EmptyState from '../ui/EmptyState'
import { ANIMAL_TYPE_LABELS, REPORT_STATUS_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/format'
import RiskBadge from './RiskBadge'

// Small neutral badge for the backend report status enum.
const STATUS_STYLES = Object.freeze({
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  REVIEWED: 'border-sky-200 bg-sky-50 text-sky-900',
  REFERRED: 'border-earth-200 bg-earth-50 text-earth-800',
  RESOLVED: 'border-forest-200 bg-forest-50 text-forest-800',
})

function StatusBadge({ status }) {
  const className = STATUS_STYLES[status] || 'border-charcoal-200 bg-charcoal-100 text-charcoal-600'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {REPORT_STATUS_LABELS[status] || status}
    </span>
  )
}

// Compact list of the farmer's newest health reports (max 5).
export default function RecentReports({ reports, actionPath }) {
  if (!reports.length) {
    return (
      <EmptyState
        icon={FiFileText}
        title="No health reports yet"
        description="When you report a health concern on your farm, it will appear here with its risk level and status."
        action={
          <Link to={actionPath} className="btn btn-primary">
            Report a health concern
          </Link>
        }
      />
    )
  }

  return (
    <section className="card p-5" aria-labelledby="recent-reports-heading">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 id="recent-reports-heading" className="text-base font-semibold text-charcoal-900">
          Recent health reports
        </h2>
        <Link
          to={actionPath}
          className="text-sm font-semibold text-forest-700 underline-offset-2 hover:underline"
        >
          View all
        </Link>
      </header>

      <ul className="divide-y divide-charcoal-100">
        {reports.map((report) => {
          const animalLabel = report.animal
            ? ANIMAL_TYPE_LABELS[report.animal.animalType] || report.animal.animalType
            : 'General'

          return (
            <li key={report.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-charcoal-900">{report.title}</p>
                <p className="mt-0.5 text-xs text-charcoal-500">
                  {formatDate(report.createdAt)} · {animalLabel}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <RiskBadge riskLevel={report.riskLevel} />
                <StatusBadge status={report.status} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}