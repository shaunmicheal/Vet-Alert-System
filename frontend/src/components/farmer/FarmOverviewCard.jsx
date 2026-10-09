import { Link } from 'react-router-dom'
import { FiEdit3 } from 'react-icons/fi'
import { formatCoordinates } from '../../utils/format'

export default function FarmOverviewCard({ farm, actionPath, actionLabel }) {
  const coordinates = farm ? formatCoordinates(farm.latitude, farm.longitude) : null

  const details = farm
    ? [
        { term: 'Farm name', value: farm.name },
        { term: 'Province', value: farm.province },
        { term: 'District', value: farm.district },
        { term: 'Ward', value: farm.ward },
        { term: 'Village', value: farm.village },
        { term: 'Address', value: farm.address },
        { term: 'Coordinates', value: coordinates },
      ].filter((item) => item.value)
    : []

  return (
    <section className="card p-5" aria-labelledby="farm-overview-heading">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="farm-overview-heading" className="text-base font-semibold text-charcoal-900">
          Farm overview
        </h2>
        {actionPath && (
          <Link
            to={actionPath}
            className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal-200 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal-700 transition hover:bg-charcoal-100"
          >
            <FiEdit3 className="h-3.5 w-3.5" aria-hidden="true" />
            {actionLabel || 'Edit profile'}
          </Link>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {details.map((item) => (
          <div key={item.term}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
              {item.term}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
