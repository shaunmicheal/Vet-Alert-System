export default function PlatformCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
}) {
  const toneClass = {
    default: 'border-charcoal-100 bg-white',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
    earth: 'border-earth-200 bg-earth-50 text-earth-800',
  }[tone]

  return (
    <div className={`card p-5 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-charcoal-900">{value}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass.replace(
            'card',
            ''
          )}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {sub && (
        <p className="mt-3 text-xs leading-relaxed text-charcoal-600">{sub}</p>
      )}
    </div>
  )
}
