import { Link } from 'react-router-dom'
import { FiArrowRight, FiBell } from 'react-icons/fi'
import {
  countOverdueReminders,
  formatDueDate,
  nearestIncompleteReminder,
  REMINDER_TYPE_LABELS,
} from '../../utils/reminders'

export default function ReminderSummaryCard({ reminders, failed }) {
  if (failed) return null
  const list = Array.isArray(reminders) ? reminders : []
  const upcoming = list.filter((reminder) => !reminder.completed)
  const overdue = countOverdueReminders(list)
  const nearest = nearestIncompleteReminder(list)

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-cream-50" aria-hidden="true">
          <FiBell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="section-eyebrow">Schedule</p>
          <p className="truncate text-sm font-semibold text-charcoal-900">
            {upcoming.length === 0
              ? 'No upcoming reminders.'
              : `${upcoming.length} upcoming task${upcoming.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
      <div className="px-5 py-4">
      {overdue > 0 && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
          {overdue} overdue reminder{overdue > 1 ? 's need' : ' needs'} your attention.
        </p>
      )}
      {nearest ? (
        <p className="mt-3 text-sm leading-relaxed text-charcoal-700">
          Next: <span className="font-semibold text-charcoal-900">{nearest.title}</span>
          {` · ${REMINDER_TYPE_LABELS[nearest.type] || nearest.type} · due ${formatDueDate(nearest.dueDate) || '—'}`}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-charcoal-600">
          No upcoming reminders. Add vaccination, deworming or dipping tasks to stay ahead.
        </p>
      )}
      <Link to="/farmer/reminders" className="btn btn-secondary mt-4 w-full sm:w-auto">
        View all reminders
        <FiArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      </div>
    </div>
  )
}
