import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiAlertTriangle,
  FiBarChart2,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiShare2,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import { FaPaw, FaUserMd } from 'react-icons/fa'
import { getAdminStats } from '../../api/admin'
import DashboardStatCard from '../../components/farmer/DashboardStatCard'
import RiskOverviewCard from '../../components/admin/RiskOverviewCard'
import AlertOverviewCard from '../../components/admin/AlertOverviewCard'
import StatBreakdownCard from '../../components/admin/StatBreakdownCard'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { REPORT_STATUS_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'

// Display labels for backend REFERRAL_STATUSES (UI metadata only).
const REFERRAL_STATUS_LABELS = Object.freeze({
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
})

// Fixed row order for the two breakdown lists (matches backend enums).
const REPORT_STATUS_ORDER = Object.freeze(['PENDING', 'REVIEWED', 'REFERRED', 'RESOLVED'])
const REFERRAL_STATUS_ORDER = Object.freeze([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
])

// Admin console dashboard. A single GET /api/admin/stats request is the only
// source of truth for every number on this page - there is no mock data, no
// invented statistics and no repeated requests to the same endpoint. The stats
// response carries no recent-activity list, so none is fabricated; the same
// aggregates are presented as overview cards and breakdown lists instead.
export default function AdminDashboardPage() {
  useDocumentTitle('Admin Dashboard')

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

  const reloadStats = () => {
    setLoading(true)
    setLoadError(null)
    loadStats()
  }

  // Defensive reads: the backend always sends this shape (verified by
  // adminSmokeTest), but each section degrades safely instead of crashing.
  const users = statistics?.users || {}
  const professionals = statistics?.professionals || {}
  const reports = statistics?.reports || {}
  const alerts = statistics?.alerts || {}
  const referrals = statistics?.referrals || {}
  const reportStatuses = reports.byStatus || {}
  const referralStatuses = referrals.byStatus || {}

  const reportStatusRows = REPORT_STATUS_ORDER.map((key) => ({
    key,
    label: REPORT_STATUS_LABELS[key] || key,
    count: reportStatuses[key] || 0,
  }))
  const referralStatusRows = REFERRAL_STATUS_ORDER.map((key) => ({
    key,
    label: REFERRAL_STATUS_LABELS[key] || key,
    count: referralStatuses[key] || 0,
  }))

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Admin console
          </p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-charcoal-600">
            Platform-wide totals from the live database - accounts, reports, referrals and alerts.
          </p>
        </div>
        <Link to="/admin/alerts" className="btn btn-primary self-start sm:self-auto">
          <FiAlertTriangle className="h-4 w-4" aria-hidden="true" />
          Review alerts
        </Link>
      </header>

      {/* One request drives the whole dashboard, so one clear error is enough. */}
      {loadError && (
        <AlertMessage variant="error" title="Could not load the platform statistics">
          <p>{loadError}</p>
          <button type="button" onClick={reloadStats} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      )}

      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite">
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading platform statistics…</p>
        </div>
      ) : (
        !loadError && (
          <>
            {/* Summary cards - every value straight from the stats response. */}
            <section
              aria-label="Platform overview"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <DashboardStatCard
                icon={FiUsers}
                label="Total users"
                value={users.total || 0}
                sub="All registered accounts"
              />
              <DashboardStatCard
                icon={FaPaw}
                label="Farmers"
                value={users.farmers || 0}
                sub="Farmer accounts"
                tone="earth"
              />
              <DashboardStatCard
                icon={FaUserMd}
                label="Veterinary professionals"
                value={users.veterinaryProfessionals || 0}
                sub="Professional accounts"
              />
              <DashboardStatCard
                icon={FiUser}
                label="Directory profiles"
                value={professionals.total || 0}
                sub={`${professionals.active || 0} active in the directory`}
              />
              <DashboardStatCard
                icon={FiFileText}
                label="Health reports"
                value={reports.total || 0}
                sub="Submitted by farmers"
              />
              <DashboardStatCard
                icon={FiClock}
                label="Awaiting review"
                value={reportStatuses.PENDING || 0}
                sub="Reports still pending triage review"
                tone="warning"
              />
              <DashboardStatCard
                icon={FiShare2}
                label="Referrals"
                value={referrals.total || 0}
                sub="Farmer-to-vet referrals"
              />
              <DashboardStatCard
                icon={FiAlertTriangle}
                label="Active alerts"
                value={alerts.active || 0}
                sub={
                  (alerts.total || 0) === 0
                    ? 'No alerts generated yet'
                    : `${alerts.total} generated in total`
                }
                tone={(alerts.active || 0) > 0 ? 'warning' : 'default'}
              />
            </section>

            {/* Risk + alert overviews side by side. */}
            <div className="grid gap-4 lg:grid-cols-2">
              <RiskOverviewCard reports={reports} />
              <AlertOverviewCard alerts={alerts} />
            </div>

            {/* Status breakdowns from the same aggregates (the stats endpoint
                returns no recent-activity feed, so none is invented here). */}
            <div className="grid gap-4 lg:grid-cols-2">
              <StatBreakdownCard
                title="Reports by status"
                total={reports.total}
                rows={reportStatusRows}
                emptyTitle="No health reports yet"
                emptyDescription="Health reports submitted by farmers will be broken down by status here."
              />
              <StatBreakdownCard
                title="Referrals by status"
                total={referrals.total}
                rows={referralStatusRows}
                emptyTitle="No referrals yet"
                emptyDescription="Referrals farmers create for veterinary professionals will appear here."
              />
            </div>

            {/* Navigation only - these modules are built in later phases. */}
            <section aria-label="Admin modules" className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">
                Admin modules
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Link
                  to="/admin/alerts"
                  className="card flex gap-4 p-5 transition hover:border-forest-300"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700"
                    aria-hidden="true"
                  >
                    <FiAlertTriangle className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-charcoal-900">Alerts</span>
                    <span className="mt-1 block text-xs leading-relaxed text-charcoal-600">
                      Review active alerts and acknowledge the ones you have handled.
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-forest-700">
                      Open module
                    </span>
                  </span>
                </Link>
                <Link
                  to="/admin/statistics"
                  className="card flex gap-4 p-5 transition hover:border-forest-300"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700"
                    aria-hidden="true"
                  >
                    <FiBarChart2 className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-charcoal-900">
                      Statistics
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-charcoal-600">
                      Deeper breakdowns of reports, referrals and geography.
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-forest-700">
                      Open module
                    </span>
                  </span>
                </Link>
                <Link
                  to="/admin/oversight"
                  className="card flex gap-4 p-5 transition hover:border-forest-300"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-earth-50 text-earth-700"
                    aria-hidden="true"
                  >
                    <FiShield className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-charcoal-900">Oversight</span>
                    <span className="mt-1 block text-xs leading-relaxed text-charcoal-600">
                      Review farms, reports and referrals across the platform.
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-forest-700">
                      Open module
                    </span>
                  </span>
                </Link>
              </div>
            </section>
          </>
        )
      )}
    </div>
  )
}