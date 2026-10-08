import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { FiArrowLeft, FiRefreshCw, FiShare2, FiX } from 'react-icons/fi'
import { getHealthReport, runTriage } from '../../api/healthReports'
import ReferralStatusBadge from '../../components/farmer/ReferralStatusBadge'
import ReportStatusBadge from '../../components/farmer/ReportStatusBadge'
import RiskBadge from '../../components/farmer/RiskBadge'
import TriageResult from '../../components/farmer/TriageResult'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '—')
const show = (value) => (value === null || value === undefined || value === '' ? '—' : value)

// Full detail for one of the farmer's own health reports, including the
// AI-assisted risk assessment (run on demand against POST /reports/:id/triage).
export default function HealthReportDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [triage, setTriage] = useState(null)
  const [assessing, setAssessing] = useState(false)
  const [triageError, setTriageError] = useState(null)
  const [notice, setNotice] = useState(location.state?.notice || null)

  useDocumentTitle(report ? report.title : 'Health Report')

  const loadReport = useCallback(() => {
    return getHealthReport(id)
      .then((data) => {
        setReport(data)
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
    loadReport()
  }, [loadReport])

  const reloadReport = () => {
    setLoading(true)
    setLoadError(null)
    loadReport()
  }

  const handleTriage = () => {
    if (assessing) return
    setAssessing(true)
    setTriageError(null)

    runTriage(id)
      .then((result) => {
        setReport(result.report || report)
        setTriage(result.aiTriage)
      })
      .catch((error) => {
        setTriageError(getApiErrorMessage(error))
      })
      .finally(() => {
        setAssessing(false)
      })
  }

  // Show the live triage payload, or the assessment already stored on the report.
  const storedTriage =
    report && report.aiAssessment
      ? {
          riskLevel: report.riskLevel,
          assessment: report.aiAssessment,
          recommendations: report.aiRecommendations,
        }
      : null
  const shownTriage = triage || storedTriage
  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/farmer/reports"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to health reports
        </Link>
      </div>

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading this health report…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load this health report">
          <p>{loadError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={reloadReport} className="btn btn-secondary">
              <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
            <Link to="/farmer/reports" className="btn btn-ghost">
              Back to health reports
            </Link>
          </div>
        </AlertMessage>
      ) : (
        <>
          {notice && (
            <AlertMessage variant="warning" title="Report saved">
              <div className="flex items-start justify-between gap-3">
                <p>{notice}</p>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss message"
                  className="shrink-0 rounded-md p-1 hover:bg-amber-100"
                >
                  <FiX className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </AlertMessage>
          )}

          {/* Header */}
          <header className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
                  Health report
                </p>
                <h1 className="mt-1 text-xl font-bold text-charcoal-900 sm:text-2xl">
                  {report.title}
                </h1>
                <p className="mt-1 text-xs text-charcoal-500">
                  Submitted {formatDate(report.createdAt)}
                  {report.updatedAt ? ` · Updated ${formatDate(report.updatedAt)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <RiskBadge riskLevel={report.riskLevel} />
                <ReportStatusBadge status={report.status} />
              </div>
            </div>

            <div className="mt-4 border-t border-charcoal-100 pt-4">
              {assessing ? (
                <p
                  className="flex items-center gap-2 text-sm font-medium text-charcoal-700"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner className="h-4 w-4 text-forest-700" />
                  Assessing the health report…
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleTriage}
                  className="btn btn-primary"
                  aria-busy={assessing}
                >
                  {shownTriage ? 'Re-run AI risk assessment' : 'Run AI risk assessment'}
                </button>
              )}
              <p className="mt-2 text-xs leading-relaxed text-charcoal-500">
                VetAlert rates the risk using the information in this report. This is health
                guidance, not a veterinary diagnosis.
              </p>
            </div>
          </header>

          {triageError && (
            <AlertMessage variant="error" title="The risk assessment could not be completed">
              <p>{triageError}</p>
              <p>Your report is safe — you can try the assessment again.</p>
            </AlertMessage>
          )}

          {/* Referral entry point + any referrals already made for this report */}
          <section className="card p-5 sm:p-6" aria-labelledby="report-referrals-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="report-referrals-title"
                  className="text-base font-semibold text-charcoal-900"
                >
                  Referrals
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-charcoal-600">
                  Share this report with a veterinary professional so they can review the details
                  and respond here. A referral is a request for veterinary attention — it does not
                  confirm that any disease is present.
                </p>
              </div>
              <Link
                to={`/farmer/veterinarians?report=${report.id}`}
                className="btn btn-primary shrink-0"
              >
                <FiShare2 className="h-4 w-4" aria-hidden="true" />
                Refer to a veterinarian
              </Link>
            </div>

            {(report.referrals || []).length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-charcoal-100 pt-4">
                {(report.referrals || []).map((referral) => (
                  <li key={referral.id}>
                    <Link
                      to={`/farmer/referrals/${referral.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-charcoal-200 px-4 py-3 transition hover:border-forest-300"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-charcoal-900">
                          {referral.professional
                            ? referral.professional.name
                            : 'Veterinary professional'}
                        </span>
                        <span className="block text-xs text-charcoal-500">
                          Referred {formatDate(referral.createdAt)}
                        </span>
                      </span>
                      <ReferralStatusBadge status={referral.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 border-t border-charcoal-100 pt-4 text-sm text-charcoal-500">
                This report has not been referred to anyone yet.
              </p>
            )}
          </section>

          {shownTriage && <TriageResult triage={shownTriage} />}

          {/* Report details */}
          <section className="card p-5 sm:p-6" aria-labelledby="report-details-title">
            <h2
              id="report-details-title"
              className="text-base font-semibold text-charcoal-900"
            >
              Report details
            </h2>

            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                What was reported
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-charcoal-800">
                {report.description}
              </p>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Animal
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">
                  {report.animal
                    ? `${report.animal.name || 'Unnamed animal'} (${
                        ANIMAL_TYPE_LABELS[report.animal.animalType] || report.animal.animalType
                      })${report.animal.tagNumber ? ` · ${report.animal.tagNumber}` : ''}`
                    : 'General farm report'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Signs recorded
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">
                  {(report.symptoms || []).length
                    ? (report.symptoms || [])
                        .map((link) => (link.symptom ? link.symptom.name : null))
                        .filter(Boolean)
                        .join(', ')
                    : 'None recorded'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  How long
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">
                  {show(report.symptomsDuration)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Appetite
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">
                  {show(report.appetite)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Difficulty breathing
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">
                  {yesNo(report.breathingDifficulty)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Animals affected
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">
                  {report.affectedAnimals != null ? report.affectedAnimals : '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Moved between farms
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">
                  {yesNo(report.recentMovement)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                  Vaccinated recently
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">
                  {yesNo(report.recentVaccination)}
                </dd>
              </div>

              {report.recentTreatment && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                    Treatment already given
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm font-medium text-charcoal-800">
                    {report.recentTreatment}
                  </dd>
                </div>
              )}

              {report.additionalNotes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">
                    Additional notes
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm font-medium text-charcoal-800">
                    {report.additionalNotes}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </>
      )}
    </div>
  )
}