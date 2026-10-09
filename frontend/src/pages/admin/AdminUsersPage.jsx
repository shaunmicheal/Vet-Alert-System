import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiRefreshCw, FiSearch, FiUser, FiUsers, FiX } from 'react-icons/fi'
import { getAdminUsers } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ROLE_LABELS } from '../../utils/admin'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 20
const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'FARMER', label: 'Farmers' },
  { value: 'VETERINARY_PROFESSIONAL', label: 'Veterinary professionals' },
  { value: 'ADMIN', label: 'Admins' },
]

export default function AdminUsersPage() {
  useDocumentTitle('User Management')
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [role, setRole] = useState(searchParams.get('role') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const loadUsers = useCallback(() => {
    setLoading(true)
    const params = { page, limit: PAGE_SIZE }
    if (role) params.role = role
    if (search) params.search = search
    return getAdminUsers(params)
      .then(({ users: list, pagination: pages }) => {
        setUsers(Array.isArray(list) ? list : [])
        setPagination(pages || { page, total: 0, totalPages: 1 })
        setLoadError(null)
      })
      .catch((error) => setLoadError(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [page, role, search])

  useEffect(() => { loadUsers() }, [loadUsers])

  const syncParams = (p, r, s) => {
    const next = new URLSearchParams()
    if (r) next.set('role', r)
    if (s) next.set('search', s)
    if (p > 1) next.set('page', String(p))
    setSearchParams(next, { replace: true })
  }
  const applyRole = (value) => { setRole(value); setPage(1); syncParams(1, value, search) }
  const applySearch = (event) => {
    event.preventDefault()
    const trimmed = searchInput.trim()
    setSearch(trimmed); setPage(1); syncParams(1, role, trimmed)
  }
  const clearFilters = () => {
    setRole(''); setSearch(''); setSearchInput(''); setPage(1)
    setSearchParams({}, { replace: true })
  }
  const filtersActive = role !== '' || search !== ''
  const gotoPage = (next) => { setPage(next); syncParams(next, role, search) }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Admin console</p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900 sm:text-3xl">User Management</h1>
        <p className="mt-1 text-sm text-charcoal-600">Registered accounts. Directory profiles live under Veterinary oversight.</p>
      </header>
      <section aria-label="Filter users" className="card p-4 sm:p-5">
        <form onSubmit={applySearch} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="users-search" className="field-label">Search by name or email</label>
            <input id="users-search" type="search" className="field-input" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="e.g. Tendai" />
          </div>
          <div>
            <label htmlFor="users-role" className="field-label">Role</label>
            <select id="users-role" className="field-input pr-8" value={role} onChange={(e) => applyRole(e.target.value)}>
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={applySearch} className="btn btn-primary"><FiSearch className="h-4 w-4" aria-hidden="true" /> Search</button>
          {filtersActive && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"><FiX className="h-4 w-4" aria-hidden="true" /> Clear filters</button>}
        </div>
      </section>
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite">
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading users…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We could not load the users">
          <p>{loadError}</p>
          <button type="button" onClick={loadUsers} className="btn btn-secondary mt-3"><FiRefreshCw className="h-4 w-4" aria-hidden="true" /> Try again</button>
        </AlertMessage>
      ) : users.length === 0 ? (
        <EmptyState icon={FiUsers} title="No users found" description="Try a different search term or role, or clear the filters." action={filtersActive ? <button type="button" onClick={clearFilters} className="btn btn-secondary">Clear filters</button> : null} />
      ) : (
        <>
          <p className="text-sm text-charcoal-600" role="status">Showing {users.length} of {pagination.total} accounts{role ? ` · filter: ${ROLE_LABELS[role] || role}` : ''}</p>
          <ul className="space-y-3">
            {users.map((user) => (
              <li key={user.id}>
                <Link to={`/admin/users/${user.id}`} className="card block p-4 transition hover:border-forest-300">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-charcoal-900">{user.name}</p>
                      <p className="mt-0.5 text-xs text-charcoal-500">{user.email}</p>
                      <p className="mt-1 text-xs text-charcoal-500">{ROLE_LABELS[user.role] || user.role} · Joined {formatDate(user.createdAt) || 'unknown'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-semibold text-forest-800"><FiUser className="h-3 w-3" aria-hidden="true" />{ROLE_LABELS[user.role] || user.role}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-charcoal-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" disabled={pagination.page <= 1 || loading} onClick={() => gotoPage(pagination.page - 1)}>Previous</button>
              <button type="button" className="btn btn-secondary" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => gotoPage(pagination.page + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
