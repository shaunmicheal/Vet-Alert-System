import { FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi'
import { FRONTEND_DISCLAIMER, RISK_LEVEL_LABELS } from '../../utils/constants'

const RISK_PANELS = Object.freeze({
  HIGH: {
    container: 'border-red-200 bg-red-50',
    icon: 'bg-red-100 text-red-700',
    heading: 'text-red-900',
    body: 'text-red-800',
    Icon: FiAlertTriangle,
  },
  MODERATE: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'bg-amber-100 text-amber-700',
    heading: 'text-amber-900',
    body: 'text-amber-800',
    Icon: FiInfo,
  },
  LOW: {
    container: 'border-forest-200 bg-forest-50',
    icon: 'bg-forest-100 text-forest-700',
    heading: 'text-forest-900',
    body: 'text-forest-800',
    Icon: FiCheckCircle,
  },
})

export default function TriageResult({ triage }) {
  if (!triage || !triage.assessment) return null

  const panel = RISK_PANELS[triage.riskLevel] || {
    container: 'border-charcoal-200 bg-charcoal-100',
    icon: 'bg-charcoal-200 text-charcoal-700',
    heading: 'text-charcoal-900',
    body: 'text-charcoal-700',
    Icon: FiInfo,
  }
  const Icon = panel.Icon
  const riskLabel = RISK_LEVEL_LABELS[triage.riskLevel] || 'Risk not yet rated'
  const attentionRecommended = triage.veterinaryAttentionRecommended === true
  const warningSigns = Array.isArray(triage.warningSigns) ? triage.warningSigns : []
  const followUpQuestions = Array.isArray(triage.followUpQuestions)
    ? triage.followUpQuestions
    : []

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="triage-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="triage-heading" className="text-base font-semibold text-charcoal-900">
          AI-assisted risk assessment
        </h2>
        {triage.source === 'FALLBACK' && (
          <span className="rounded-full border border-charcoal-200 bg-charcoal-100 px-2.5 py-0.5 text-xs font-medium text-charcoal-600">
            General guidance (AI service unavailable)
          </span>
        )}
      </div>

      <div className={`mt-4 flex items-start gap-3 rounded-lg border p-4 ${panel.container}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${panel.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className={`text-sm font-bold ${panel.heading}`}>{riskLabel}</p>
          {attentionRecommended ? (
            <>
              <p className={`mt-0.5 text-sm font-medium ${panel.body}`}>
                Veterinary attention recommended.
              </p>
              <p className={`mt-1 text-sm ${panel.body}`}>
                Please contact a veterinary professional as soon as you can. You can find one in
                the Veterinary Directory.
              </p>
            </>
          ) : (
            <p className={`mt-0.5 text-sm ${panel.body}`}>
              Keep watching the animals and follow the guidance below. Seek veterinary advice if the
              signs get worse.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-charcoal-800">What this assessment says</h3>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-charcoal-700">
          {triage.assessment}
        </p>
      </div>

      {triage.recommendations && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-charcoal-800">Recommendations</h3>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-charcoal-700">
            {triage.recommendations}
          </p>
        </div>
      )}

      {warningSigns.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-charcoal-800">Warning signs to watch for</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-charcoal-700">
            {warningSigns.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
        </div>
      )}

      {followUpQuestions.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-charcoal-800">
            Questions that would help clarify this
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-charcoal-700">
            {followUpQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 rounded-lg border border-charcoal-200 bg-cream-100 px-3.5 py-3 text-xs leading-relaxed text-charcoal-600">
        {triage.disclaimer || FRONTEND_DISCLAIMER}
      </p>
    </section>
  )
}
