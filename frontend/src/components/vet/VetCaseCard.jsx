import { Link } from 'react-router-dom'
import { FiChevronRight, FiMapPin } from 'react-icons/fi'
import RiskBadge from '../farmer/RiskBadge'
import CaseStatusBadge from './CaseStatusBadge'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { formatDate } from '../../utils/format'

// One assigned case in the vet's list. Links to the case detail view.
// Shows only case-meaningful fields - no passwords, tokens or internal ids.
export default function VetCaseCard({ vetCase }) {
  const report = vetCase.report || {}
  const farmer = vetCase.farmer || {}
  const farm = report.farm || {}
  const animal = report.animal || null
  const animalLabel = animal ? ANIMAL_TYPE_LABELS[animal.animalType] || animal.animalType : null
  const location = [farm.district, farm.province].filter(Boolean).join(', ')
  const farmerMessage = (vetCase.farmerMessage || '').trim()
  const hasResponse = (vetCase.professionalResponse || '').trim() !== ''

  return (
    <li>
      <Link
        to={`/vet/cases/${vetCase.id}`}
        className="card block p-4 transition hover:border-forest-300 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-charcoal-900">
              {report.title || 'Health report case'}
            </p>
            <p className="mt-0.5 truncate text-xs text-charcoal-500">
              {farmer.name || 'Farmer'}
              {animalLabel ? ` · ${animalLabel}` : ''}
            </p>
            {location && (
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-charcoal-500">
                <FiMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{location}</span>
              </p>
            )}
            <p className="mt-1.5 text-xs text-charcoal-500">
              Referred {formatDate(vetCase.createdAt)}
            </p>
            {farmerMessage && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-charcoal-600">
                &ldquo;{farmerMessage}&rdquo;
              </p>
            )}
            {hasResponse && (
              <p className="mt-1 text-xs font-medium text-forest-700">
                You have responded to this case.
              </p>
            )}
            {!hasResponse && vetCase.status !== 'DECLINED' && vetCase.status !== 'COMPLETED' && (
              <p className="mt-1 text-xs font-medium text-amber-700">
                Awaiting your response.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CaseStatusBadge status={vetCase.status} />
            <RiskBadge riskLevel={report.riskLevel} />
            <FiChevronRight className="h-4 w-4 text-charcoal-400" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </li>
  )
}
