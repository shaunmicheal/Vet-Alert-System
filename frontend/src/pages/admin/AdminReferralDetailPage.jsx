import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi'
import { getAdminReferral } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

export default function AdminReferralDetailPage() {
  useDocumentTitle('Referral Detail')
  const { id } = useParams()
  const [referral, setReferral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const load = () => {
    setLoading(true)
    getAdminReferral(id)
      .then((record) => { setReferral(record); setLoadError(null) })
      .catch((error) => setLoadError(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  return (
    <div className="space-y-6">
      <header>
        <Link to="/admin/referrals" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"><FiArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to referrals</Link>
        <h1 className="mt-2 text-2xl font-bold text-charcoal-900">Referral Detail</h1>
      </header>
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite"><Spinner className="h-6 w-6 text-forest-700" /><p className="text-sm font-medium text-charcoal-600">Loading referral…</p></div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We could not load this referral"><p>{loadError}</p><button type="button" onClick={load} className="btn btn-secondary mt-3"><FiRefreshCw className="h-4 w-4" aria-hidden="true" /> Try again</button></AlertMessage>
      ) : referral ? (
        <section className="card space-y-3 p-5" aria-label="Referral summary">
          <p className="text-sm text-charcoal-600">Status: <span className="font-semibold text-charcoal-900">{referral.status}</span> · Created {formatDate(referral.createdAt)}</p>
          <p className="text-sm text-charcoal-600">Farmer: <span className="font-semibold text-charcoal-900">{referral.farmer ? `${referral.farmer.name} (${referral.farmer.email})` : 'Unknown'}</span></p>
          <p className="text-sm text-charcoal-600">Professional: <span className="font-semibold text-charcoal-900">{referral.professional ? referral.professional.name : 'Unassigned'}</span></p>
          {referral.report && <p className="text-sm text-charcoal-600">Report: <Link className="font-semibold text-forest-700 hover:underline" to={`/admin/reports/${referral.report.id}`}>{referral.report.title}</Link></p>}
          {referral.professional && <p className="text-sm text-charcoal-600">Directory profile: <Link className="font-semibold text-forest-700 hover:underline" to={`/admin/veterinary/${referral.professional.id}`}>Open profile</Link></p>}
        </section>
      ) : null}
    </div>
  )
}
