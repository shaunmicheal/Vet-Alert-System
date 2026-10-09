import { ANIMAL_TYPE_LABELS } from '../../utils/constants'

export default function AnimalTypeList({ animalTypes, total }) {
  const safeTotal = total || 0
  const labels = ANIMAL_TYPE_LABELS || {}

  const sorted = Object.entries(animalTypes || {})
    .filter(([type]) => type in labels)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-charcoal-100 bg-cream-100 px-4 py-5">
        <p className="text-sm font-semibold text-charcoal-800">No reports by animal type</p>
        <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
          Reports submitted by farmers will be grouped by the animal they involve
          here.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {sorted.map(([type, count]) => (
        <li key={type}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-charcoal-600">{labels[type]}</span>
            <span className="font-semibold text-charcoal-900">
              {count}{' '}
              <span className="ml-1 text-xs font-normal text-charcoal-500">
                ({Math.round((count / safeTotal) * 100)}%)
              </span>
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal-100">
              <div
                className="h-2 rounded-full bg-forest-700"
                style={{
                  width: `${Math.round((count / safeTotal) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-charcoal-500 tabular-nums">{count}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
