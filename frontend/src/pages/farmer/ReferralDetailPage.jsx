import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { FiArrowLeft, FiMail, FiMapPin, FiPhone, FiRefreshCw, FiX } from 'react-icons/fi'
import { getReferral } from '../../api/referrals'
import ReferralStatusBadge from '../../components/farmer/ReferralStatusBadge'
import RiskBadge from '../../components/farmer/RiskBadge'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import { REFERRAL_STATUS_EXPLANATIONS, REFERRAL_STATUS_NEXT } from '../../utils/referrals'
import { formatDate } from '../../utils/format'

const show = (value) => (value === null || value === undefined || value === '' ? null : value)

// Referral detail / status view for ONE of the farmer's own referrals
// (GET /api/referrals/:id - 404 for anything that is not theirs). Shows which
// health report was referred, who received it, the current status with a plain
// language explanation, and any response from the professional.
export default function ReferralDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const [referral, setReferral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [notice, setNotice] = useState(location.state?.notice || null)

  const professional = referral ? referral.professional || {} : {}
  const report = referral ? referral.report || {} : {}

  useDocumentTitle(referral ? `Referral to ${professional.name || 'professional'}` : 'Referral')

  const loadReferral = useCallback(() => {
    return getReferral(id)
      .then((data) => {
        setReferral(data)
        setLoadError(null)
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    loadReferral()
  }, [loadReferral])

  const reloadReferral = () => {
    setLoading(true)
    setLoadError(null)
    loadReferral()
  }

  const animalLabel = report.animal
    ? ANIMAL_TYPE_LABELS[report.animal.animalType] || report.animal.animalType
    : null
  const farmerMessage = show(referral ? referral.farmerMessage : null)
  const professionalResponse = show(referral ? referral.professionalResponse : null)

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/farmer/referrals"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to referrals
        </Link>
      </div>

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading this referral…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load this referral">
          <p>{loadError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={reloadReferral} className="btn btn-secondary">
              <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
            <Link to="/farmer/referrals" className="btn btn-ghost">
              Back to referrals
            </Link>
          </div>
        </AlertMessage>
      ) : (
        <>
          {notice && (
            <AlertMessage variant="success" title="Referral sent">
              <div className="flex items-start justify-between gap-3">
                <p>{notice}</p>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss message"
                  className="shrink-0 rounded-md p-1 hover:bg-forest-100"
                >
                  <FiX className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </AlertMessage>
          )}

          {/* Status header */}
          <header className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
                  Referral
                </p>
                <h1 className="mt-1 text-xl font-bold text-charcoal-900 sm:text-2xl">
                  {professional.name
                    ? `Referred to ${professional.name}`
                    : 'Referred to a veterinary professional'}
                </h1>
                <p className="mt-1 text-xs text-charcoal-500">
                  Sent {formatDate(referral.createdAt)}
                  {referral.updatedAt && referral.updatedAt !== referral.createdAt
                    ? ` · Updated ${formatDate(referral.updatedAt)}`
                    : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <ReferralStatusBadge status={referral.status} />
                <button
                  type="button"
                  onClick={reloadReferral}
                  disabled={loading}
                  className="btn btn-secondary shrink-0"
                >
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
                  Refresh status
                </button>
              </div>
            </div>

            {/* Plain-language meaning of the current status */}
            <div className="mt-4 border-t border-charcoal-100 pt-4">
              <h2 className="text-sm font-semibold text-charcoal-800">What this status means</h2>
              <p className="mt-1 text-sm leading-relaxed text-charcoal-700">
                {REFERRAL_STATUS_EXPLANATIONS[referral.status] || referral.status}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
                {REFERRAL_STATUS_NEXT[referral.status] || ''}
              </p>
            </div>
          </header>

          {/* Referred health report */}
          <section className="card p-5 sm:p-6" aria-labelledby="referral-report-title">
            <h2 id="referral-report-title" className="text-base font-semibold text-charcoal-900">
              Health report that was referred
            </h2>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-charcoal-900">{report.title}</p>
                <p className="mt-1 text-sm text-charcoal-600">
                  {animalLabel ? `${animalLabel} · ` : ''}Submitted {formatDate(report.createdAt)}
                </p>
              </div>
              <RiskBadge riskLevel={report.riskLevel} />
            </div>
            <Link
              to={`/farmer/reports/${report.id}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
            >
              <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
              Open the full health report
            </Link>
            <p className="mt-4 rounded-lg border border-charcoal-200 bg-cream-100 px-3.5 py-3 text-xs leading-relaxed text-charcoal-600">
              The professional sees this report&rsquo;s details, including its AI-assisted risk
              assessment if one has been run. That assessment is health guidance, not a confirmed
              diagnosis.
            </p>
          </section>

          {/* Receiving professional */}
          <section className="card p-5 sm:p-6" aria-labelledby="referral-professional-title">
            <h2
              id="referral-professional-title"
              className="text-base font-semibold text-charcoal-900"
            >
              Who received this referral
            </h2>
            <div className="mt-4">
              <p className="font-semibold text-charcoal-900">
                {professional.name || 'Veterinary professional'}
              </p>
              <p className="mt-0.5 text-sm text-charcoal-600">
                {professional.professionalType || 'Professional'}
              </p>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-start gap-2 text-charcoal-700">
                <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
                <dd>
                  {show(professional.district) || '—'}
                  {professional.province ? `, ${professional.province}` : ''}
                </dd>
              </div>
              {show(professional.specialisation) && (
                <div className="flex items-start gap-2 text-charcoal-700">
                  <FiMapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400"
                    aria-hidden="true"
                  />
                  <dd>Specialises in {professional.specialisation}</dd>
                </div>
              )}
              {show(professional.phone) && (
                <div className="flex items-start gap-2 text-charcoal-700">
                  <FiPhone className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
                  <dd>{professional.phone}</dd>
                </div>
              )}
              {show(professional.email) && (
                <div className="flex items-start gap-2 text-charcoal-700">
                  <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
                  <dd>{professional.email}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Message + response */}
          <section className="card p-5 sm:p-6" aria-labelledby="referral-conversation-title">
            <h2
              id="referral-conversation-title"
              className="text-base font-semibold text-charcoal-900"
            >
              Messages
            </h2>

            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Your message
              </h3>
              {farmerMessage ? (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-charcoal-800">
                  {farmerMessage}
                </p>
              ) : (
                <p className="mt-1 text-sm text-charcoal-500">
                  You did not add a message to this referral.
                </p>
              )}
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                Response from the professional
              </h3>
              {professionalResponse ? (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-charcoal-800">
                  {professionalResponse}
                </p>
              ) : (
                <p className="mt-1 text-sm text-charcoal-500">
                  {referral.status === 'DECLINED'
                    ? 'The professional did not accept this referral, so there is no response.'
                    : 'No response yet. The professional’s reply will appear here when they send one.'}
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}


