// Accessible horizontal bar with an explicit text equivalent. The count and
// percentage are always rendered as readable text next to the bar, so colour
// is decorative context only and never the sole differentiator. The track is
// hidden from assistive technology because the numbers already tell the story.
export default function DistributionBar({
  label,
  count,
  total,
  tone = 'bg-forest-700',
  showLabel = true,
}) {
  const safeTotal = total || 0
  const safeCount = Number.isFinite(count) ? count : 0
  const percentage = safeTotal > 0 ? (safeCount / safeTotal) * 100 : 0
  const width = Math.round(percentage)

  return (
    <div className="flex items-center gap-3">
      {showLabel && (
        <span className="w-32 shrink-0 text-sm font-medium text-charcoal-700">
          {label}
        </span>
      )}
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal-100"
        aria-hidden="true"
      >
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-semibold text-charcoal-900 tabular-nums">
        {safeCount}
      </span>
      <span className="w-12 shrink-0 text-right text-xs text-charcoal-500 tabular-nums">
        {safeTotal > 0 ? `${width}%` : '\u2014'}
      </span>
    </div>
  )
}