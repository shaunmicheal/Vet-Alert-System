import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiFileText, FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { getMyHealthReports } from '../../api/healthReports'
import DashboardStatCard from '../../components/farmer/DashboardStatCard'
import ReportStatusBadge from '../../components/farmer/ReportStatusBadge'
import RiskBadge from '../../components/farmer/RiskBadge'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import {
  ANIMAL_TYPE_LABELS,
  RISK_LEVELS,
  RISK_LEVEL_LABELS,
  REPORT_STATUS_LABELS,
} from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

// Farmer health reports: real records from GET /api/reports.
export default function HealthReportsPage() {
  useDocumentTitle('Health Reports')

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [riskLevel, setRiskLevel] = useState('')

  // Promise-chain style (like AuthProvider) so setState never runs
  // synchronously inside the mount effect.
  const loadReports = useCallback(() => {
    return getMyHealthReports()
      .then((list) => {
        setReports(list)
        setLoadError(null)
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const reloadReports = () => {
    setLoading(true)
    setLoadError(null)
    loadReports()
  }

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Summary counts derived from the real records.
  const summary = useMemo(
    () => ({
      total: reports.length,
      open: reports.filter((report) => report.status !== 'RESOLVED').length,
      highRisk: reports.filter((report) => report.riskLevel === 'HIGH').length,
      pending: reports.filter((report) => report.status === 'PENDING').length,
    }),
    [reports],
  )

  // Client-side search + filters (the list endpoint returns every report).
  const visibleReports = useMemo(() => {
    const query = search.trim().toLowerCase()
    return reports.filter((report) => {
      if (status && report.status !== status) return false
      if (riskLevel && report.riskLevel !== riskLevel) return false
      if (!query) return true
      const symptomText = (report.symptoms || [])
        .map((link) => link.symptom && link.symptom.name)
        .filter(Boolean)
        .join(' ')
      return [report.title, report.description, symptomText].some(
        (field) => field && field.toLowerCase().includes(query),
      )
    })
  }, [reports, search, status, riskLevel])

  const filtersActive = search.trim() !== '' || status !== '' || riskLevel !== ''

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setRiskLevel('')
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            My Farm
          </p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Health Reports</h1>
          <p className="mt-1 text-sm text-charcoal-600">
            Report signs of illness and get an AI-assisted risk assessment.
          </p>
        </div>
        <Link
          to="/farmer/reports/new"
          className="btn btn-primary self-start sm:self-auto"
        >
          <FiPlus className="h-4 w-4" aria-hidden="true" />
          New Report
        </Link>
      </header>

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading your health reports…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load your health reports">
          <p>{loadError}</p>
          <button type="button" onClick={reloadReports} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FiFileText}
          title="No health reports yet"
          description="Report a health concern on your farm and VetAlert will assess the risk level and suggest what to do next."
          action={
            <Link to="/farmer/reports/new" className="btn btn-primary">
              <FiPlus className="h-4 w-4" aria-hidden="true" />
              Create your first report
            </Link>
          }
        />
      ) : (
        <>
          {/* Summary */}
          <section aria-label="Health report summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              icon={FiFileText}
              label="Total reports"
              value={summary.total}
              sub="Submitted from this farm"
            />
            <DashboardStatCard
              icon={FiFileText}
              label="Still open"
              tone="earth"
              value={summary.open}
              sub="Not yet resolved"
            />
            <DashboardStatCard
              icon={FiFileText}
              label="Awaiting review"
              tone="warning"
              value={summary.pending}
              sub="Waiting for veterinary review"
            />
            <DashboardStatCard
              icon={FiFileText}
              label="High risk"
              tone={summary.highRisk > 0 ? 'danger' : 'default'}
              value={summary.highRisk}
              sub={summary.highRisk > 0 ? 'Veterinary attention advised' : 'No high-risk reports'}
            />
          </section>
          {/* Search + filters */}
          <section
            aria-label="Search and filter health reports"
            className="flex flex-col gap-3 lg:flex-row"
          >
            <div className="relative flex-1">
              <label htmlFor="report-search" className="sr-only">
                Search health reports
              </label>
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
                aria-hidden="true"
              />
              <input
                id="report-search"
                type="text"
                className="field-input pl-10 pr-10"
                placeholder="Search by title, description or signs"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800"
                >
                  <FiX className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-96">
              <div>
                <label htmlFor="report-status-filter" className="sr-only">
                  Filter by status
                </label>
                <select
                  id="report-status-filter"
                  className="field-input"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {Object.keys(REPORT_STATUS_LABELS).map((key) => (
                    <option key={key} value={key}>
                      {REPORT_STATUS_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-risk-filter" className="sr-only">
                  Filter by risk level
                </label>
                <select
                  id="report-risk-filter"
                  className="field-input"
                  value={riskLevel}
                  onChange={(event) => setRiskLevel(event.target.value)}
                >
                  <option value="">All risk levels</option>
                  {RISK_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {RISK_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {filtersActive && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-charcoal-500" role="status">
                Showing {visibleReports.length} of {reports.length} reports
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
          {visibleReports.length === 0 ? (
            <EmptyState
              icon={FiSearch}
              title="No reports match your filters"
              description="Try a different search term, or clear the filters to see all your health reports."
              action={
                <button type="button" onClick={clearFilters} className="btn btn-secondary">
                  Clear search and filters
                </button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {visibleReports.map((report) => {
                const animalLabel = report.animal
                  ? ANIMAL_TYPE_LABELS[report.animal.animalType] || report.animal.animalType
                  : 'General farm report'
                const signNames = (report.symptoms || [])
                  .map((link) => link.symptom && link.symptom.name)
                  .filter(Boolean)

                return (
                  <li key={report.id}>
                    <Link
                      to={`/farmer/reports/${report.id}`}
                      className="card block p-4 transition hover:border-forest-300"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-charcoal-900">{report.title}</p>
                          <p className="mt-0.5 text-xs text-charcoal-500">
                            {formatDate(report.createdAt)} · {animalLabel}
                          </p>
                          {signNames.length > 0 && (
                            <p className="mt-1 text-xs text-charcoal-600">
                              Signs: {signNames.join(', ')}
                            </p>
                          )}
                          {report.affectedAnimals != null && (
                            <p className="mt-0.5 text-xs text-charcoal-600">
                              {report.affectedAnimals} animal
                              {report.affectedAnimals === 1 ? '' : 's'} affected
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                          <RiskBadge riskLevel={report.riskLevel} />
                          <ReportStatusBadge status={report.status} />
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}