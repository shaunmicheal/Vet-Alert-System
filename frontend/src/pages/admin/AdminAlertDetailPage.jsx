import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import { getAdminAlert } from '../../api/admin'
import AlertStatusBadge from '../../components/admin/AlertStatusBadge'
import AlertTypeBadge from '../../components/admin/AlertTypeBadge'
import ConfirmAcknowledgeDialog from '../../components/admin/ConfirmAcknowledgeDialog'
import RiskBadge from '../../components/farmer/RiskBadge'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ANIMAL_TYPE_LABELS, REPORT_STATUS_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

export default function AdminAlertDetailPage() {
  const { id } = useParams()

  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useDocumentTitle(alert ? alert.title : 'Alert detail')

  const loadAlert = useCallback(() => {
    return getAdminAlert(id)
      .then((data) => {
        if (!data || typeof data !== 'object') {
          setLoadError('The server sent an unexpected response. Please try again.')
          return
        }
        setAlert(data)
        setLoadError(null)
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    loadAlert()
  }, [loadAlert])

  const reloadAlert = () => {
    setLoading(true)
    setLoadError(null)
    loadAlert()
  }

  const handleAcknowledged = (updated) => {
    setAlert(updated)
    setConfirmOpen(false)
    setNotice(
      'Alert acknowledged. It is now marked as handled and no longer active. This records administrative handling only - the underlying health situation may still need attention.'
    )
  }

  const report = alert?.report || null

  const symptomNames = useMemo(
    () => (report?.symptoms || []).map((entry) => entry.symptom?.name).filter(Boolean),
    [report]
  )

  const createdLabel = alert ? formatDate(alert.createdAt) : ''
  const updatedLabel =
    alert && alert.updatedAt && alert.updatedAt !== alert.createdAt ? formatDate(alert.updatedAt) : ''

  const scopeRows = []
  if (alert?.province) {
    scopeRows.push({ key: 'province', label: 'Province', value: alert.province })
  }
  if (alert?.district) {
    scopeRows.push({ key: 'district', label: 'District', value: alert.district })
  }
  if (alert?.animalType) {
    scopeRows.push({
      key: 'animalType',
      label: 'Animal type',
      value: ANIMAL_TYPE_LABELS[alert.animalType] || alert.animalType,
    })
  }
  if (typeof alert?.reportCount === 'number') {
    scopeRows.push({
      key: 'reportCount',
      label: 'Linked health reports',
      value: String(alert.reportCount),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/alerts"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to alerts
        </Link>
      </div>

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-16"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading alert…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load this alert">
          <p>{loadError}</p>
          <button type="button" onClick={reloadAlert} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      ) : alert ? (
        <>
          {notice && <AlertMessage variant="success">{notice}</AlertMessage>}

          <section className="card p-5 sm:p-6" aria-labelledby="alert-detail-title">
            <div className="flex flex-wrap items-center gap-2">
              <AlertTypeBadge type={alert.type} />
              <AlertStatusBadge isActive={alert.isActive} />
            </div>

            <h1 id="alert-detail-title" className="mt-3 text-2xl font-bold text-charcoal-900">
              {alert.title}
            </h1>
            {(createdLabel || updatedLabel) && (
              <p className="mt-1 text-xs text-charcoal-500">
                {createdLabel && `Created ${createdLabel}`}
                {createdLabel && updatedLabel && ' · '}
                {updatedLabel && `Updated ${updatedLabel}`}
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-charcoal-700">
              {alert.message}
            </p>

            {scopeRows.length > 0 ? (
              <dl className="mt-5 space-y-2.5 border-t border-charcoal-100 pt-4 text-sm">
                {scopeRows.map((row) => (
                  <div key={row.key} className="flex items-baseline justify-between gap-4 sm:block">
                    <dt className="font-medium text-charcoal-500">{row.label}</dt>
                    <dd className="text-charcoal-800 sm:mt-0.5">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-5 border-t border-charcoal-100 pt-4 text-sm text-charcoal-600">
                This alert is not scoped to a specific province, district or animal type.
              </p>
            )}
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="linked-report-title">
            <h2 id="linked-report-title" className="text-base font-semibold text-charcoal-900">
              Linked health report
            </h2>

            {report ? (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-charcoal-200 bg-charcoal-100 px-2.5 py-0.5 text-xs font-medium text-charcoal-600">
                    {REPORT_STATUS_LABELS[report.status] || report.status}
                  </span>
                  {report.riskLevel ? (
                    <RiskBadge riskLevel={report.riskLevel} />
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-charcoal-200 bg-white px-2.5 py-0.5 text-xs font-medium text-charcoal-600">
                      Not assessed
                    </span>
                  )}
                </div>

                <p className="mt-3 font-semibold text-charcoal-900">{report.title}</p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-charcoal-700">
                  {report.description}
                </p>

                <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-charcoal-100 pt-4 text-sm sm:grid-cols-2">
                  {report.farm?.province && (
                    <div className="flex items-baseline justify-between gap-4 sm:block">
                      <dt className="font-medium text-charcoal-500">Farm province</dt>
                      <dd className="text-charcoal-800 sm:mt-0.5">{report.farm.province}</dd>
                    </div>
                  )}
                  {report.farm?.district && (
                    <div className="flex items-baseline justify-between gap-4 sm:block">
                      <dt className="font-medium text-charcoal-500">Farm district</dt>
                      <dd className="text-charcoal-800 sm:mt-0.5">{report.farm.district}</dd>
                    </div>
                  )}
                  {report.animal?.animalType && (
                    <div className="flex items-baseline justify-between gap-4 sm:block">
                      <dt className="font-medium text-charcoal-500">Animal type</dt>
                      <dd className="text-charcoal-800 sm:mt-0.5">
                        {ANIMAL_TYPE_LABELS[report.animal.animalType] || report.animal.animalType}
                      </dd>
                    </div>
                  )}
                  {report.createdAt && (
                    <div className="flex items-baseline justify-between gap-4 sm:block">
                      <dt className="font-medium text-charcoal-500">Reported</dt>
                      <dd className="text-charcoal-800 sm:mt-0.5">{formatDate(report.createdAt)}</dd>
                    </div>
                  )}
                </dl>

                {symptomNames.length > 0 && (
                  <div className="mt-4 border-t border-charcoal-100 pt-4">
                    <p className="text-sm font-medium text-charcoal-500">Reported symptoms</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {symptomNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center rounded-full border border-charcoal-200 bg-white px-2.5 py-0.5 text-xs font-medium text-charcoal-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
                This alert is not linked to a single health report. It covers a wider
                administrative concern rather than one specific submission.
              </p>
            )}
          </section>

          <AlertMessage variant="info" title="How to read this alert">
            <p>
              High-risk reports are risk indications, not confirmed diagnoses. Possible
              cluster alerts describe possible health clusters where further veterinary
              investigation is recommended - they are not confirmed outbreaks.
              Acknowledging records that this alert has been handled administratively
              only.
            </p>
          </AlertMessage>

          {alert.isActive ? (
            <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-charcoal-900">This alert is active</p>
                <p className="mt-1 text-sm text-charcoal-600">
                  Acknowledge it once it has been reviewed so it no longer appears among
                  active alerts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="btn btn-primary self-start sm:self-auto"
              >
                <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
                Acknowledge alert
              </button>
            </div>
          ) : (
            <AlertMessage variant="success" title="Acknowledged">
              <p>
                This alert has been handled administratively and is no longer active.
                Acknowledgement does not mean the underlying health situation has been
                resolved.
              </p>
            </AlertMessage>
          )}
        </>
      ) : null}

      {confirmOpen && alert && (
        <ConfirmAcknowledgeDialog
          alert={alert}
          onCancel={() => setConfirmOpen(false)}
          onAcknowledged={handleAcknowledged}
        />
      )}
    </div>
  )
}
