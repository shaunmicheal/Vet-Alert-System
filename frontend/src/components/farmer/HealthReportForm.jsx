import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createHealthReport, runTriage } from '../../api/healthReports'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

// Mirrors the backend createReportSchema (backend/src/routes/healthReportRoutes.js).
// The backend has no symptoms listing endpoint, so symptomIds are not sent and
// the farmer describes the signs in the description instead.
const optionalText = (max, label) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer`)

const wholeNumber = (max, label) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d+$/.test(value) && Number(value) <= max), {
      message: `${label} must be a whole number between 0 and ${max}`,
    })

const healthReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(160, 'Title must be 160 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(10, 'Please describe the problem in at least 10 characters')
    .max(4000, 'Description must be 4000 characters or fewer'),
  animalId: z.string().trim(),
  symptomsDuration: optionalText(120, 'How long the signs have been showing'),
  appetite: optionalText(80, 'Appetite'),
  breathingDifficulty: z.boolean(),
  affectedAnimals: wholeNumber(100000, 'Number of affected animals'),
  recentMovement: z.boolean(),
  recentVaccination: z.boolean(),
  recentTreatment: optionalText(500, 'Recent treatment'),
  additionalNotes: optionalText(2000, 'Additional notes'),
})

// Form values -> backend payload. Blank optional values are omitted.
const toPayload = (values) => {
  const payload = { title: values.title, description: values.description }
  if (values.animalId !== '') payload.animalId = values.animalId
  if (values.symptomsDuration !== '') payload.symptomsDuration = values.symptomsDuration
  if (values.appetite !== '') payload.appetite = values.appetite
  if (values.breathingDifficulty) payload.breathingDifficulty = true
  if (values.affectedAnimals !== '') payload.affectedAnimals = Number(values.affectedAnimals)
  if (values.recentMovement) payload.recentMovement = true
  if (values.recentVaccination) payload.recentVaccination = true
  if (values.recentTreatment !== '') payload.recentTreatment = values.recentTreatment
  if (values.additionalNotes !== '') payload.additionalNotes = values.additionalNotes
  return payload
}

// Shared label helper for the animal select (kept local to this component).
const animalOptionLabel = (animal) => {
  const type = ANIMAL_TYPE_LABELS[animal.animalType] || animal.animalType
  const name = animal.name || 'Unnamed animal'
  return animal.tagNumber ? `${name} (${type}) · ${animal.tagNumber}` : `${name} (${type})`
}

// New health report form. On success the report is created and the separate
// AI triage step runs automatically, so the farmer lands on a finished report.
export default function HealthReportForm({ animals, onSubmitted, onCancel }) {
  const [stage, setStage] = useState('form')
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(healthReportSchema),
    defaultValues: {
      title: '',
      description: '',
      animalId: '',
      symptomsDuration: '',
      appetite: '',
      breathingDifficulty: false,
      affectedAnimals: '',
      recentMovement: false,
      recentVaccination: false,
      recentTreatment: '',
      additionalNotes: '',
    },
  })

  const onSubmit = async (values) => {
    setFormError(null)
    setStage('assessing')

    try {
      const report = await createHealthReport(toPayload(values))
      try {
        const result = await runTriage(report.id)
        onSubmitted({
          report: result.report || report,
          triage: result.aiTriage,
          triageError: null,
        })
      } catch (triageError) {
        // The report was saved - only the AI step failed. Continue to the
        // report page so the farmer can retry the assessment later.
        onSubmitted({ report, triage: null, triageError: getApiErrorMessage(triageError) })
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error))
      setStage('form')
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {formError && (
        <AlertMessage variant="error" title="We couldn’t submit your report">
          {formError}
        </AlertMessage>
      )}

      {/* Report details */}
      <section className="card p-5 sm:p-6" aria-labelledby="report-details-heading">
        <h2
          id="report-details-heading"
          className="text-base font-semibold text-charcoal-900"
        >
          Report details
        </h2>
        <p className="mt-1 text-sm text-charcoal-600">
          Tell us what you are seeing on your farm.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="report-title" className="field-label">
              Report title *
            </label>
            <input
              id="report-title"
              type="text"
              placeholder="e.g. Cow coughing and off feed"
              className="field-input"
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? 'report-title-error' : undefined}
              {...register('title')}
            />
            <FieldError id="report-title-error" error={errors.title} />
          </div>

          <div>
            <label htmlFor="report-description" className="field-label">
              What have you noticed? *
            </label>
            <textarea
              id="report-description"
              rows={4}
              placeholder="Describe the signs you have seen, where they started, and anything unusual."
              className="field-input resize-y"
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={
                errors.description ? 'report-description-error' : 'report-description-hint'
              }
              {...register('description')}
            />
            {!errors.description && (
              <p id="report-description-hint" className="mt-1.5 text-xs text-charcoal-500">
                This description is what the AI-assisted risk assessment reads, so include the signs
                you actually observed.
              </p>
            )}
            <FieldError id="report-description-error" error={errors.description} />
          </div>

          <div>
            <label htmlFor="report-animal" className="field-label">
              Which animal is affected? <span className="font-normal text-charcoal-400">(optional)</span>
            </label>
            <select
              id="report-animal"
              className="field-input pr-8"
              aria-invalid={errors.animalId ? 'true' : 'false'}
              aria-describedby={errors.animalId ? 'report-animal-error' : undefined}
              {...register('animalId')}
            >
              <option value="">General farm report (not about one animal)</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animalOptionLabel(animal)}
                </option>
              ))}
            </select>
            {animals.length === 0 && (
              <p className="mt-1.5 text-xs text-charcoal-500">
                You have no registered animals yet — you can still submit a general farm report.
              </p>
            )}
            <FieldError id="report-animal-error" error={errors.animalId} />
          </div>
        </div>
      </section>
      {/* Signs and symptoms */}
      <section className="card p-5 sm:p-6" aria-labelledby="report-signs-heading">
        <h2 id="report-signs-heading" className="text-base font-semibold text-charcoal-900">
          Signs and symptoms
        </h2>
        <p className="mt-1 text-sm text-charcoal-600">
          These details help the AI-assisted risk assessment rate the urgency.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="report-duration" className="field-label">
              How long have the signs been showing?{' '}
              <span className="font-normal text-charcoal-400">(optional)</span>
            </label>
            <input
              id="report-duration"
              type="text"
              placeholder="e.g. 3 days"
              className="field-input"
              aria-invalid={errors.symptomsDuration ? 'true' : 'false'}
              aria-describedby={errors.symptomsDuration ? 'report-duration-error' : undefined}
              {...register('symptomsDuration')}
            />
            <FieldError id="report-duration-error" error={errors.symptomsDuration} />
          </div>

          <div>
            <label htmlFor="report-appetite" className="field-label">
              Appetite <span className="font-normal text-charcoal-400">(optional)</span>
            </label>
            <input
              id="report-appetite"
              type="text"
              placeholder="e.g. Reduced, not eating, eating normally"
              className="field-input"
              aria-invalid={errors.appetite ? 'true' : 'false'}
              aria-describedby={errors.appetite ? 'report-appetite-error' : undefined}
              {...register('appetite')}
            />
            <FieldError id="report-appetite-error" error={errors.appetite} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="report-affected" className="field-label">
                How many animals are affected?{' '}
                <span className="font-normal text-charcoal-400">(optional)</span>
              </label>
              <input
                id="report-affected"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 2"
                className="field-input"
                aria-invalid={errors.affectedAnimals ? 'true' : 'false'}
                aria-describedby={errors.affectedAnimals ? 'report-affected-error' : undefined}
                {...register('affectedAnimals')}
              />
              <FieldError id="report-affected-error" error={errors.affectedAnimals} />
            </div>

            <div className="flex items-end">
              <div className="flex min-h-[42px] w-full items-center gap-2.5 rounded-lg border border-charcoal-200 bg-cream-50 px-3.5 py-2.5">
                <input
                  id="report-breathing"
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-charcoal-300 text-forest-700 focus:ring-forest-600"
                  {...register('breathingDifficulty')}
                />
                <label
                  htmlFor="report-breathing"
                  className="text-sm font-medium text-charcoal-700"
                >
                  Difficulty breathing observed
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent events */}
      <section className="card p-5 sm:p-6" aria-labelledby="report-events-heading">
        <h2 id="report-events-heading" className="text-base font-semibold text-charcoal-900">
          Recent events
        </h2>
        <p className="mt-1 text-sm text-charcoal-600">
          Changes in the last few weeks that may be relevant.
        </p>

        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 rounded-lg border border-charcoal-200 bg-cream-50 px-3.5 py-2.5">
              <input
                id="report-movement"
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-charcoal-300 text-forest-700 focus:ring-forest-600"
                {...register('recentMovement')}
              />
              <label htmlFor="report-movement" className="text-sm font-medium text-charcoal-700">
                Animals moved between farms or herds recently
              </label>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-charcoal-200 bg-cream-50 px-3.5 py-2.5">
              <input
                id="report-vaccination"
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-charcoal-300 text-forest-700 focus:ring-forest-600"
                {...register('recentVaccination')}
              />
              <label htmlFor="report-vaccination" className="text-sm font-medium text-charcoal-700">
                Vaccinations given recently
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="report-treatment" className="field-label">
              Treatment or medicine already given{' '}
              <span className="font-normal text-charcoal-400">(optional)</span>
            </label>
            <textarea
              id="report-treatment"
              rows={2}
              placeholder="What has been done so far, including anything given to the animals."
              className="field-input resize-y"
              aria-invalid={errors.recentTreatment ? 'true' : 'false'}
              aria-describedby={errors.recentTreatment ? 'report-treatment-error' : undefined}
              {...register('recentTreatment')}
            />
            <FieldError id="report-treatment-error" error={errors.recentTreatment} />
          </div>
        </div>
      </section>
      {/* Additional information */}
      <section className="card p-5 sm:p-6" aria-labelledby="report-notes-heading">
        <h2 id="report-notes-heading" className="text-base font-semibold text-charcoal-900">
          Additional information
        </h2>
        <p className="mt-1 text-sm text-charcoal-600">
          Anything else a veterinary professional should know.
        </p>

        <div className="mt-4">
          <label htmlFor="report-notes" className="field-label">
            Any other notes <span className="font-normal text-charcoal-400">(optional)</span>
          </label>
          <textarea
            id="report-notes"
            rows={3}
            placeholder="For example: new animals bought recently, water source changes, or other farms nearby with similar signs."
            className="field-input resize-y"
            aria-invalid={errors.additionalNotes ? 'true' : 'false'}
            aria-describedby={errors.additionalNotes ? 'report-notes-error' : undefined}
            {...register('additionalNotes')}
          />
          <FieldError id="report-notes-error" error={errors.additionalNotes} />
        </div>
      </section>

      {/* Submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="btn btn-primary min-h-[44px]"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="h-4 w-4" />
              {stage === 'assessing'
                ? 'Assessing the health report…'
                : 'Submitting your report…'}
            </>
          ) : (
            'Submit health report'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <p className="text-xs leading-relaxed text-charcoal-500">
          After submitting, VetAlert runs an AI-assisted risk assessment. It is health guidance,
          not a veterinary diagnosis.
        </p>
      </div>
    </form>
  )
}

// Small inline field error, matching the pattern used on the farm form.
function FieldError({ id, error }) {
  if (!error) return null
  return (
    <p id={id} className="field-error" role="alert">
      {error.message}
    </p>
  )
}