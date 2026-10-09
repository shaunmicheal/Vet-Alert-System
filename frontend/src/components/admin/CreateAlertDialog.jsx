import { useState } from 'react'
import { FiBell, FiPlus, FiX } from 'react-icons/fi'
import { createAdminAlert } from '../../api/admin'
import useDialogEffects from '../../hooks/useDialogEffects'
import { ANIMAL_TYPES, ANIMAL_TYPE_LABELS, PROVINCES } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

const EMPTY_FORM = Object.freeze({
  title: '',
  message: '',
  province: '',
  district: '',
  animalType: '',
})

const validate = (form) => {
  const errors = {}
  const title = form.title.trim()
  const message = form.message.trim()
  const district = form.district.trim()

  if (title.length < 3) errors.title = 'Title must be at least 3 characters.'
  else if (title.length > 160) errors.title = 'Title must be 160 characters or fewer.'

  if (message.length < 10) errors.message = 'Message must be at least 10 characters.'
  else if (message.length > 1000) errors.message = 'Message must be 1000 characters or fewer.'

  if (district && district.length < 2) errors.district = 'District must be at least 2 characters.'
  else if (district.length > 120) errors.district = 'District must be 120 characters or fewer.'

  return errors
}

export default function CreateAlertDialog({ onCancel, onCreated }) {
  useDialogEffects(onCancel)

  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const setField = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (submitting) return

    const errors = validate(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)

    createAdminAlert({
      title: form.title.trim(),
      message: form.message.trim(),
      province: form.province,
      district: form.district.trim(),
      animalType: form.animalType,
    })
      .then((created) => {
        setForm(EMPTY_FORM)
        setFieldErrors({})
        onCreated(created)
      })
      .catch((requestError) => {
        setSubmitError(getApiErrorMessage(requestError))
        setSubmitting(false)
      })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-alert-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal-900/50"
        aria-label="Cancel alert creation"
        onClick={onCancel}
      />

      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
            <FiBell className="h-5 w-5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800"
            aria-label="Cancel alert creation"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <h2 id="create-alert-title" className="mt-4 text-lg font-bold text-charcoal-900">
          New system alert
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
          Create a manual administrative notice. The server always records it as a System
          alert - it cannot be given cluster or high-risk semantics from here.
        </p>

        <AlertMessage variant="info" className="mt-4">
          System alerts are administrative notices only. Do not enter wording that claims a
          disease or outbreak has been confirmed.
        </AlertMessage>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label htmlFor="alert-title" className="field-label">
              Title <span className="font-normal text-charcoal-400">* (3-160 characters)</span>
            </label>
            <input
              id="alert-title"
              type="text"
              className="field-input"
              maxLength={160}
              placeholder="e.g. Quarterly vaccination reminder"
              value={form.title}
              onChange={setField('title')}
              aria-invalid={fieldErrors.title ? 'true' : 'false'}
              aria-describedby={fieldErrors.title ? 'alert-title-error' : undefined}
            />
            {fieldErrors.title && (
              <p id="alert-title-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="alert-message" className="field-label">
              Message <span className="font-normal text-charcoal-400">* (10-1000 characters)</span>
            </label>
            <textarea
              id="alert-message"
              rows={4}
              className="field-input"
              maxLength={1000}
              placeholder="What should administrators be aware of?"
              value={form.message}
              onChange={setField('message')}
              aria-invalid={fieldErrors.message ? 'true' : 'false'}
              aria-describedby={fieldErrors.message ? 'alert-message-error' : undefined}
            />
            {fieldErrors.message && (
              <p id="alert-message-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="alert-province" className="field-label">
                Province <span className="font-normal text-charcoal-400">(optional)</span>
              </label>
              <select
                id="alert-province"
                className="field-input pr-8"
                value={form.province}
                onChange={setField('province')}
              >
                <option value="">No specific province</option>
                {PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="alert-district" className="field-label">
                District <span className="font-normal text-charcoal-400">(optional)</span>
              </label>
              <input
                id="alert-district"
                type="text"
                className="field-input"
                maxLength={120}
                placeholder="e.g. Masvingo"
                value={form.district}
                onChange={setField('district')}
                aria-invalid={fieldErrors.district ? 'true' : 'false'}
                aria-describedby={fieldErrors.district ? 'alert-district-error' : undefined}
              />
              {fieldErrors.district && (
                <p id="alert-district-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.district}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="alert-animal-type" className="field-label">
              Animal type <span className="font-normal text-charcoal-400">(optional)</span>
            </label>
            <select
              id="alert-animal-type"
              className="field-input pr-8"
              value={form.animalType}
              onChange={setField('animalType')}
            >
              <option value="">Any animal type</option>
              {ANIMAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ANIMAL_TYPE_LABELS[type] || type}
                </option>
              ))}
            </select>
          </div>

          {submitError && <AlertMessage variant="error">{submitError}</AlertMessage>}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Creating…
                </>
              ) : (
                <>
                  <FiPlus className="h-4 w-4" aria-hidden="true" />
                  Create system alert
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
