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
    <section className="card overflow-hidden" aria-labelledby="risk-overview-title">
      <div className="card-header">
        <div>
          <p className="section-eyebrow">Triage by risk</p>
          <h2
            id="risk-overview-title"
            className="mt-0.5 text-base font-semibold tracking-tight text-charcoal-900"
          >
            Reports by risk level
          </h2>
        </div>
        <span className="rounded-full bg-charcoal-100 px-2.5 py-1 text-xs font-semibold text-charcoal-700">{total} total</span>
      </div>

      <div className="grid gap-3 px-5 pt-5 sm:grid-cols-3">
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

      <p className="mx-5 mb-5 mt-4 border-t border-charcoal-100 pt-3 text-xs leading-relaxed text-charcoal-500">
        Risk levels are triage indicators recorded on submitted reports. A high-risk report does
        not confirm a disease or outbreak.
      </p>
    </section>
  )
}
