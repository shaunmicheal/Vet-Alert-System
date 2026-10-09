import { FiAlertTriangle } from 'react-icons/fi'
import { RISK_LEVELS, RISK_LEVEL_LABELS } from '../../utils/constants'

const RISK_TONES = Object.freeze({
  LOW: 'border-forest-200 bg-forest-50 text-forest-800',
  MODERATE: 'border-amber-200 bg-amber-50 text-amber-800',
  HIGH: 'border-red-200 bg-red-50 text-red-800 shadow-sm',
})

export default function RiskOverviewCard({ reports }) {
  const data = reports || {}
  const byRiskLevel = data.byRiskLevel || {}
  const total = data.total || 0
  const unset = byRiskLevel.UNSET || 0

  return (
    <section className="card p-5" aria-labelledby="risk-overview-title">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="risk-overview-title"
          className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
        >
          Reports by risk level
        </h2>
        <span className="text-xs text-charcoal-500">{total} total</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {RISK_LEVELS.map((level) => {
          const count = byRiskLevel[level] || 0
          return (
            <div key={level} className={`rounded-lg border p-4 ${RISK_TONES[level]}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {RISK_LEVEL_LABELS[level]}
                </p>
                {level === 'HIGH' && count > 0 && (
                  <FiAlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
              </div>
              <p className="mt-2 text-3xl font-bold">{count}</p>
            </div>
          )
        })}
      </div>

      {unset > 0 && <p className="mt-3 text-xs text-charcoal-500">Not yet assessed: {unset}</p>}

      <p className="mt-4 border-t border-charcoal-100 pt-3 text-xs leading-relaxed text-charcoal-500">
        Risk levels are triage indicators recorded on submitted reports. A high-risk report does
        not confirm a disease or outbreak.
      </p>
    </section>
  )
}
