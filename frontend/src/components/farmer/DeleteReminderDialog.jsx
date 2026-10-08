import { useState } from 'react'
import { FiTrash2, FiX } from 'react-icons/fi'
import { deleteReminder } from '../../api/reminders'
import useDialogEffects from '../../hooks/useDialogEffects'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDueDate } from '../../utils/reminders'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

// Confirmation dialog for deleting one farmer reminder. Nothing is removed
// until the farmer confirms, and the list only changes after the backend
// confirms the delete.
export default function DeleteReminderDialog({ reminder, onCancel, onDeleted }) {
  useDialogEffects(onCancel)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const handleConfirm = () => {
    if (deleting) return
    setDeleting(true)
    setError(null)
    deleteReminder(reminder.id)
      .then(() => {
        onDeleted(reminder)
      })
      .catch((requestError) => {
        setError(getApiErrorMessage(requestError))
        setDeleting(false)
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="delete-reminder-title">
      <button type="button" className="absolute inset-0 bg-charcoal-900/50" aria-label="Cancel deletion" onClick={onCancel} />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <FiTrash2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800" aria-label="Cancel deletion">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <h2 id="delete-reminder-title" className="mt-4 text-lg font-bold text-charcoal-900">
          Delete this reminder?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
          {reminder.title} {formatDueDate(reminder.dueDate) ? `· due ${formatDueDate(reminder.dueDate)}` : ''} will be
          permanently removed. This cannot be undone.
        </p>
        {error && (<AlertMessage variant="error" className="mt-4">{error}</AlertMessage>)}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={deleting}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="btn btn-danger" disabled={deleting} aria-busy={deleting}>
            {deleting ? (<><Spinner className="h-4 w-4" />Deleting…</>) : (<><FiTrash2 className="h-4 w-4" aria-hidden="true" />Delete reminder</>)}
          </button>
        </div>
      </div>
    </div>
  )
}
