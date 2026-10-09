import { PROVINCES } from '../../utils/constants'

export default function ProvinceList({ provinces, total }) {
  const safeTotal = total || 0

  const sortedProvinces = Object.entries(provinces || {})
    .filter(([province]) => PROVINCES.includes(province))
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))

  if (sortedProvinces.length === 0) {
    return (
      <div className="rounded-lg border border-charcoal-100 bg-cream-100 px-4 py-5">
        <p className="text-sm font-semibold text-charcoal-800">No reports by province</p>
        <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
          Reports submitted by farmers will be distributed across Zimbabwe
          provinces here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sortedProvinces.map(([province, count]) => (
        <div
          key={province}
          className="flex items-center gap-3 rounded-lg border border-charcoal-100 px-3 py-2"
        >
          <span className="w-32 shrink-0 text-sm font-medium text-charcoal-700">
            {province}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal-100">
            <div
              className="h-2 rounded-full bg-forest-700"
              style={{
                width: `${Math.round((count / safeTotal) * 100)}%`,
              }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-semibold text-charcoal-900 tabular-nums">
            {count}
          </span>
          <span className="w-12 shrink-0 text-right text-xs text-charcoal-500 tabular-nums">
            {Math.round((count / safeTotal) * 100)}%
          </span>
        </div>
      ))}
    </div>
  )
}
