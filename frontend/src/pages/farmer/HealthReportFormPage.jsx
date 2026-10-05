import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { getMyAnimals } from '../../api/animals'
import HealthReportForm from '../../components/farmer/HealthReportForm'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'

// New health report. Animals come from the real Phase 6C endpoint so the farmer
// can link a report to one of their own animals.
export default function HealthReportFormPage() {
  useDocumentTitle('New Health Report')

  const navigate = useNavigate()
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [animalsError, setAnimalsError] = useState(null)

  const loadAnimals = useCallback(() => {
    return getMyAnimals()
      .then((list) => {
        setAnimals(list)
        setAnimalsError(null)
      })
      .catch((error) => {
        setAnimalsError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadAnimals()
  }, [loadAnimals])

  // The form created the report and ran the separate AI triage step. If only the
  // AI step failed, the report is still saved and shown with a friendly notice.
  const handleSubmitted = ({ report, triageError }) => {
    navigate(`/farmer/reports/${report.id}`, {
      replace: true,
      state: triageError
        ? {
            notice: `Your report was saved, but the AI-assisted risk assessment could not be completed. ${triageError}`,
          }
        : null,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/farmer/reports"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to health reports
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-charcoal-900">New Health Report</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Describe what you are seeing so VetAlert can assess the risk level.
        </p>
      </div>

      {loading ? (
        <div
          className="card flex items-center justify-center gap-3 px-6 py-12"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-5 w-5 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading your animals…</p>
        </div>
      ) : (
        <>
          {animalsError && (
            <AlertMessage variant="warning" className="mb-5">
              We couldn’t load your animals, so this report cannot be linked to one. You can still
              submit a general farm report.
            </AlertMessage>
          )}

          <HealthReportForm
            animals={animals}
            onSubmitted={handleSubmitted}
            onCancel={() => navigate('/farmer/reports')}
          />
        </>
      )}
    </div>
  )
}