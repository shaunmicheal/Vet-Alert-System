import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi'
import { getAdminReport } from '../../api/admin'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

export default function AdminReportDetailPage() {
  useDocumentTitle('Report Detail')
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const load = () => {
    setLoading(true)
    getAdminReport(id)
      .then((record) => { setReport(record); setLoadError(null) })
      .catch((error) => setLoadError(getApiErrorMessage(error)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  return (
    <div className="space-y-6">
      <header>
        <Link to="/admin/reports" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"><FiArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to reports</Link>
        <h1 className="mt-2 text-2xl font-bold text-charcoal-900">Report Detail</h1>
      </header>
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite"><Spinner className="h-6 w-6 text-forest-700" /><p className="text-sm font-medium text-charcoal-600">Loading report…</p></div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We could not load this report"><p>{loadError}</p><button type="button" onClick={load} className="btn btn-secondary mt-3"><FiRefreshCw className="h-4 w-4" aria-hidden="true" /> Try again</button></AlertMessage>
      ) : report ? (
        <>
          <section className="card p-5" aria-label="Report summary">
            <h2 className="text-base font-semibold text-charcoal-900">{report.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-charcoal-700">{report.description}</p>
            <p className="mt-3 text-xs text-charcoal-500">{formatDate(report.createdAt)} · Status {report.status} · Risk {report.riskLevel || 'not assessed'}</p>
            <p className="mt-1 text-xs text-charcoal-500">Farmer: {report.farmer ? `${report.farmer.name} (${report.farmer.email})` : 'unknown'} · Farm: {report.farm ? `${report.farm.name} · ${report.farm.district || ''} ${report.farm.province || ''}` : 'unknown'}</p>
            {(report.symptoms || []).length > 0 && <p className="mt-2 text-sm text-charcoal-700">Signs: {report.symptoms.map((s) => s.symptom && s.symptom.name).filter(Boolean).join(', ')}</p>}
          </section>
          {(report.referrals || []).length > 0 && (
            <section className="card p-5" aria-label="Related referrals">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">Related referrals</h2>
              <ul className="mt-3 space-y-2">
                {report.referrals.map((referral) => (
                  <li key={referral.id}><Link className="font-semibold text-forest-700 hover:underline" to={`/admin/referrals/${referral.id}`}>Referral {referral.id.slice(0, 8)}</Link><span className="ml-2 text-xs text-charcoal-500">{referral.status}</span></li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : null}
    </div>
  )
}
