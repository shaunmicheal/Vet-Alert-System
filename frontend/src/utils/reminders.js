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

export const todayKey = (now = new Date()) => {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

export const toDateInputValue = (dueDate) => dueDateKey(dueDate)

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
