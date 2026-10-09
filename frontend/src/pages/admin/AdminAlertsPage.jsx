import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi'
import { getAdminAlerts } from '../../api/admin'
import AdminAlertCard from '../../components/admin/AdminAlertCard'
import CreateAlertDialog from '../../components/admin/CreateAlertDialog'
import DashboardStatCard from '../../components/farmer/DashboardStatCard'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'

const TYPE_OPTIONS = Object.freeze([
  { value: 'POSSIBLE_CLUSTER', label: 'Possible cluster' },
  { value: 'HIGH_RISK', label: 'High risk' },
  { value: 'SYSTEM', label: 'System' },
])

const STATUS_OPTIONS = Object.freeze([
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
])

const EMPTY_FILTERS = Object.freeze({
  type: '',
  status: '',
  province: '',
  district: '',
  animalType: '',
})

function FilterSelect({ id, label, allLabel, value, options, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="field-input pr-8" value={value} onChange={onChange}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function AdminAlertsPage() {
  useDocumentTitle('Alerts')

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [flash, setFlash] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const loadAlerts = useCallback(() => {
    return getAdminAlerts()
      .then((list) => {
        if (!Array.isArray(list)) {
          setLoadError('The server sent an unexpected response. Please try again.')
          return
        }
        setAlerts(list)
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
    loadAlerts()
  }, [loadAlerts])

  const reloadAlerts = () => {
    setLoading(true)
    setLoadError(null)
    loadAlerts()
  }

  const summary = useMemo(() => {
    let active = 0
    alerts.forEach((alert) => {
      if (alert.isActive) active += 1
    })
    return { total: alerts.length, active, acknowledged: alerts.length - active }
  }, [alerts])

  const filterOptions = useMemo(() => {
    const provinces = new Set()
    const districts = new Set()
    const animalTypes = new Set()
    alerts.forEach((alert) => {
      if (alert.province) provinces.add(alert.province)
      if (alert.district) districts.add(alert.district)
      if (alert.animalType) animalTypes.add(alert.animalType)
    })
    return {
      provinces: [...provinces].sort(),
      districts: [...districts].sort(),
      animalTypes: [...animalTypes].sort(),
    }
  }, [alerts])

  const visibleAlerts = useMemo(
    () =>
      alerts.filter((alert) => {
        if (filters.type && alert.type !== filters.type) return false
        if (filters.status === 'ACTIVE' && !alert.isActive) return false
        if (filters.status === 'ACKNOWLEDGED' && alert.isActive) return false
        if (filters.province && alert.province !== filters.province) return false
        if (filters.district && alert.district !== filters.district) return false
        if (filters.animalType && alert.animalType !== filters.animalType) return false
        return true
      }),
    [alerts, filters]
  )

  const filtersActive = Object.values(filters).some(Boolean)

  const setFilter = (key) => (event) =>
    setFilters((prev) => ({ ...prev, [key]: event.target.value }))

  const clearFilters = () => setFilters(EMPTY_FILTERS)

  const handleCreated = (created) => {
    setAlerts((prev) => [created, ...prev])
    setFilters(EMPTY_FILTERS)
    setCreateOpen(false)
    setFlash('System alert created. It is now active and listed at the top of the list.')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Admin Console
          </p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Alerts</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal-600">
            System-generated and manually created administrative alerts. Alerts flag
            patterns worth reviewing - they are not confirmed diagnoses or outbreak
            events.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="btn btn-primary self-start sm:self-auto"
        >
          <FiPlus className="h-4 w-4" aria-hidden="true" />
          New system alert
        </button>
      </header>

      {flash && <AlertMessage variant="success">{flash}</AlertMessage>}

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading alerts…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load the alerts">
          <p>{loadError}</p>
          <button type="button" onClick={reloadAlerts} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      ) : (
        <>
          <section aria-label="Alert summary" className="grid gap-4 sm:grid-cols-3">
            <DashboardStatCard
              icon={FiBell}
              label="Total alerts"
              value={summary.total}
              sub="Generated so far"
            />
            <DashboardStatCard
              icon={FiAlertTriangle}
              label="Active alerts"
              value={summary.active}
              sub="Awaiting review"
              tone={summary.active > 0 ? 'warning' : 'default'}
            />
            <DashboardStatCard
              icon={FiCheckCircle}
              label="Acknowledged"
              value={summary.acknowledged}
              sub="Handled administratively"
              tone="earth"
            />
          </section>

          <AlertMessage variant="info" title="About these alerts">
            <p>
              High-risk reports are risk indications, not confirmed diagnoses. Possible
              cluster alerts are prompts for further veterinary investigation, not
              confirmed outbreaks. Acknowledging an alert records that it has been
              handled administratively - it does not resolve the underlying health
              situation.
            </p>
          </AlertMessage>

          <section aria-label="Filter alerts" className="card p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  id: 'filter-type',
                  label: 'Alert type',
                  allLabel: 'All alert types',
                  value: filters.type,
                  options: TYPE_OPTIONS,
                  onChange: setFilter('type'),
                },
                {
                  id: 'filter-status',
                  label: 'Status',
                  allLabel: 'All statuses',
                  value: filters.status,
                  options: STATUS_OPTIONS,
                  onChange: setFilter('status'),
                },
                {
                  id: 'filter-province',
                  label: 'Province',
                  allLabel: 'All provinces',
                  value: filters.province,
                  options: filterOptions.provinces.map((value) => ({ value, label: value })),
                  onChange: setFilter('province'),
                },
                {
                  id: 'filter-district',
                  label: 'District',
                  allLabel: 'All districts',
                  value: filters.district,
                  options: filterOptions.districts.map((value) => ({ value, label: value })),
                  onChange: setFilter('district'),
                },
                {
                  id: 'filter-animal-type',
                  label: 'Animal type',
                  allLabel: 'All animal types',
                  value: filters.animalType,
                  options: filterOptions.animalTypes.map((value) => ({
                    value,
                    label: ANIMAL_TYPE_LABELS[value] || value,
                  })),
                  onChange: setFilter('animalType'),
                },
              ].map((field) => (
                <FilterSelect key={field.id} {...field} />
              ))}
            </div>
          </section>

          {filtersActive && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-charcoal-600" role="status">
                Showing{' '}
                <span className="font-semibold text-charcoal-900">{visibleAlerts.length}</span>{' '}
                of <span className="font-semibold text-charcoal-900">{alerts.length}</span> alerts
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-forest-700 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {alerts.length === 0 ? (
            <EmptyState
              icon={FiBell}
              title="No alerts yet"
              description="Alerts appear here when the platform flags a high-risk report, a possible health cluster is detected, or an administrator creates a system notice."
              action={
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="btn btn-primary"
                >
                  <FiPlus className="h-4 w-4" aria-hidden="true" />
                  New system alert
                </button>
              }
            />
          ) : visibleAlerts.length === 0 ? (
            <EmptyState
              icon={FiSearch}
              title="No alerts match your filters"
              description="Try a different combination, or clear the filters to see all alerts."
              action={
                <button type="button" onClick={clearFilters} className="btn btn-secondary">
                  Clear filters
                </button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {visibleAlerts.map((alert) => (
                <AdminAlertCard key={alert.id} alert={alert} />
              ))}
            </ul>
          )}
        </>
      )}

      {createOpen && (
        <CreateAlertDialog
          onCancel={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
