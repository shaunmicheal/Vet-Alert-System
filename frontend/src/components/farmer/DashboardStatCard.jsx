import { Link } from 'react-router-dom'

const TONES = Object.freeze({
  default: 'bg-forest-50 text-forest-700',
  earth: 'bg-earth-50 text-earth-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
})

export default function DashboardStatCard({ icon: Icon, label, value, sub, tone = 'default', to, ariaLabel }) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONES[tone] || TONES.default}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-charcoal-600">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-bold break-words text-charcoal-900">{value}</p>
      {sub && <p className="mt-1 text-sm leading-relaxed text-charcoal-600">{sub}</p>}
    </>
  )

  if (!to) {
    return <div className="card p-5">{content}</div>
  }

  return (
    <Link
      to={to}
      aria-label={ariaLabel || `${label}: ${value}. ${typeof sub === 'string' ? sub : ''}`}
      className="card block p-5 text-left transition hover:border-forest-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
    >
      {content}
      <span className="mt-2 block text-xs font-semibold text-forest-700">View records</span>
    </Link>
  )
}
