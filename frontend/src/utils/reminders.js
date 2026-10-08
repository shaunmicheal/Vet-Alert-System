// Farmer reminder display metadata + date helpers.
//
// The backend stores due dates as persisted dates normalised to UTC midnight
// (see backend/src/services/reminderService.js: `new Date(dueDate + 'T00:00:00Z')`).
// To avoid timezone bugs, every comparison below works on calendar-date keys
// ("YYYY-MM-DD") compared lexicographically - never on raw timestamps.
import { REMINDER_TYPES } from '../api/reminders'

export { REMINDER_TYPES }

export const REMINDER_TYPE_LABELS = Object.freeze({
  VACCINATION: 'Vaccination',
  DEWORMING: 'Deworming',
  DIPPING: 'Dipping',
  PREGNANCY_CHECK: 'Pregnancy check',
  FOLLOW_UP: 'Follow-up',
  OTHER: 'Other',
})

export const REMINDER_TYPE_DESCRIPTIONS = Object.freeze({
  VACCINATION: 'Keep vaccinations on schedule to protect the herd.',
  DEWORMING: 'Regular deworming keeps animals healthy and growing.',
  DIPPING: 'Tick control through planned dipping sessions.',
  PREGNANCY_CHECK: 'Confirm pregnancies early for better planning.',
  FOLLOW_UP: 'Check back on an animal or earlier treatment.',
  OTHER: 'Any other farm task you want to remember.',
})

// "YYYY-MM-DD" for the farmer's local today.
export const todayKey = (now = new Date()) => {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Calendar-date key for a persisted reminder due date. The backend normalises
// to UTC midnight, so the UTC calendar parts are the stable source of truth;
// slicing the ISO string keeps this independent of the viewer's timezone.
export const dueDateKey = (dueDate) => {
  if (!dueDate) return ''
  try {
    const date = dueDate instanceof Date ? dueDate : new Date(dueDate)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

// Value suitable for <input type="date"> when editing an existing reminder.
export const toDateInputValue = (dueDate) => dueDateKey(dueDate)

// Farmer-friendly display, e.g. "12 Oct 2026". Falls back to "" for bad input.
export const formatDueDate = (dueDate) => {
  const key = dueDateKey(dueDate)
  if (!key) return ''
  const parsed = new Date(`${key}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// Completed reminders keep the backend value as the source of truth. Anything
// incomplete is classified against today's calendar date.
export const getReminderState = (reminder, now = new Date()) => {
  if (reminder && reminder.completed) return 'completed'
  const due = dueDateKey(reminder ? reminder.dueDate : null)
  const today = todayKey(now)
  if (!due) return 'upcoming'
  if (due < today) return 'overdue'
  if (due === today) return 'due-today'
  return 'upcoming'
}

export const REMINDER_STATE_LABELS = Object.freeze({
  upcoming: 'Upcoming',
  'due-today': 'Due today',
  overdue: 'Overdue',
  completed: 'Completed',
})

// Nearest incomplete reminder by due date (null when there is none).
export const nearestIncompleteReminder = (reminders) => {
  const incomplete = (Array.isArray(reminders) ? reminders : []).filter(
    (reminder) => reminder && !reminder.completed,
  )
  if (incomplete.length === 0) return null
  return [...incomplete].sort((a, b) => {
    const aKey = dueDateKey(a.dueDate)
    const bKey = dueDateKey(b.dueDate)
    if (aKey === bKey) return 0
    return aKey < bKey ? -1 : 1
  })[0]
}

export const countOverdueReminders = (reminders, now = new Date()) =>
  (Array.isArray(reminders) ? reminders : []).filter(
    (reminder) => getReminderState(reminder, now) === 'overdue',
  ).length
