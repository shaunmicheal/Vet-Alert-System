import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiRefreshCw, FiShare2 } from 'react-icons/fi'
import { getAdminReferrals } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 20

export default function AdminReferralsPage() {
  useDocumentTitle('Referral Oversight')
  const [searchParams, setSearchParams] = useSearchParams()
  const [referrals, setReferrals] = useState([])
  const [pages, setPages] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: PAGE_SIZE }
    if (status) params.status = status
    getAdminReferrals(params)
      .then(({ referrals: list, pagination }) => {
        setReferrals(Array.isArray(list) ? list : [])
        setPages(pagination || { page, total: 0, totalPages: 1 })
        setLoadError(null)
      })
      .catch((error) => setLoadError(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [page, status, reloadKey])

  const sync = (p, s) => {
    const next = new URLSearchParams()
    if (s) next.set('status', s)
    if (p > 1) next.set('page', String(p))
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Admin console</p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900 sm:text-3xl">Referral Oversight</h1>
        <p className="mt-1 text-sm text-charcoal-600">Farmer-to-vet referrals. Read-only; assignment rules are unchanged.</p>
      </header>
      <section aria-label="Filter referrals" className="card flex flex-wrap gap-3 p-4">
        <select aria-label="Referral status" className="field-input max-w-xs pr-8" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); sync(1, e.target.value) }}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="DECLINED">Declined</option>
        </select>
        {status && <button type="button" onClick={() => { setStatus(''); setPage(1); setSearchParams({}, { replace: true }) }} className="text-sm font-semibold text-forest-700 hover:underline">Clear filters</button>}
      </section>
      {status && <p className="text-sm text-charcoal-600" role="status">Active filter: status <span className="font-semibold text-charcoal-900">{status}</span></p>}
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite"><Spinner className="h-6 w-6 text-forest-700" /><p className="text-sm font-medium text-charcoal-600">Loading referrals…</p></div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We could not load the referrals"><p>{loadError}</p><button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn btn-secondary mt-3"><FiRefreshCw className="h-4 w-4" aria-hidden="true" /> Try again</button></AlertMessage>
      ) : referrals.length === 0 ? (
        <EmptyState icon={FiShare2} title="No referrals found" description="Referrals farmers create will appear here." />
      ) : (
        <>
          <p className="text-sm text-charcoal-600" role="status">Showing {referrals.length} of {pages.total} referrals</p>
          <ul className="space-y-3">
            {referrals.map((referral) => (
              <li key={referral.id}>
                <Link to={`/admin/referrals/${referral.id}`} className="card block p-4 transition hover:border-forest-300">
                  <p className="font-semibold text-charcoal-900">{referral.report ? referral.report.title : 'Referral'}</p>
                  <p className="mt-0.5 text-xs text-charcoal-500">{formatDate(referral.createdAt)} · {referral.status} · {referral.farmer ? referral.farmer.name : 'Unknown farmer'} → {referral.professional ? referral.professional.name : 'Unassigned'}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-charcoal-500">Page {pages.page} of {pages.totalPages}</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" disabled={pages.page <= 1} onClick={() => { const n = pages.page - 1; setPage(n); sync(n, status) }}>Previous</button>
              <button type="button" className="btn btn-secondary" disabled={pages.page >= pages.totalPages} onClick={() => { const n = pages.page + 1; setPage(n); sync(n, status) }}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
