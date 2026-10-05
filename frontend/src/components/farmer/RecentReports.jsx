import { Link } from 'react-router-dom'
import { FiFileText } from 'react-icons/fi'
import EmptyState from '../ui/EmptyState'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/format'
import ReportStatusBadge from './ReportStatusBadge'
import RiskBadge from './RiskBadge'

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
                <Link
                  to={`/farmer/reports/${report.id}`}
                  className="block truncate text-sm font-semibold text-charcoal-900 hover:text-forest-700 hover:underline"
                >
                  {report.title}
                </Link>
                <p className="mt-0.5 text-xs text-charcoal-500">
                  {formatDate(report.createdAt)} · {animalLabel}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <RiskBadge riskLevel={report.riskLevel} />
                <ReportStatusBadge status={report.status} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}