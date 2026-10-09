import { REMINDER_STATE_LABELS } from '../../utils/reminders'

const STATE_STYLES = Object.freeze({
  upcoming: 'border-charcoal-200 bg-charcoal-100 text-charcoal-700',
  'due-today': 'border-earth-200 bg-earth-50 text-earth-800',
  overdue: 'border-red-200 bg-red-50 text-red-800',
  completed: 'border-forest-200 bg-forest-50 text-forest-800',
})

export default function ReminderStatusBadge({ state }) {
  const className = STATE_STYLES[state] || STATE_STYLES.upcoming

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {REMINDER_STATE_LABELS[state] || state}
    </span>
  )
}
