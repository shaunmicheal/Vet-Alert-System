import { useState } from 'react'
import { FiCheckCircle, FiSend, FiXCircle } from 'react-icons/fi'
import { updateVetCaseStatus } from '../../api/vet'
import { getApiErrorMessage } from '../../utils/errors'
import {
  availableCaseTransitions,
  CASE_STATUS_EXPLANATIONS,
  CASE_TRANSITION_LABELS,
} from '../../utils/vetCases'
import CaseStatusBadge from './CaseStatusBadge'
import Spinner from '../ui/Spinner'

const TRANSITION_ICONS = Object.freeze({
  ACCEPTED: FiCheckCircle,
  DECLINED: FiXCircle,
  IN_PROGRESS: FiSend,
  COMPLETED: FiCheckCircle,
})

// Case Actions panel for the detail page. Shows only the transitions the
// backend allows from the case's CURRENT status; non-confirmed transitions
// submit inline, confirmed ones (decline, complete) open a dialog via onConfirm.
export default function CaseActionPanel({ vetCase, onConfirm, onUpdated }) {
  const [pendingStatus, setPendingStatus] = useState(null)
  const [actionError, setActionError] = useState(null)
  const transitions = availableCaseTransitions(vetCase)

  const handleAction = (targetStatus) => {
    if (pendingStatus) return
    setActionError(null)
    onConfirm(targetStatus)
  }

  const handleDirectAction = (targetStatus) => {
    if (pendingStatus) return
    setPendingStatus(targetStatus)
    setActionError(null)

    updateVetCaseStatus(vetCase.id, targetStatus)
      .then((updated) => {
        setPendingStatus(null)
        onUpdated(updated, targetStatus)
      })
      .catch((requestError) => {
        setActionError(getApiErrorMessage(requestError))
        setPendingStatus(null)
      })
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="case-actions-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="case-actions-title" className="text-base font-semibold text-charcoal-900">
          Case actions
        </h2>
        <CaseStatusBadge status={vetCase.status} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
        {CASE_STATUS_EXPLANATIONS[vetCase.status] || ''}
      </p>

      {transitions.length === 0 ? (
        <p className="mt-4 rounded-lg border border-charcoal-200 bg-cream-100 px-3.5 py-3 text-sm text-charcoal-600">
          No further actions are available for this case.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {transitions.map((targetStatus) => {
            const Icon = TRANSITION_ICONS[targetStatus] || FiSend
            const isPending = pendingStatus === targetStatus
            const isDecline = targetStatus === 'DECLINED'
            return (
              <button
                key={targetStatus}
                type="button"
                onClick={() =>
                  targetStatus === 'DECLINED' || targetStatus === 'COMPLETED'
                    ? handleAction(targetStatus)
                    : handleDirectAction(targetStatus)
                }
                disabled={pendingStatus !== null}
                aria-busy={isPending}
                className={isDecline ? 'btn btn-secondary' : 'btn btn-primary'}
              >
                {isPending ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Updating…
                  </>
                ) : (
                  <>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {CASE_TRANSITION_LABELS[targetStatus]}
                  </>
                )}
              </button>
            )
          })}
        </div>
      )}

      {actionError && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}
    </section>
  )
}
