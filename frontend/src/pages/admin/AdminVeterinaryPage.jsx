import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaUserMd } from 'react-icons/fa'
import { FiRefreshCw } from 'react-icons/fi'
import { getAdminProfessionals, getAdminUsers } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'

const PAGE_SIZE = 20

export default function AdminVeterinaryPage() {
  useDocumentTitle('Veterinary Oversight')
  const [searchParams, setSearchParams] = useSearchParams()
  const [professionals, setProfessionals] = useState([])
  const [pages, setPages] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [vetAccounts, setVetAccounts] = useState([])
  const [searchInput, setSearchInput] = useState(search)
  const [accountsError, setAccountsError] = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: PAGE_SIZE }
    if (search) params.search = search
    getAdminProfessionals(params)
      .then(({ professionals: list, pagination }) => {
        setProfessionals(Array.isArray(list) ? list : [])
        setPages(pagination || { page, total: 0, totalPages: 1 })
        setLoadError(null)
      })
      .catch((error) => setLoadError(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => {
    getAdminUsers({ role: 'VETERINARY_PROFESSIONAL', limit: 100 })
      .then(({ users }) => setVetAccounts(Array.isArray(users) ? users : []))
      .catch((error) => setAccountsError(getApiErrorMessage(error)))
  }, [])

  const sync = (p, q) => {
    const next = new URLSearchParams()
    if (q) next.set('search', q)
    if (p > 1) next.set('page', String(p))
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Admin console</p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900 sm:text-3xl">Veterinary Oversight</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-charcoal-600">Directory profiles and registered professional accounts are separate records. A profile is only linked when the database stores that relationship.</p>
      </header>
      <form onSubmit={(e) => { e.preventDefault(); const t = searchInput.trim(); setSearch(t); setPage(1); sync(1, t) }} className="card flex flex-wrap gap-2 p-4">
        <input aria-label="Search directory" type="search" className="field-input max-w-xs" placeholder="Search name or district" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <button type="submit" className="btn btn-primary">Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); setSearchParams({}, { replace: true }) }} className="text-sm font-semibold text-forest-700 hover:underline">Clear</button>}
      </form>
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite"><Spinner className="h-6 w-6 text-forest-700" /><p className="text-sm font-medium text-charcoal-600">Loading directory…</p></div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We could not load the directory"><p>{loadError}</p></AlertMessage>
      ) : professionals.length === 0 ? (
        <EmptyState icon={FaUserMd} title="No directory profiles found" description="Try clearing the search." />
      ) : (
        <>
          <p className="text-sm text-charcoal-600" role="status">Showing {professionals.length} of {pages.total} profiles</p>
          <ul className="space-y-3">
            {professionals.map((profile) => (
              <li key={profile.id}>
                <Link to={`/admin/veterinary/${profile.id}`} className="card block p-4 transition hover:border-forest-300">
                  <p className="font-semibold text-charcoal-900">{profile.name}</p>
                  <p className="mt-0.5 text-xs text-charcoal-500">{profile.professionalType} · {profile.district}, {profile.province} · {profile.userId ? 'Linked account' : 'No linked account'}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-charcoal-500">Page {pages.page} of {pages.totalPages}</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" disabled={pages.page <= 1} onClick={() => { const n = pages.page - 1; setPage(n); sync(n, search) }}>Previous</button>
              <button type="button" className="btn btn-secondary" disabled={pages.page >= pages.totalPages} onClick={() => { const n = pages.page + 1; setPage(n); sync(n, search) }}>Next</button>
            </div>
          </div>
        </>
      )}
      <section aria-label="Registered accounts" className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">Registered professional accounts</h2>
        {accountsError ? <p className="mt-3 text-sm text-red-700">{accountsError}</p> : null}
        {!accountsError && vetAccounts.length === 0 ? <p className="mt-3 text-sm text-charcoal-600">No VETERINARY_PROFESSIONAL accounts are registered.</p> : null}
        <ul className="mt-3 space-y-2">
          {vetAccounts.map((account) => (
            <li key={account.id}><Link className="font-semibold text-forest-700 hover:underline" to={`/admin/users/${account.id}`}>{account.name}</Link><span className="ml-2 text-xs text-charcoal-500">{account.email}</span></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
