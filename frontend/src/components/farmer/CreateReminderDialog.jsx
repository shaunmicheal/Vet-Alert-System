import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiBell, FiX } from 'react-icons/fi'
import { createReminder, updateReminder } from '../../api/reminders'
import useDialogEffects from '../../hooks/useDialogEffects'
import { getApiErrorMessage } from '../../utils/errors'
import { REMINDER_TYPE_LABELS, REMINDER_TYPES, toDateInputValue } from '../../utils/reminders'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

const TITLE_MAX = 200
const DESCRIPTION_MAX = 2000

// Mirrors the backend reminder contract exactly
// (backend/src/routes/reminderRoutes.js):
// - title: required, 1-200 chars after trim
// - description: optional, up to 2000 chars (whitespace-only is omitted)
// - type: one of the six backend enum values
// - dueDate: required YYYY-MM-DD date string
// No farmerId or any other field is ever accepted or sent.
const reminderSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Please give the reminder a title')
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or fewer`),
  description: z
    .string()
    .max(DESCRIPTION_MAX + 20, `Description must be ${DESCRIPTION_MAX} characters or fewer`)
    .refine((value) => value.trim().length <= DESCRIPTION_MAX, {
      message: `Description must be ${DESCRIPTION_MAX} characters or fewer`,
    }),
  type: z.enum(REMINDER_TYPES, 'Please choose a reminder type'),
  dueDate: z
    .string()
    .trim()
    .min(1, 'Please choose a due date')
    .refine(
      (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
        const parsed = new Date(`${value}T00:00:00Z`)
        return !Number.isNaN(parsed.getTime())
      },
      { message: 'Due date must be a valid date in YYYY-MM-DD format' },
    ),
})

const EMPTY_VALUES = Object.freeze({
  title: '',
  description: '',
  type: '',
  dueDate: '',
})

const toFormValues = (reminder) =>
  reminder
    ? {
        title: reminder.title || '',
        description: reminder.description || '',
        type: REMINDER_TYPES.includes(reminder.type) ? reminder.type : '',
        dueDate: toDateInputValue(reminder.dueDate),
      }
    : { ...EMPTY_VALUES }

// Form values -> backend payload. Only the four supported fields are sent,
// and a whitespace-only description is omitted so the strict backend schema
// never sees an empty string.
const toPayload = (values) => {
  const payload = {
    title: values.title.trim(),
    type: values.type,
    dueDate: values.dueDate.trim(),
  }
  const description = values.description.trim()
  if (description) payload.description = description
  return payload
}

// Add/edit dialog for one farmer reminder. `reminder` is null when creating;
// otherwise the same form edits through PATCH /api/reminders/:id.
export default function CreateReminderDialog({ reminder, onClose, onSaved }) {
  const isEdit = Boolean(reminder)
  useDialogEffects(onClose)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(reminderSchema),
    defaultValues: toFormValues(reminder),
  })
  const [formError, setFormError] = useState(null)
  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const payload = toPayload(values)
      const saved = isEdit ? await updateReminder(reminder.id, payload) : await createReminder(payload)
      onSaved(saved, isEdit)
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="reminder-form-title">
      <button type="button" className="absolute inset-0 bg-charcoal-900/50" aria-label="Cancel" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
            <FiBell className="h-5 w-5" aria-hidden="true" />
          </span>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800" aria-label="Close">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <h2 id="reminder-form-title" className="mt-4 text-lg font-bold text-charcoal-900">
          {isEdit ? 'Edit reminder' : 'Add a reminder'}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-charcoal-600">
          {isEdit ? 'Update the details of this reminder.' : 'Set a task such as vaccination, deworming, dipping, a pregnancy check or a follow-up.'}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="reminder-title" className="field-label">Title</label>
            <input id="reminder-title" type="text" placeholder="e.g. Vaccinate calves" className="field-input" maxLength={TITLE_MAX}
              aria-invalid={errors.title ? 'true' : 'false'} {...register('title')} />
            {errors.title && (<p className="field-error" role="alert">{errors.title.message}</p>)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reminder-type" className="field-label">Reminder type</label>
              <select id="reminder-type" className="field-input pr-8" aria-invalid={errors.type ? 'true' : 'false'} {...register('type')}>
                <option value="">Select a type</option>
                {REMINDER_TYPES.map((type) => (<option key={type} value={type}>{REMINDER_TYPE_LABELS[type]}</option>))}
              </select>
              {errors.type && (<p className="field-error" role="alert">{errors.type.message}</p>)}
            </div>
            <div>
              <label htmlFor="reminder-due-date" className="field-label">Due date</label>
              <input id="reminder-due-date" type="date" className="field-input" aria-invalid={errors.dueDate ? 'true' : 'false'} {...register('dueDate')} />
              {errors.dueDate && (<p className="field-error" role="alert">{errors.dueDate.message}</p>)}
            </div>
          </div>
          <div>
            <label htmlFor="reminder-description" className="field-label">Details <span className="font-normal text-charcoal-400">(optional)</span></label>
            <textarea id="reminder-description" rows={4} placeholder="Which animals, dosage, where supplies are kept…" className="field-input resize-y" aria-invalid={errors.description ? 'true' : 'false'} {...register('description')} />
            {errors.description && (<p className="field-error" role="alert">{errors.description.message}</p>)}
          </div>
          {formError && (<AlertMessage variant="error" className="mt-1">{formError}</AlertMessage>)}
          <div className="flex flex-col gap-3 border-t border-charcoal-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? (<><Spinner className="h-4 w-4" />Saving…</>) : isEdit ? 'Save changes' : 'Add reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
