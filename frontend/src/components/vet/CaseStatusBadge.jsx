import { caseStatusLabel } from '../../utils/vetCases'

const STATUS_STYLES = Object.freeze({
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  ACCEPTED: 'border-sky-200 bg-sky-50 text-sky-900',
  IN_PROGRESS: 'border-earth-200 bg-earth-50 text-earth-800',
  COMPLETED: 'border-forest-200 bg-forest-50 text-forest-800',
  DECLINED: 'border-red-200 bg-red-50 text-red-800',
})

export default function CaseStatusBadge({ status }) {
  const className = STATUS_STYLES[status] || 'border-charcoal-200 bg-charcoal-100 text-charcoal-600'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {caseStatusLabel(status)}
    </span>
  )
}
