import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiFileText,
  FiRefreshCw,
  FiShare2,
  FiShield,
  FiUsers,
} from 'react-icons/fi'
import { getAdminStats } from '../../api/admin'
import AlertTypeList from '../../components/admin/AlertTypeList'
import AnimalTypeList from '../../components/admin/AnimalTypeList'
import DistributionBar from '../../components/admin/DistributionBar'
import PlatformCard from '../../components/admin/PlatformCard'
import ProvinceList from '../../components/admin/ProvinceList'
import ReferralStatusList from '../../components/admin/ReferralStatusList'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { REPORT_STATUS_LABELS, RISK_LEVEL_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'

const RISK_ORDER = ['LOW', 'MODERATE', 'HIGH', 'UNSET']
const RISK_LABELS = { ...RISK_LEVEL_LABELS, UNSET: 'Not yet assessed' }
const RISK_TONES = {
  LOW: 'bg-forest-700',
  MODERATE: 'bg-amber-500',
  HIGH: 'bg-red-500',
  UNSET: 'bg-charcoal-400',
}

const REPORT_STATUS_ORDER = ['PENDING', 'REVIEWED', 'REFERRED', 'RESOLVED']
const REPORT_STATUS_TONES = {
  PENDING: 'bg-amber-500',
  REVIEWED: 'bg-sky-500',
  REFERRED: 'bg-earth-500',
  RESOLVED: 'bg-forest-600',
}

function EmptyNote({ title, description }) {
  return (
    <div className="mt-4 rounded-lg border border-charcoal-100 bg-cream-100 px-4 py-5">
      <p className="text-sm font-semibold text-charcoal-800">{title}</p>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-charcoal-600">{description}</p>
      )}
    </div>
  )
}

function SafetyNote({ children }) {
  return (
    <p className="mt-4 border-t border-charcoal-100 pt-3 text-xs leading-relaxed text-charcoal-500">
      {children}
    </p>
  )
}

export default function AdminStatisticsPage() {
  useDocumentTitle('Statistics & Analytics')

  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const loadStats = useCallback(() => {
    return getAdminStats()
      .then((stats) => {
        if (!stats || typeof stats !== 'object') {
          setLoadError('The server sent an unexpected response. Please try again.')
          return
        }
        setStatistics(stats)
        setLoadError(null)
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const reloadStats = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    loadStats()
  }, [loadStats])

  const users = statistics?.users || {}
  const reports = statistics?.reports || {}
  const alerts = statistics?.alerts || {}
  const referrals = statistics?.referrals || {}

  const reportStatuses = reports.byStatus || {}
  const riskLevels = reports.byRiskLevel || {}
  const provinces = reports.byProvince || {}
  const animalTypes = reports.byAnimalType || {}
  const alertTypes = alerts.byType || {}
  const referralStatuses = referrals.byStatus || {}

  const hasRisk = Boolean(reports.byRiskLevel)
  const hasStatus = Boolean(reports.byStatus)
  const hasProvince = Boolean(reports.byProvince)
  const hasAnimalType = Boolean(reports.byAnimalType)
  const hasReferralStatus = Boolean(referrals.byStatus)
  const hasAlertTypes = Boolean(alerts.byType)

  const reportTotal = reports.total || 0
  const referralTotal = referrals.total || 0
  const alertTotal = alerts.total || 0
  const activeAlerts = alerts.active || 0

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Admin console
          </p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900 sm:text-3xl">
            Statistics &amp; Analytics
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-charcoal-600">
            Aggregate system-level information for administrative monitoring. The
            distributions and comparisons below come from a single live request to
            the platform statistics endpoint - no mock data and no fabricated
            metrics.
          </p>
        </div>
        <Link to="/admin" className="btn btn-secondary self-start sm:self-auto">
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </header>

      {loadError && (
        <AlertMessage variant="error" title="Could not load the statistics">
          <p>{loadError}</p>
          <button type="button" onClick={reloadStats} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      )}

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading statistics…</p>
        </div>
      ) : (
        !loadError && (
          <>
            <section
              aria-label="Platform overview"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <PlatformCard
                icon={FiUsers}
                label="Platform users"
                value={users.total || 0}
                sub={`${users.farmers || 0} farmers · ${users.veterinaryProfessionals || 0} veterinary professionals · ${users.admins || 0} admins`}
                to="/admin/users"
              />
              <PlatformCard
                icon={FiFileText}
                label="Health reports"
                value={reportTotal}
                sub={`${reportStatuses.PENDING || 0} awaiting review`}
                to="/admin/reports"
              />
              <PlatformCard
                icon={FiShare2}
                label="Referrals"
                value={referralTotal}
                sub={`${referralStatuses.PENDING || 0} pending · ${referralStatuses.IN_PROGRESS || 0} in progress`}
                to="/admin/referrals"
              />
              <PlatformCard
                icon={FiAlertTriangle}
                label="Alerts raised"
                value={alertTotal}
                sub={`${activeAlerts} currently active`}
                tone={activeAlerts > 0 ? 'warning' : 'default'}
                to="/admin/alerts?status=ACTIVE"
              />
            </section>

            <section aria-label="Report analytics" className="grid gap-4 lg:grid-cols-2">
              {hasRisk && (
                <section className="card p-5" aria-labelledby="risk-distribution-title">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="risk-distribution-title"
                      className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
                    >
                      Report risk distribution
                    </h2>
                    <span className="text-xs text-charcoal-500">{reportTotal} reports</span>
                  </div>
                  {reportTotal === 0 ? (
                    <EmptyNote
                      title="No health reports yet"
                      description="Risk levels recorded on submitted health reports will be broken down here."
                    />
                  ) : (
                    <div className="mt-4 space-y-3">
                      {RISK_ORDER.filter((level) => level in riskLevels).map((level) => (
                        <DistributionBar
                          key={level}
                          label={RISK_LABELS[level] || level}
                          count={riskLevels[level] || 0}
                          total={reportTotal}
                          tone={RISK_TONES[level]}
                        />
                      ))}
                    </div>
                  )}
                  <SafetyNote>
                    Percentages are shares of all {reportTotal} reports. Risk levels are
                    triage indicators, not diagnoses: a high-risk report does not confirm
                    a disease or outbreak, and &ldquo;not yet assessed&rdquo; means no
                    triage decision has been recorded.
                  </SafetyNote>
                </section>
              )}

              {hasStatus && (
                <section className="card p-5" aria-labelledby="report-status-title">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="report-status-title"
                      className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
                    >
                      Report status
                    </h2>
                    <span className="text-xs text-charcoal-500">{reportTotal} reports</span>
                  </div>
                  {reportTotal === 0 ? (
                    <EmptyNote
                      title="No health reports yet"
                      description="Workflow states of submitted health reports will be listed here."
                    />
                  ) : (
                    <div className="mt-4 space-y-3">
                      {REPORT_STATUS_ORDER.filter((key) => key in reportStatuses).map(
                        (key) => (
                          <DistributionBar
                            key={key}
                            label={REPORT_STATUS_LABELS[key] || key}
                            count={reportStatuses[key] || 0}
                            total={reportTotal}
                            tone={REPORT_STATUS_TONES[key]}
                          />
                        ),
                      )}
                    </div>
                  )}
                  <SafetyNote>
                    Percentages are shares of all {reportTotal} reports; every report has
                    exactly one workflow status, so the rows add up to 100%.
                  </SafetyNote>
                </section>
              )}
            </section>

            <section
              aria-label="Geographic and animal analytics"
              className="grid gap-4 lg:grid-cols-2"
            >
              {hasProvince && (
                <section className="card p-5" aria-labelledby="province-title">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="province-title"
                      className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
                    >
                      Reports by province
                    </h2>
                    <span className="text-xs text-charcoal-500">{reportTotal} reports</span>
                  </div>
                  {reportTotal === 0 ? (
                    <EmptyNote
                      title="No reports by province"
                      description="Reports submitted by farmers will be distributed across Zimbabwe provinces here."
                    />
                  ) : (
                    <div className="mt-4">
                      <ProvinceList provinces={provinces} total={reportTotal} />
                    </div>
                  )}
                  <SafetyNote>
                    Percentages are shares of all {reportTotal} reports, sorted highest
                    first. Reports not linked to a farm province are excluded from this
                    view.
                  </SafetyNote>
                </section>
              )}

              {hasAnimalType && (
                <section className="card p-5" aria-labelledby="animal-type-title">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="animal-type-title"
                      className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
                    >
                      Reports by animal type
                    </h2>
                    <span className="text-xs text-charcoal-500">{reportTotal} reports</span>
                  </div>
                  {reportTotal === 0 ? (
                    <EmptyNote
                      title="No reports by animal type"
                      description="Reports submitted by farmers will be grouped by the animal they involve here."
                    />
                  ) : (
                    <div className="mt-4">
                      <AnimalTypeList animalTypes={animalTypes} total={reportTotal} />
                    </div>
                  )}
                  <SafetyNote>
                    Percentages are shares of all {reportTotal} reports. Categories match
                    the platform&apos;s animal types (poultry is recorded as one broad
                    category), and reports without a linked animal are excluded from this
                    view.
                  </SafetyNote>
                </section>
              )}
            </section>

            <section
              aria-label="Referral and alert analytics"
              className="grid gap-4 lg:grid-cols-2"
            >
              {hasReferralStatus && (
                <section className="card p-5" aria-labelledby="referral-status-title">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="referral-status-title"
                      className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
                    >
                      Referral status
                    </h2>
                    <span className="text-xs text-charcoal-500">{referralTotal} total</span>
                  </div>
                  <div className="mt-4">
                    <ReferralStatusList
                      referrals={referralStatuses}
                      total={referralTotal}
                    />
                  </div>
                  <SafetyNote>
                    Percentages are shares of all {referralTotal} referrals. Referral
                    statuses describe the workflow between a farmer and a veterinary
                    professional - they are not health outcomes and do not indicate
                    whether an animal is cured.
                  </SafetyNote>
                </section>
              )}

              {hasAlertTypes && (
                <section className="card p-5" aria-labelledby="alert-types-title">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2
                      id="alert-types-title"
                      className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
                    >
                      Alert types
                    </h2>
                    <Link
                      to="/admin/alerts"
                      className="text-sm font-semibold text-forest-700 underline-offset-2 hover:underline"
                    >
                      Open alerts
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-charcoal-500">
                    {alertTotal} generated in total · {activeAlerts} currently active
                  </p>
                  <div className="mt-4">
                    <AlertTypeList alertTypes={alertTypes} total={alertTotal} />
                  </div>
                  <SafetyNote>
                    Type counts are all-time generation totals, not active alerts. Possible
                    clusters are not confirmed outbreaks, and high-risk alerts are not
                    diagnoses - they flag patterns that deserve review.
                  </SafetyNote>
                </section>
              )}
            </section>

            <section
              aria-label="Related admin modules"
              className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">
                  Related modules
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-charcoal-500">
                  Move from aggregate analysis to per-record review.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/admin/alerts" className="btn btn-secondary">
                  <FiAlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Review alerts
                </Link>
                <Link to="/admin/oversight" className="btn btn-secondary">
                  <FiShield className="h-4 w-4" aria-hidden="true" />
                  Open oversight
                </Link>
              </div>
            </section>
          </>
        )
      )}
    </div>
  )
}
