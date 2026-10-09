import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiFileText, FiRefreshCw } from 'react-icons/fi'
import { getAdminReports } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 20

export default function AdminReportsPage() {
  useDocumentTitle('Health Report Oversight')
  const [searchParams, setSearchParams] = useSearchParams()
  const [reports, setReports] = useState([])
  const [pages, setPages] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: PAGE_SIZE }
    if (status) params.status = status
    if (search) params.search = search
    getAdminReports(params)
      .then(({ reports: list, pagination }) => {
        setReports(Array.isArray(list) ? list : [])
        setPages(pagination || { page, total: 0, totalPages: 1 })
        setLoadError(null)
      })
      .catch((error) => setLoadError(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [page, status, search, reloadKey])
  const sync = (p, s, q) => {
    const next = new URLSearchParams()
    if (s) next.set('status', s)
    if (q) next.set('search', q)
    if (p > 1) next.set('page', String(p))
    setSearchParams(next, { replace: true })
  }
  const active = status !== '' || search !== ''

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Admin console</p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900 sm:text-3xl">Health Report Oversight</h1>
        <p className="mt-1 text-sm text-charcoal-600">All submitted reports. Awaiting review means status PENDING.</p>
      </header>
      <section aria-label="Filter reports" className="card flex flex-wrap gap-3 p-4">
        <select aria-label="Report status" className="field-input max-w-xs pr-8" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); sync(1, e.target.value, search) }}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending review</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="REFERRED">Referred</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <form onSubmit={(e) => { e.preventDefault(); const t = searchInput.trim(); setSearch(t); setPage(1); sync(1, status, t) }} className="flex gap-2">
          <input aria-label="Search reports" type="search" className="field-input" placeholder="Search title" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        {active && <button type="button" onClick={() => { setStatus(''); setSearch(''); setSearchInput(''); setPage(1); setSearchParams({}, { replace: true }) }} className="text-sm font-semibold text-forest-700 hover:underline">Clear filters</button>}
      </section>
      {status && <p className="text-sm text-charcoal-600" role="status">Active filter: status <span className="font-semibold text-charcoal-900">{status}</span></p>}
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite"><Spinner className="h-6 w-6 text-forest-700" /><p className="text-sm font-medium text-charcoal-600">Loading reports…</p></div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We could not load the reports"><p>{loadError}</p><button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn btn-secondary mt-3"><FiRefreshCw className="h-4 w-4" aria-hidden="true" /> Try again</button></AlertMessage>
      ) : reports.length === 0 ? (
        <EmptyState icon={FiFileText} title="No reports found" description="Try clearing the filters." />
      ) : (
        <>
          <p className="text-sm text-charcoal-600" role="status">Showing {reports.length} of {pages.total} reports</p>
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id}>
                <Link to={`/admin/reports/${report.id}`} className="card block p-4 transition hover:border-forest-300">
                  <p className="font-semibold text-charcoal-900">{report.title}</p>
                  <p className="mt-0.5 text-xs text-charcoal-500">{formatDate(report.createdAt)} · {report.farm ? `${report.farm.district || ''} ${report.farm.province || ''}` : 'No farm'} · {report.status}{report.riskLevel ? ` · ${report.riskLevel} risk` : ''}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-charcoal-500">Page {pages.page} of {pages.totalPages}</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" disabled={pages.page <= 1} onClick={() => { const n = pages.page - 1; setPage(n); sync(n, status, search) }}>Previous</button>
              <button type="button" className="btn btn-secondary" disabled={pages.page >= pages.totalPages} onClick={() => { const n = pages.page + 1; setPage(n); sync(n, status, search) }}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
