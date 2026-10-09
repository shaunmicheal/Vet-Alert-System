import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiMail, FiPhone, FiRefreshCw, FiUser } from 'react-icons/fi'
import { getVetCase } from '../../api/vet'
import CaseStatusBadge from '../../components/vet/CaseStatusBadge'
import CaseActionPanel from '../../components/vet/CaseActionPanel'
import ConfirmCaseStatusDialog from '../../components/vet/ConfirmCaseStatusDialog'
import ProfessionalResponseForm from '../../components/vet/ProfessionalResponseForm'
import ReportStatusBadge from '../../components/farmer/ReportStatusBadge'
import RiskBadge from '../../components/farmer/RiskBadge'
import TriageResult from '../../components/farmer/TriageResult'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'

const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '—')
const show = (value) => (value === null || value === undefined || value === '' ? null : value)

export default function VetCaseDetailPage() {
  const { id } = useParams()
  const [vetCase, setVetCase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [flash, setFlash] = useState(null)
  const [confirmStatus, setConfirmStatus] = useState(null)
  const report = vetCase ? vetCase.report || {} : {}
  const farmer = vetCase ? vetCase.farmer || {} : {}
  const farm = report.farm || {}
  const animal = report.animal || null
  useDocumentTitle(vetCase ? (report.title || 'Case') : 'Case')
  const loadCase = useCallback(() => {
    return getVetCase(id)
      .then((data) => {
        setVetCase(data)
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
    loadCase()
  }, [loadCase])
  const reloadCase = () => {
    setLoading(true)
    setLoadError(null)
    loadCase()
  }
  const handleStatusUpdated = (updated, targetStatus) => {
    setVetCase(updated)
    setConfirmStatus(null)
    setFlash(`Case status updated to ${targetStatus === 'IN_PROGRESS' ? 'In progress' : targetStatus.charAt(0) + targetStatus.slice(1).toLowerCase()}.`)
  }
  const handleResponseUpdated = (updated) => {
    setVetCase(updated)
    setFlash('Your professional response has been saved.')
  }
  const animalLabel = animal ? ANIMAL_TYPE_LABELS[animal.animalType] || animal.animalType : null
  const farmerMessage = show(vetCase ? vetCase.farmerMessage : null)
  const professionalResponse = show(vetCase ? vetCase.professionalResponse : null)
  const symptomNames = (report.symptoms || []).map((link) => (link && link.symptom ? link.symptom.name : null)).filter(Boolean)
  const storedTriage = report.aiAssessment
    ? { riskLevel: report.riskLevel, assessment: report.aiAssessment, recommendations: report.aiRecommendations }
    : null
  return (
    <div className="space-y-6">
      <div>
        <Link to="/vet/cases" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline">
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to assigned cases
        </Link>
      </div>
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite">
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading this case…</p>
        </div>
      ) : loadError ? (
        <AlertMessage variant="error" title="We couldn’t load this case">
          <p>{loadError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={reloadCase} className="btn btn-secondary">
              <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
            <Link to="/vet/cases" className="btn btn-ghost">Back to assigned cases</Link>
          </div>
        </AlertMessage>
      ) : (
        <>
          {flash && (
            <AlertMessage variant="success">{flash}</AlertMessage>
          )}
          <header className="card p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">Assigned case</p>
            <h1 className="mt-1 text-xl font-bold text-charcoal-900 sm:text-2xl">{report.title || 'Health report case'}</h1>
            <p className="mt-1 text-xs text-charcoal-500">
              Referred {formatDate(vetCase.createdAt)}
              {vetCase.updatedAt && vetCase.updatedAt !== vetCase.createdAt ? ` · Updated ${formatDate(vetCase.updatedAt)}` : ''}
            </p>
            <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2">
              <CaseStatusBadge status={vetCase.status} />
              <ReportStatusBadge status={report.status} />
              <RiskBadge riskLevel={report.riskLevel} />
            </div>
          </header>
          <section className="card p-5 sm:p-6" aria-labelledby="case-farmer-title">
            <h2 id="case-farmer-title" className="text-base font-semibold text-charcoal-900">Farmer</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-earth-100 text-earth-700" aria-hidden="true">
                <FiUser className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-charcoal-900">{farmer.name || 'Farmer'}</p>
                <p className="text-xs text-charcoal-500">Contact for this case</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              {show(farmer.phone) && (
                <div className="flex items-start gap-2 text-charcoal-700">
                  <FiPhone className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
                  <dd>{farmer.phone}</dd>
                </div>
              )}
              {show(farmer.email) && (
                <div className="flex items-start gap-2 text-charcoal-700">
                  <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" aria-hidden="true" />
                  <dd className="break-all">{farmer.email}</dd>
                </div>
              )}
              {!show(farmer.phone) && !show(farmer.email) && (
                <p className="text-sm text-charcoal-500">No contact details provided.</p>
              )}
            </dl>
          </section>
          <section className="card p-5 sm:p-6" aria-labelledby="case-farm-title">
            <h2 id="case-farm-title" className="text-base font-semibold text-charcoal-900">Farm and location</h2>
            {farm && farm.name ? (
              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Farm</dt>
                  <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{farm.name}</dd>
                </div>
                {show(farm.province) && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Province</dt>
                    <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{farm.province}</dd>
                  </div>
                )}
                {show(farm.district) && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">District</dt>
                    <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{farm.district}</dd>
                  </div>
                )}
                {show(farm.ward) && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Ward</dt>
                    <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{farm.ward}</dd>
                  </div>
                )}
                {show(farm.village) && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Village</dt>
                    <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{farm.village}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-charcoal-500">No farm details recorded for this report.</p>
            )}
          </section>
          <section className="card p-5 sm:p-6" aria-labelledby="case-health-title">
            <h2 id="case-health-title" className="text-base font-semibold text-charcoal-900">Animal and health information</h2>
            {show(report.description) && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal-800">{report.description}</p>
            )}
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Animal</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{animal ? `${animal.name || 'Unnamed animal'} (${animalLabel})${animal.tagNumber ? ` · ${animal.tagNumber}` : ''}` : 'General farm report'}</dd>
              </div>
              {animal && show(animal.breed) && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Breed</dt>
                  <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{animal.breed}</dd>
                </div>
              )}
              {animal && animal.age != null && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Age</dt>
                  <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{animal.age}</dd>
                </div>
              )}
              {animal && show(animal.sex) && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Sex</dt>
                  <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{animal.sex === 'MALE' ? 'Male' : animal.sex === 'FEMALE' ? 'Female' : animal.sex}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Signs recorded</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{symptomNames.length ? symptomNames.join(', ') : 'None recorded'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">How long</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{show(report.symptomsDuration) || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Appetite</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{show(report.appetite) || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Difficulty breathing</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{yesNo(report.breathingDifficulty)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Animals affected</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{report.affectedAnimals != null ? report.affectedAnimals : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Moved between farms</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{yesNo(report.recentMovement)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Vaccinated recently</dt>
                <dd className="mt-0.5 text-sm font-medium text-charcoal-800">{yesNo(report.recentVaccination)}</dd>
              </div>
              {show(report.recentTreatment) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Treatment already given</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm font-medium text-charcoal-800">{report.recentTreatment}</dd>
                </div>
              )}
              {show(report.additionalNotes) && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Additional notes</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm font-medium text-charcoal-800">{report.additionalNotes}</dd>
                </div>
              )}
            </dl>
          </section>
          {storedTriage && <TriageResult triage={storedTriage} />}
          <CaseActionPanel
            vetCase={vetCase}
            onConfirm={(targetStatus) => {
              setFlash(null)
              setConfirmStatus(targetStatus)
            }}
            onUpdated={handleStatusUpdated}
          />
          <ProfessionalResponseForm vetCase={vetCase} onUpdated={handleResponseUpdated} />
          <section className="card p-5 sm:p-6" aria-labelledby="case-referral-title">
            <h2 id="case-referral-title" className="text-base font-semibold text-charcoal-900">Referral</h2>
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Farmer message</h3>
              {farmerMessage ? (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-charcoal-800">{farmerMessage}</p>
              ) : (
                <p className="mt-1 text-sm text-charcoal-500">The farmer did not add a message.</p>
              )}
            </div>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-400">Your response</h3>
              {professionalResponse ? (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-charcoal-800">{professionalResponse}</p>
              ) : (
                <p className="mt-1 text-sm text-charcoal-500">You have not responded yet. Use the response form above to reply to the farmer.</p>
              )}
            </div>
          </section>
          {confirmStatus && (
            <ConfirmCaseStatusDialog
              vetCase={vetCase}
              targetStatus={confirmStatus}
              onCancel={() => setConfirmStatus(null)}
              onUpdated={handleStatusUpdated}
            />
          )}
        </>
      )}
    </div>
  )
}
