import { Link } from 'react-router-dom'
import { FiChevronRight, FiMessageSquare } from 'react-icons/fi'
import ReferralStatusBadge from './ReferralStatusBadge'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/format'

export default function ReferralCard({ referral }) {
  const professional = referral.professional || {}
  const report = referral.report || {}
  const animalType = report.animal ? report.animal.animalType : null
  const animalLabel = animalType ? ANIMAL_TYPE_LABELS[animalType] || animalType : null
  const farmerMessage = (referral.farmerMessage || '').trim()
  const hasResponse = (referral.professionalResponse || '').trim() !== ''

  return (
    <li>
      <Link
        to={`/farmer/referrals/${referral.id}`}
        className="card block p-4 transition hover:border-forest-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-charcoal-900">
              {professional.name || 'Veterinary professional'}
            </p>
            <p className="mt-0.5 truncate text-xs text-charcoal-500">
              {professional.professionalType || 'Professional'}
              {professional.district ? ` · ${professional.district}` : ''}
              {professional.province ? `, ${professional.province}` : ''}
            </p>
            <p className="mt-1.5 truncate text-sm text-charcoal-700">
              Re: {report.title || 'Health report'}
              {animalLabel ? ` · ${animalLabel}` : ''}
            </p>
            <p className="mt-0.5 text-xs text-charcoal-500">
              Referred {formatDate(referral.createdAt)}
            </p>
            {farmerMessage && (
              <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-charcoal-600">
                <FiMessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="line-clamp-2">“{farmerMessage}”</span>
              </p>
            )}
            {hasResponse && (
              <p className="mt-1 text-xs font-medium text-forest-700">
                The professional has responded. Open to read it.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <ReferralStatusBadge status={referral.status} />
            <FiChevronRight className="h-4 w-4 text-charcoal-400" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </li>
  )
}
