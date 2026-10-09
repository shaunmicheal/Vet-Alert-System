import { Link } from 'react-router-dom'
import { FiChevronRight } from 'react-icons/fi'
import AlertStatusBadge from './AlertStatusBadge'
import AlertTypeBadge from './AlertTypeBadge'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/format'

export default function AdminAlertCard({ alert }) {
  const animalType = alert.animalType
    ? ANIMAL_TYPE_LABELS[alert.animalType] || alert.animalType
    : null
  const location = [alert.district, alert.province].filter(Boolean).join(', ')
  const created = formatDate(alert.createdAt)
  const meta = [location, animalType, created ? `Created ${created}` : null].filter(Boolean)

  return (
    <li>
      <Link
        to={`/admin/alerts/${alert.id}`}
        className="card block p-4 transition hover:border-forest-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <AlertTypeBadge type={alert.type} />
              <AlertStatusBadge isActive={alert.isActive} />
              {typeof alert.reportCount === 'number' && (
                <span className="inline-flex items-center rounded-full border border-charcoal-200 bg-white px-2.5 py-0.5 text-xs font-medium text-charcoal-600">
                  {alert.reportCount} linked {alert.reportCount === 1 ? 'report' : 'reports'}
                </span>
              )}
            </div>
            <p className="mt-2 font-semibold text-charcoal-900">{alert.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal-700 line-clamp-2">
              {alert.message}
            </p>
            {meta.length > 0 && <p className="mt-1.5 text-xs text-charcoal-500">{meta.join(' · ')}</p>}
          </div>
          <FiChevronRight className="h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
        </div>
      </Link>
    </li>
  )
}
