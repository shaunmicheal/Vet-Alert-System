import { useState } from 'react'
import { FiAlertCircle, FiCheck, FiX } from 'react-icons/fi'
import { updateVetCaseStatus } from '../../api/vet'
import useDialogEffects from '../../hooks/useDialogEffects'
import { getApiErrorMessage } from '../../utils/errors'
import { CASE_TRANSITION_LABELS } from '../../utils/vetCases'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

const CONFIRM_COPY = Object.freeze({
  DECLINED: {
    title: 'Decline this referral?',
    body: 'The referral status will change to Declined. The farmer will need to seek another veterinary professional for this report.',
    confirmLabel: 'Decline referral',
  },
  COMPLETED: {
    title: 'Mark this case completed?',
    body: 'The case will be closed as Completed. Make sure your response to the farmer is recorded first if one is still needed.',
    confirmLabel: 'Mark completed',
  },
})

export default function ConfirmCaseStatusDialog({ vetCase, targetStatus, onCancel, onUpdated }) {
  useDialogEffects(onCancel)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const copy = CONFIRM_COPY[targetStatus] || {
    title: `Change status to ${targetStatus}?`,
    body: 'The referral status will be updated.',
    confirmLabel: CASE_TRANSITION_LABELS[targetStatus] || 'Confirm',
  }

  const handleConfirm = () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)

    updateVetCaseStatus(vetCase.id, targetStatus)
      .then((updated) => {
        onUpdated(updated)
      })
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError))
        setSubmitting(false)
      })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-case-status-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal-900/50"
        aria-label="Cancel status change"
        onClick={onCancel}
      />

      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <FiAlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800"
            aria-label="Cancel status change"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <h2 id="confirm-case-status-title" className="mt-4 text-lg font-bold text-charcoal-900">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-600">{copy.body}</p>

        {error && (
          <AlertMessage variant="error" className="mt-4">
            {error}
          </AlertMessage>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" />
                Updating…
              </>
            ) : (
              <>
                <FiCheck className="h-4 w-4" aria-hidden="true" />
                {copy.confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
