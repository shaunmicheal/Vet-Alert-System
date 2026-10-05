import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaPaw } from 'react-icons/fa'
import { FiAlertTriangle, FiFileText, FiHome, FiMapPin, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { getMyAnimals } from '../../api/animals'
import { getMyFarm } from '../../api/farmer'
import { getMyHealthReports } from '../../api/healthReports'
import DashboardStatCard from '../../components/farmer/DashboardStatCard'
import FarmOverviewCard from '../../components/farmer/FarmOverviewCard'
import RecentReports from '../../components/farmer/RecentReports'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { summarizeAnimalTypes } from '../../utils/format'

// Computed once at module load so component render stays pure.
const NOW = new Date()
const TODAY_LABEL = NOW.toLocaleDateString('en-ZA', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const GREETING =
  NOW.getHours() < 12 ? 'Good morning' : NOW.getHours() < 17 ? 'Good afternoon' : 'Good evening'

// The three dashboard reads. Each can fail independently - a failure in one
// section must not hide the rest of the dashboard.
export default function FarmerDashboardPage() {
  useDocumentTitle('Farmer Dashboard')

  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [failedSections, setFailedSections] = useState([])
  const [farm, setFarm] = useState(null)
  const [animals, setAnimals] = useState([])
  const [reports, setReports] = useState([])

  // Promise-chain style (like AuthProvider) so setState never runs synchronously
  // inside the mount effect.
  const loadDashboard = useCallback(() => {
    return Promise.allSettled([getMyFarm(), getMyAnimals(), getMyHealthReports()]).then(
      ([farmResult, animalsResult, reportsResult]) => {
        const failed = []

        if (farmResult.status === 'fulfilled') {
          setFarm(farmResult.value)
        } else {
          failed.push('farm')
        }

        if (animalsResult.status === 'fulfilled') {
          setAnimals(animalsResult.value)
        } else {
          failed.push('animals')
        }

        if (reportsResult.status === 'fulfilled') {
          setReports(reportsResult.value)
        } else {
          failed.push('reports')
        }

        setFailedSections(failed)
        setLoading(false)
      },
    )
  }, [])

  // Retry handler (event context): show the loading state, then reload.
  const reloadDashboard = () => {
    setLoading(true)
    setFailedSections([])
    loadDashboard()
  }

  // Initial load. The first render already starts in the loading state.
  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const firstName = user && user.name ? user.name.trim().split(/\s+/)[0] : ''
  const sectionFailed = (key) => failedSections.includes(key)

  // Derived counts - no extra API requests needed.
  const activeReports = reports.filter((report) => report.status !== 'RESOLVED')
  const highRiskActive = activeReports.filter((report) => report.riskLevel === 'HIGH').length
  const pendingReports = reports.filter((report) => report.status === 'PENDING').length
  const animalSummary = summarizeAnimalTypes(animals, ANIMAL_TYPE_LABELS)

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            {TODAY_LABEL}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900 sm:text-3xl">
            {GREETING}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-charcoal-600">Here is how your farm is doing today.</p>
        </div>
        <Link to="/farmer/reports" className="btn btn-primary self-start sm:self-auto">
          <FiPlus className="h-4 w-4" aria-hidden="true" />
          Report a Health Concern
        </Link>
      </header>

      {/* Partial load failure - keep what loaded, offer a retry */}
      {!loading && failedSections.length > 0 && (
        <AlertMessage variant="warning" title="Some information could not be loaded">
          <p>We couldn’t load part of your dashboard. Some details may be missing.</p>
          <button type="button" onClick={reloadDashboard} className="btn btn-secondary mt-3">
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
          <p className="text-sm font-medium text-charcoal-600">Loading your dashboard…</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              icon={FiHome}
              label="My Farm"
              value={sectionFailed('farm') ? '—' : farm ? farm.name : 'Not set up'}
              sub={
                sectionFailed('farm')
                  ? ''
                  : farm
                    ? `${farm.district}, ${farm.province}`
                    : 'Create your farm profile to get started'
              }
            />
            <DashboardStatCard
              icon={FaPaw}
              label="Animals"
              tone="earth"
              value={sectionFailed('animals') ? '—' : animals.length}
              sub={sectionFailed('animals') ? '' : animalSummary || 'No animals recorded yet'}
            />
            <DashboardStatCard
              icon={FiFileText}
              label="Health Reports"
              value={sectionFailed('reports') ? '—' : reports.length}
              sub={
                sectionFailed('reports')
                  ? ''
                  : pendingReports > 0
                    ? `${pendingReports} awaiting review`
                    : reports.length > 0
                      ? 'All reports have been reviewed'
                      : 'No reports submitted yet'
              }
            />
            <DashboardStatCard
              icon={FiAlertTriangle}
              label="Active Concerns"
              tone={highRiskActive > 0 ? 'danger' : 'warning'}
              value={sectionFailed('reports') ? '—' : activeReports.length}
              sub={
                sectionFailed('reports')
                  ? ''
                  : highRiskActive > 0
                    ? `${highRiskActive} high-risk report${highRiskActive > 1 ? 's' : ''} open`
                    : activeReports.length > 0
                      ? 'Reports still being worked on'
                      : 'Nothing open right now'
              }
            />
          </div>

          {/* Farm overview + recent reports */}
          <div className="grid gap-6 lg:grid-cols-2">
            {!sectionFailed('farm') &&
              (farm ? (
                <FarmOverviewCard farm={farm} actionPath="/farmer/farm" />
              ) : (
                <EmptyState
                  icon={FiMapPin}
                  title="Set up your farm profile"
                  description="Add your farm’s location and details so VetAlert can tailor early warnings and connect you with nearby veterinary services."
                  action={
                    <Link to="/farmer/farm" className="btn btn-primary">
                      Create farm profile
                    </Link>
                  }
                />
              ))}

            {!sectionFailed('reports') && (
              <RecentReports reports={reports.slice(0, 5)} actionPath="/farmer/reports" />
            )}
          </div>
        </>
      )}
    </div>
  )
}