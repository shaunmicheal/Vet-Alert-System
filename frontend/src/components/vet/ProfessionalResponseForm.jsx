import { useState } from 'react'
import { FiMessageSquare, FiSend } from 'react-icons/fi'
import { respondToVetCase } from '../../api/vet'
import { getApiErrorMessage } from '../../utils/errors'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

const MIN_LENGTH = 10
const MAX_LENGTH = 2000

export default function ProfessionalResponseForm({ vetCase, onUpdated }) {
  const existing = (vetCase.professionalResponse || '').trim()
  const [response, setResponse] = useState(existing)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [saved, setSaved] = useState(false)

  const trimmed = response.trim()
  const clientError =
    touched && trimmed.length === 0
      ? 'Please write a response before sending.'
      : touched && trimmed.length < MIN_LENGTH
        ? `Response must be at least ${MIN_LENGTH} characters.`
        : trimmed.length > MAX_LENGTH
          ? `Response must be ${MAX_LENGTH} characters or fewer.`
          : null
  const unchanged = trimmed === existing
  const canSubmit = !submitting && !clientError && !unchanged

  const handleSubmit = (event) => {
    event.preventDefault()
    setTouched(true)
    setSaved(false)
    if (trimmed.length === 0 || trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) return
    if (submitting || unchanged) return
    setSubmitting(true)
    setFormError(null)

    respondToVetCase(vetCase.id, trimmed)
      .then((updated) => {
        setSubmitting(false)
        setSaved(true)
        setResponse((updated.professionalResponse || '').trim())
        onUpdated(updated)
      })
      .catch((requestError) => {
        setFormError(getApiErrorMessage(requestError))
        setSubmitting(false)
      })
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="professional-response-title">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700"
          aria-hidden="true"
        >
          <FiMessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h2 id="professional-response-title" className="text-base font-semibold text-charcoal-900">
            Your professional response
          </h2>
          <p className="text-xs text-charcoal-500">
            Written by you for the farmer, not AI-generated advice.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
        <div>
          <label htmlFor="professional-response" className="field-label">
            {existing ? 'Update your response' : 'Respond to the farmer'}
          </label>
          <textarea
            id="professional-response"
            rows={5}
            value={response}
            maxLength={MAX_LENGTH + 100}
            onChange={(event) => {
              setResponse(event.target.value)
              setSaved(false)
            }}
            onBlur={() => setTouched(true)}
            placeholder="Explain what you found, what the farmer should do next, and when to contact you again…"
            className="field-input resize-y"
            aria-invalid={clientError ? 'true' : 'false'}
            aria-describedby={clientError ? 'professional-response-error' : undefined}
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            {clientError ? (
              <p id="professional-response-error" className="field-error" role="alert">
                {clientError}
              </p>
            ) : (
              <p className="text-xs text-charcoal-500">
                {existing ? 'Editing replaces your previous response.' : 'The farmer will see this on their referral page.'}
              </p>
            )}
            <p className="shrink-0 text-xs text-charcoal-400" aria-live="polite">
              {trimmed.length}/{MAX_LENGTH}
            </p>
          </div>
        </div>

        {formError && <AlertMessage variant="error">{formError}</AlertMessage>}
        {saved && (
          <AlertMessage variant="success">Your response has been saved.</AlertMessage>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="submit" className="btn btn-primary" disabled={!canSubmit} aria-busy={submitting}>
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" />
                Sending…
              </>
            ) : (
              <>
                <FiSend className="h-4 w-4" aria-hidden="true" />
                {existing ? 'Update response' : 'Send response'}
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
