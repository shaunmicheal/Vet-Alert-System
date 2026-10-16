import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi'
import { getAdminProfessional } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { VET_DEMO_MODE_ENABLED, VET_DEMO_DIRECTORY_MESSAGE } from '../../utils/vetDemoMode'

export default function AdminVeterinaryDetailPage() {
  useDocumentTitle('Directory Profile')
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const load = () => {
    setLoading(true)
    getAdminProfessional(id)
      .then((record) => { setProfile(record); setLoadError(null) })
      .catch((error) => setLoadError(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  return (
    <div className="space-y-6">
      <header>
        <Link to="/admin/veterinary" className="text-link inline-flex items-center gap-1.5 text-sm"><FiArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to veterinary oversight</Link>
        <h1 className="page-title mt-2">Directory Profile</h1>
      </header>
      {VET_DEMO_MODE_ENABLED && (
        <AlertMessage variant="warning" title="Demonstration mode">
          <p className="flex items-start gap-1.5">
            <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{VET_DEMO_DIRECTORY_MESSAGE}</span>
          </p>
        </AlertMessage>
      )}
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite"><Spinner className="h-6 w-6 text-forest-700" /><p className="text-sm font-medium text-charcoal-600">Loading profile…</p></div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We could not load this profile"><p>{loadError}</p><button type="button" onClick={load} className="btn btn-secondary mt-3"><FiRefreshCw className="h-4 w-4" aria-hidden="true" /> Try again</button></AlertMessage>
      ) : profile ? (
        <section className="card space-y-2 p-5" aria-label="Profile summary">
          <h2 className="text-base font-semibold text-charcoal-900">{profile.name}</h2>
          <p className="text-sm text-charcoal-600">{profile.professionalType} · {profile.district}, {profile.province}</p>
          <p className="text-sm text-charcoal-600">Phone: {profile.phone} · Email: {profile.email || 'Not provided'}</p>
          <p className="text-sm text-charcoal-600">Specialisation: {profile.specialisation || 'Not provided'} · Availability: {profile.availability || 'Not stated'}</p>
          <p className="text-sm text-charcoal-600">Status: {profile.isActive ? 'Active in directory' : 'Inactive'} · Listed since {formatDate(profile.createdAt)}</p>
          {profile.user ? (
            <p className="text-sm text-charcoal-600">Linked account: <Link className="font-semibold text-forest-700 hover:underline" to={`/admin/users/${profile.user.id}`}>{profile.user.name} ({profile.user.email})</Link></p>
          ) : (
            <p className="text-sm text-charcoal-600">Linked account: none recorded. This profile is an independent directory record.</p>
          )}
        </section>
      ) : null}
    </div>
  )
}
