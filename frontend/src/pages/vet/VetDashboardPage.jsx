import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertTriangle, FiCheckCircle, FiClipboard, FiClock, FiRefreshCw } from 'react-icons/fi'
import { getVetCases } from '../../api/vet'
import VetCaseCard from '../../components/vet/VetCaseCard'
import DashboardStatCard from '../../components/farmer/DashboardStatCard'
import AlertMessage from '../../components/ui/AlertMessage'
import DashboardWelcomeBanner from '../../components/ui/DashboardWelcomeBanner'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { countCasesByStatus, isActionableCase, sortCasesByPriority } from '../../utils/vetCases'
import { LIVESTOCK_IMAGES } from '../../utils/livestockImages'

export default function VetDashboardPage() {
  useDocumentTitle('Vet Dashboard')
  const { user } = useAuth()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const loadCases = useCallback(() => {
    return getVetCases()
      .then((list) => {
        setCases(Array.isArray(list) ? list : [])
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
    loadCases()
  }, [loadCases])
  const reloadCases = () => {
    setLoading(true)
    setLoadError(null)
    loadCases()
  }
  const summary = useMemo(() => {
    const byStatus = countCasesByStatus(cases)
    const highRisk = cases.filter((c) => c && c.report && c.report.riskLevel === 'HIGH').length
    const actionable = cases.filter(isActionableCase).length
    return { total: cases.length, byStatus, highRisk, actionable }
  }, [cases])
  const priorityCases = useMemo(() => sortCasesByPriority(cases).slice(0, 5), [cases])
  const firstName = user && user.name ? user.name.trim().split(/\s+/)[0] : ''
  return (
    <div className="space-y-6">
      <DashboardWelcomeBanner
        title={firstName ? `Welcome, ${firstName}` : 'Welcome'}
        description="Cases farmers have referred to you, with the most urgent first."
        image={LIVESTOCK_IMAGES.smallStock}
        imagePosition="center 40%"
        stats={
          loading
            ? []
            : [
                { label: 'Assigned cases', value: String(summary.total) },
                { label: 'Need attention', value: String(summary.actionable) },
                { label: 'High-risk', value: String(summary.highRisk) },
              ]
        }
        action={
          <Link to="/vet/cases" className="btn btn-primary self-start sm:self-auto">
            <FiClipboard className="h-4 w-4" aria-hidden="true" />
            View cases
          </Link>
        }
      />
      {loadError && (
        <AlertMessage variant="error" title="Could not load your cases">
          <p>{loadError}</p>
          <button type="button" onClick={reloadCases} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      )}
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite">
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading your cases…</p>
        </div>
      ) : !loadError && (
        <>
          <section aria-label="Case summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard icon={FiClipboard} label="Assigned cases" value={summary.total} sub={summary.actionable > 0 ? `${summary.actionable} need your attention` : 'Nothing waiting on you'} />
            <DashboardStatCard icon={FiClock} label="Pending review" value={summary.byStatus.PENDING} sub="Referred and awaiting your decision" tone="warning" />
            <DashboardStatCard icon={FiClipboard} label="In progress" value={summary.byStatus.ACCEPTED + summary.byStatus.IN_PROGRESS} sub="Accepted or being handled" tone="earth" />
            <DashboardStatCard icon={summary.highRisk > 0 ? FiAlertTriangle : FiCheckCircle} label="High-risk cases" value={summary.highRisk} sub={summary.highRisk > 0 ? 'Prioritise these first' : 'No high-risk cases right now'} tone={summary.highRisk > 0 ? 'danger' : 'default'} />
          </section>
          {cases.length === 0 ? (
            <EmptyState icon={FiClipboard} title="No veterinary cases yet" description="Cases farmers refer to you will appear here when assigned. Check back soon." action={(<Link to="/vet/cases" className="btn btn-primary">Go to assigned cases</Link>)} />
          ) : (
            <section aria-label="Priority cases" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">Priority cases</h2>
                <Link to="/vet/cases" className="text-link text-sm">View all {summary.total} cases</Link>
              </div>
              <ul className="space-y-3">
                {priorityCases.map((vetCase) => (<VetCaseCard key={vetCase.id} vetCase={vetCase} />))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
