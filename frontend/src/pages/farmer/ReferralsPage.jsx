import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiRefreshCw, FiSearch, FiShare2 } from 'react-icons/fi'
import { getMyReferrals } from '../../api/referrals'
import ReferralCard from '../../components/farmer/ReferralCard'
import ReferralStatusBadge from '../../components/farmer/ReferralStatusBadge'
import DashboardStatCard from '../../components/farmer/DashboardStatCard'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { REFERRAL_STATUS_EXPLANATIONS, REFERRAL_STATUS_LABELS } from '../../utils/referrals'
import { getApiErrorMessage } from '../../utils/errors'

// Farmer referrals: real records from GET /api/referrals (newest first).
// Each referral carries its report (with animal) and the public view of the
// assigned veterinary professional.
export default function ReferralsPage() {
  useDocumentTitle('Referrals')

  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const loadReferrals = useCallback(() => {
    return getMyReferrals()
      .then((list) => {
        setReferrals(Array.isArray(list) ? list : [])
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
    loadReferrals()
  }, [loadReferrals])

  const reloadReferrals = () => {
    setLoading(true)
    setLoadError(null)
    loadReferrals()
  }

  const summary = useMemo(
    () => ({
      total: referrals.length,
      pending: referrals.filter((referral) => referral.status === 'PENDING').length,
      active: referrals.filter((referral) =>
        ['ACCEPTED', 'IN_PROGRESS'].includes(referral.status),
      ).length,
      completed: referrals.filter((referral) => referral.status === 'COMPLETED').length,
    }),
    [referrals],
  )

  const visibleReferrals = useMemo(() => {
    const query = search.trim().toLowerCase()
    return referrals.filter((referral) => {
      if (status && referral.status !== status) return false
      if (!query) return true
      const professional = referral.professional || {}
      const report = referral.report || {}
      return [professional.name, professional.district, professional.province, report.title]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    })
  }, [referrals, search, status])

  const filtersActive = search.trim() !== '' || status !== ''

  const clearFilters = () => {
    setSearch('')
    setStatus('')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            My Farm
          </p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Referrals</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal-600">
            Health reports you have shared with veterinary professionals. Open a referral
            to see its status and any response from the professional.
          </p>
        </div>
        <button
          type="button"
          onClick={reloadReferrals}
          disabled={loading}
          className="btn btn-secondary shrink-0"
        >
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status">
          <Spinner />
          <p className="text-sm text-charcoal-600">Loading your referrals…</p>
        </div>
      ) : loadError ? (
        <AlertMessage
          variant="error"
          title="Could not load your referrals"
          message={loadError}
          action={
            <button type="button" onClick={reloadReferrals} className="btn btn-secondary">
              Try again
            </button>
          }
        />
      ) : referrals.length === 0 ? (
        <EmptyState
          icon={FiShare2}
          title="No referrals yet"
          description="When you share a health report with a veterinary professional, it will appear here with its status."
          action={
            <Link to="/farmer/reports" className="btn btn-primary">
              View health reports
            </Link>
          }
        />
      ) : (
        <>
          <section
            aria-label="Referral summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <DashboardStatCard
              icon={FiShare2}
              label="Total referrals"
              value={summary.total}
              sub="Reports shared with professionals"
            />
            <DashboardStatCard
              icon={FiShare2}
              label="Awaiting review"
              value={summary.pending}
              sub={REFERRAL_STATUS_EXPLANATIONS.PENDING}
              tone="warning"
            />
            <DashboardStatCard
              icon={FiShare2}
              label="Being handled"
              value={summary.active}
              sub="Accepted or in progress"
              tone="earth"
            />
            <DashboardStatCard
              icon={FiShare2}
              label="Completed"
              value={summary.completed}
              sub={REFERRAL_STATUS_EXPLANATIONS.COMPLETED}
            />
          </section>

          <section aria-label="Filter referrals" className="card p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="referral-search" className="field-label">
                  Search
                </label>
                <div className="relative">
                  <FiSearch
                    className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-charcoal-400"
                    aria-hidden="true"
                  />
                  <input
                    id="referral-search"
                    type="text"
                    className="field-input pl-10"
                    placeholder="Professional, place or report title"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="referral-status" className="field-label">
                  Status
                </label>
                <select
                  id="referral-status"
                  className="field-input"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {Object.entries(REFERRAL_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {filtersActive && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-charcoal-500" role="status">
                Showing {visibleReferrals.length} of {referrals.length} referrals
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-forest-700 underline-offset-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {visibleReferrals.length === 0 ? (
            <EmptyState
              icon={FiSearch}
              title="No referrals match your filters"
              description="Try a different search term, or clear the filters to see all your referrals."
              action={
                <button type="button" onClick={clearFilters} className="btn btn-secondary">
                  Clear search and filters
                </button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {visibleReferrals.map((referral) => (
                <ReferralCard key={referral.id} referral={referral} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
