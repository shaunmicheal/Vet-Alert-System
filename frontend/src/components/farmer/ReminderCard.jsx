import { FiCalendar, FiCheck, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { completeReminder } from '../../api/reminders'
import { useState } from 'react'
import { getApiErrorMessage } from '../../utils/errors'
import {
  REMINDER_TYPE_LABELS,
  formatDueDate,
  getReminderState,
} from '../../utils/reminders'
import ReminderStatusBadge from './ReminderStatusBadge'
import Spinner from '../ui/Spinner'

export default function ReminderCard({ reminder, onEdit, onDelete, onCompleted }) {
  const [completing, setCompleting] = useState(false)
  const [actionError, setActionError] = useState(null)
  const state = getReminderState(reminder)
  const description = (reminder.description || '').trim()
  const typeLabel = REMINDER_TYPE_LABELS[reminder.type] || reminder.type

  const handleComplete = () => {
    if (completing || reminder.completed) return
    setCompleting(true)
    setActionError(null)
    completeReminder(reminder.id)
      .then((updated) => {
        onCompleted(updated)
      })
      .catch((error) => {
        setActionError(getApiErrorMessage(error))
        setCompleting(false)
      })
  }

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words text-charcoal-900">{reminder.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal-500">
            <span className="inline-flex items-center gap-1">
              <FiCalendar className="h-3.5 w-3.5" aria-hidden="true" />
              Due {formatDueDate(reminder.dueDate) || '—'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{typeLabel}</span>
          </p>
          {description && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed whitespace-pre-line text-charcoal-700">
              {description}
            </p>
          )}
          {actionError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {actionError}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ReminderStatusBadge state={state} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-charcoal-100 pt-3">
        {!reminder.completed && (
          <button type="button" onClick={handleComplete} disabled={completing} aria-busy={completing} className="btn btn-primary px-3 py-2 text-xs sm:text-sm">
            {completing ? (<><Spinner className="h-4 w-4" />Marking…</>) : (<><FiCheck className="h-4 w-4" aria-hidden="true" />Mark done</>)}
          </button>
        )}
        <button type="button" onClick={() => onEdit(reminder)} className="btn btn-secondary px-3 py-2 text-xs sm:text-sm">
          <FiEdit2 className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
        <button type="button" onClick={() => onDelete(reminder)} className="btn btn-ghost px-3 py-2 text-xs text-red-700 hover:bg-red-50 hover:text-red-800 sm:text-sm">
          <FiTrash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </button>
      </div>
    </li>
  )
}
