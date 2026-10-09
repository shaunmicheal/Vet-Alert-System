import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiClipboard, FiRefreshCw, FiSearch } from 'react-icons/fi'
import { getVetCases, VET_CASE_STATUSES } from '../../api/vet'
import VetCaseCard from '../../components/vet/VetCaseCard'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { caseStatusLabel } from '../../utils/vetCases'
import { RISK_LEVEL_LABELS, RISK_LEVELS } from '../../utils/constants'

export default function VetCasesPage() {
  useDocumentTitle('Assigned Cases')
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState('')
  const [risk, setRisk] = useState('')
  const [search, setSearch] = useState('')
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
  const visibleCases = useMemo(() => {
    const query = search.trim().toLowerCase()
    return cases.filter((vetCase) => {
      if (!vetCase) return false
      if (status && vetCase.status !== status) return false
      const report = vetCase.report || {}
      if (risk && report.riskLevel !== risk) return false
      if (!query) return true
      const farmer = vetCase.farmer || {}
      const farm = report.farm || {}
      const animal = report.animal || {}
      return [report.title, farmer.name, farmer.email, farmer.phone, farm.name, farm.district, farm.province, farm.ward, farm.village, animal.name, animal.tagNumber]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    })
  }, [cases, search, status, risk])
  const filtersActive = search.trim() !== '' || status !== '' || risk !== ''
  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setRisk('')
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Veterinary workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Assigned Cases</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal-600">Farmer referrals assigned to you, most recently updated first. Open a case to review the full report.</p>
        </div>
        <button type="button" onClick={reloadCases} disabled={loading} className="btn btn-secondary self-start sm:self-auto">
          <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </header>
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite">
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading your cases…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="Could not load your cases">
          <p>{loadError}</p>
          <button type="button" onClick={reloadCases} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      ) : cases.length === 0 ? (
        <EmptyState icon={FiClipboard} title="No veterinary cases yet" description="Cases farmers refer to you will appear here when assigned." />
      ) : (
        <>
          <section aria-label="Filter cases" className="card p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="vet-case-search" className="field-label">Search</label>
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-charcoal-400" aria-hidden="true" />
                  <input id="vet-case-search" type="text" className="field-input pl-10" placeholder="Farmer, report, place, tag" value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="vet-case-status" className="field-label">Referral status</label>
                <select id="vet-case-status" className="field-input" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">All statuses</option>
                  {VET_CASE_STATUSES.map((value) => (<option key={value} value={value}>{caseStatusLabel(value)}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="vet-case-risk" className="field-label">Risk level</label>
                <select id="vet-case-risk" className="field-input" value={risk} onChange={(event) => setRisk(event.target.value)}>
                  <option value="">All risk levels</option>
                  {RISK_LEVELS.map((value) => (<option key={value} value={value}>{RISK_LEVEL_LABELS[value]}</option>))}
                </select>
              </div>
            </div>
          </section>
          {filtersActive && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-charcoal-500" role="status">Showing {visibleCases.length} of {cases.length} cases</p>
              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-forest-700 underline-offset-2 hover:underline">Clear filters</button>
            </div>
          )}
          {visibleCases.length === 0 ? (
            <EmptyState icon={FiSearch} title="No cases match your filters" description="Try a different search term, or clear the filters to see all your assigned cases." action={(<button type="button" onClick={clearFilters} className="btn btn-secondary">Clear search and filters</button>)} />
          ) : (
            <ul className="space-y-3">
              {visibleCases.map((vetCase) => (<VetCaseCard key={vetCase.id} vetCase={vetCase} />))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
