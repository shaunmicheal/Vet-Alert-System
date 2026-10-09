import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi'
import { getAdminUser } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ROLE_LABELS } from '../../utils/admin'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

export default function AdminUserDetailPage() {
  useDocumentTitle('User Detail')
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const loadUser = useCallback(() => {
    setLoading(true)
    return getAdminUser(id)
      .then((record) => { setUser(record); setLoadError(null) })
      .catch((error) => setLoadError(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadUser() }, [loadUser])

  return (
    <div className="space-y-6">
      <header>
        <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline">
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to users
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-charcoal-900">User Detail</h1>
      </header>
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite">
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading user…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We could not load this user">
          <p>{loadError}</p>
          <button type="button" onClick={loadUser} className="btn btn-secondary mt-3"><FiRefreshCw className="h-4 w-4" aria-hidden="true" /> Try again</button>
        </AlertMessage>
      ) : user ? (
        <>
          <section className="card p-5" aria-label="Account summary">
            <h2 className="text-base font-semibold text-charcoal-900">{user.name}</h2>
            <p className="mt-0.5 text-sm text-charcoal-600">{user.email}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">Role</dt><dd className="mt-0.5 text-charcoal-800">{ROLE_LABELS[user.role] || user.role}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">Phone</dt><dd className="mt-0.5 text-charcoal-800">{user.phone || 'Not provided'}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">Registered</dt><dd className="mt-0.5 text-charcoal-800">{formatDate(user.createdAt) || 'Unknown'}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">Farm</dt><dd className="mt-0.5 text-charcoal-800">{user.farm ? `${user.farm.name} · ${user.farm.district || ''} ${user.farm.province || ''}` : 'No farm profile'}</dd></div>
            </dl>
            {user.veterinaryProfessional && (
              <p className="mt-4 text-sm text-charcoal-600">
                Linked directory profile: <Link className="font-semibold text-forest-700 hover:underline" to={`/admin/veterinary/${user.veterinaryProfessional.id}`}>{user.veterinaryProfessional.name || 'Open profile'}</Link>
              </p>
            )}
          </section>
          <section className="card p-5" aria-label="Recent reports">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">Recent health reports</h2>
            {(user.healthReports || []).length === 0 ? (
              <p className="mt-3 text-sm text-charcoal-600">No health reports for this account.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(user.healthReports || []).map((report) => (
                  <li key={report.id}><Link className="font-semibold text-forest-700 hover:underline" to={`/admin/reports/${report.id}`}>{report.title}</Link><span className="ml-2 text-xs text-charcoal-500">{report.status} · {formatDate(report.createdAt)}</span></li>
                ))}
              </ul>
            )}
          </section>
          <AlertMessage variant="info" title="Administrative scope">
            <p>Read-only oversight. Account activation, role changes and password operations are not offered here.</p>
          </AlertMessage>
        </>
      ) : null}
    </div>
  )
}
