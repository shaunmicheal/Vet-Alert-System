import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBarChart2,
  FiFileText,
  FiInfo,
  FiRefreshCw,
  FiUsers,
} from 'react-icons/fi'
import { FaUserMd } from 'react-icons/fa'
import { getAdminStats } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { REPORT_STATUS_LABELS, RISK_LEVEL_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'

const REPORT_STATUS_ORDER = ['PENDING', 'REVIEWED', 'REFERRED', 'RESOLVED']
const REPORT_STATUS_BADGES = {
  PENDING: 'bg-amber-100 text-amber-800',
  REVIEWED: 'bg-sky-100 text-sky-800',
  REFERRED: 'bg-earth-100 text-earth-800',
  RESOLVED: 'bg-forest-100 text-forest-800',
}

const RISK_ORDER = ['LOW', 'MODERATE', 'HIGH', 'UNSET']
const RISK_LABELS = { ...RISK_LEVEL_LABELS, UNSET: 'Not yet assessed' }
const RISK_BADGES = {
  LOW: 'bg-forest-100 text-forest-800',
  MODERATE: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-red-100 text-red-800',
  UNSET: 'bg-charcoal-100 text-charcoal-700',
}

function Badge({ tone, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      {children}
    </span>
  )
}

function EmptyNote({ title, description }) {
  return (
    <div className="rounded-lg border border-charcoal-100 bg-cream-100 px-4 py-5">
      <p className="text-sm font-semibold text-charcoal-800">{title}</p>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-charcoal-600">{description}</p>
      )}
    </div>
  )
}

function CategoryCard({ id, icon: Icon, title, children }) {
  return (
    <section className="card flex flex-col p-5" aria-labelledby={id}>
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
        <h2 id={id} className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">
          {title}
        </h2>
      </div>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  )
}

function AvailabilityNote({ children }) {
  return (
    <div className="mt-auto">
      <p className="mt-4 border-t border-charcoal-100 pt-3 text-xs leading-relaxed text-charcoal-500">
        {children}
      </p>
    </div>
  )
}

export default function AdminOversightPage() {
  useDocumentTitle('Oversight')

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
  const professionals = statistics?.professionals || {}
  const reports = statistics?.reports || {}
  const reportStatuses = reports.byStatus || {}
  const riskLevels = reports.byRiskLevel || {}

  const userTotal = users.total || 0
  const profileTotal = professionals.total || 0
  const reportTotal = reports.total || 0

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Admin console
          </p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900 sm:text-3xl">Oversight</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-charcoal-600">
            Read-only administrative review of platform records. This page shows exactly
            what the admin API supports today - aggregate oversight of accounts, veterinary
            professionals and health reports - and marks each unavailable listing or action
            instead of faking it.
          </p>
        </div>
        <Link to="/admin" className="btn btn-secondary self-start sm:self-auto">
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </header>

      {loadError && (
        <AlertMessage variant="error" title="Could not load the oversight data">
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
          <p className="text-sm font-medium text-charcoal-600">Loading oversight data…</p>
        </div>
      ) : (
        !loadError && (
          <>
            <section
              aria-label="Record categories"
              className="grid gap-4 lg:grid-cols-3"
            >
              <CategoryCard
                id="oversight-accounts-title"
                icon={FiUsers}
                title="User accounts"
              >
                {userTotal === 0 ? (
                  <EmptyNote
                    title="No user accounts yet"
                    description="Registered farmer, veterinary professional and administrator accounts will be counted here."
                  />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-charcoal-900">{userTotal}</p>
                    <p className="mt-1 text-sm text-charcoal-600">
                      Registered accounts across every role
                    </p>
                    <dl className="mt-4 space-y-2 border-t border-charcoal-100 pt-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-charcoal-600">Farmers</dt>
                        <dd className="font-semibold text-charcoal-900 tabular-nums">
                          {users.farmers || 0}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-charcoal-600">Veterinary professionals</dt>
                        <dd className="font-semibold text-charcoal-900 tabular-nums">
                          {users.veterinaryProfessionals || 0}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-charcoal-600">Administrators</dt>
                        <dd className="font-semibold text-charcoal-900 tabular-nums">
                          {users.admins || 0}
                        </dd>
                      </div>
                    </dl>
                  </>
                )}
                <AvailabilityNote>
                  Aggregate counts only. The admin API has no endpoint to list individual
                  accounts, change roles, or activate and deactivate accounts, so no account
                  controls are offered here.
                </AvailabilityNote>
              </CategoryCard>

              <CategoryCard
                id="oversight-professionals-title"
                icon={FaUserMd}
                title="Veterinary professionals"
              >
                {profileTotal === 0 ? (
                  <EmptyNote
                    title="No directory profiles yet"
                    description="Veterinary professional profiles created through the directory will be counted here."
                  />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-charcoal-900">{profileTotal}</p>
                    <p className="mt-1 text-sm text-charcoal-600">
                      Directory profiles, {professionals.active || 0} active
                    </p>
                    <dl className="mt-4 space-y-2 border-t border-charcoal-100 pt-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-charcoal-600">Registered professional accounts</dt>
                        <dd className="font-semibold text-charcoal-900 tabular-nums">
                          {users.veterinaryProfessionals || 0}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-charcoal-600">Inactive profiles</dt>
                        <dd className="font-semibold text-charcoal-900 tabular-nums">
                          {profileTotal - (professionals.active || 0)}
                        </dd>
                      </div>
                    </dl>
                  </>
                )}
                <AvailabilityNote>
                  Profile records come from the directory endpoint, which is limited to farmers
                  and veterinary professionals - administrators receive aggregate counts only.
                  No backend endpoint lets an administrator activate or deactivate a profile.
                </AvailabilityNote>
              </CategoryCard>

              <CategoryCard
                id="oversight-reports-title"
                icon={FiFileText}
                title="Health reports"
              >
                {reportTotal === 0 ? (
                  <EmptyNote
                    title="No health reports yet"
                    description="Reports submitted by farmers will be counted by workflow status and triage risk here."
                  />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-charcoal-900">{reportTotal}</p>
                    <p className="mt-1 text-sm text-charcoal-600">Submitted by farmers</p>
                    <div className="mt-4 border-t border-charcoal-100 pt-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                        Workflow status
                      </h3>
                      <dl className="mt-2 space-y-2">
                        {REPORT_STATUS_ORDER.filter((key) => key in reportStatuses).map(
                          (key) => (
                            <div
                              key={key}
                              className="flex items-center justify-between gap-2"
                            >
                              <dt>
                                <Badge tone={REPORT_STATUS_BADGES[key]}>
                                  {REPORT_STATUS_LABELS[key] || key}
                                </Badge>
                              </dt>
                              <dd className="text-sm font-semibold text-charcoal-900 tabular-nums">
                                {reportStatuses[key] || 0}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </div>
                    <div className="mt-4 border-t border-charcoal-100 pt-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                        Triage risk
                      </h3>
                      <dl className="mt-2 space-y-2">
                        {RISK_ORDER.filter((key) => key in riskLevels).map((key) => (
                          <div key={key} className="flex items-center justify-between gap-2">
                            <dt>
                              <Badge tone={RISK_BADGES[key]}>{RISK_LABELS[key] || key}</Badge>
                            </dt>
                            <dd className="text-sm font-semibold text-charcoal-900 tabular-nums">
                              {riskLevels[key] || 0}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </>
                )}
                <AvailabilityNote>
                  Risk levels are triage indicators, not diagnoses - a high-risk report does
                  not confirm a disease or outbreak. Individual reports are farmer-scoped, so
                  record-level review is only possible for reports linked to an alert, from
                  the Alerts module.
                </AvailabilityNote>
              </CategoryCard>
            </section>

            <section aria-labelledby="oversight-scope-title" className="card p-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-earth-50 text-earth-700"
                  aria-hidden="true"
                >
                  <FiInfo className="h-5 w-5" />
                </span>
                <h2
                  id="oversight-scope-title"
                  className="text-sm font-semibold uppercase tracking-wider text-charcoal-500"
                >
                  Scope of this module
                </h2>
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal-600">
                <li>
                  <span className="font-semibold text-charcoal-800">
                    Accounts and profiles:
                  </span>{' '}
                  aggregate counts only. No endpoint lists individual users, and none lets an
                  administrator activate, deactivate or change the role of an account.
                </li>
                <li>
                  <span className="font-semibold text-charcoal-800">
                    Farm and referral records:
                  </span>{' '}
                  those endpoints are farmer-scoped and reject the admin role, so per-record
                  lists are not available here; aggregate referral counts are shown on the
                  Statistics page.
                </li>
                <li>
                  <span className="font-semibold text-charcoal-800">Search and filters:</span>{' '}
                  there is no admin record listing on this page to filter. Alert filtering
                  lives in the Alerts module.
                </li>
                <li>
                  <span className="font-semibold text-charcoal-800">
                    Administrative actions:
                  </span>{' '}
                  alert acknowledgement and system-alert creation are supported by the backend
                  and live in the Alerts module. Account-level administrative actions are not
                  supported by any endpoint and are therefore not offered here.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3 border-t border-charcoal-100 pt-4">
                <Link to="/admin/alerts" className="btn btn-secondary">
                  <FiAlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Review alert-linked reports
                </Link>
                <Link to="/admin/statistics" className="btn btn-secondary">
                  <FiBarChart2 className="h-4 w-4" aria-hidden="true" />
                  Open statistics
                </Link>
              </div>
            </section>
          </>
        )
      )}
    </div>
  )
}
