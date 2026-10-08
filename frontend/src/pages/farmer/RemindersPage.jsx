import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiBell, FiCheckCircle, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { getMyReminders } from '../../api/reminders'
import CreateReminderDialog from '../../components/farmer/CreateReminderDialog'
import DashboardStatCard from '../../components/farmer/DashboardStatCard'
import DeleteReminderDialog from '../../components/farmer/DeleteReminderDialog'
import ReminderCard from '../../components/farmer/ReminderCard'
import AlertMessage from '../../components/ui/AlertMessage'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { REMINDER_TYPE_LABELS, REMINDER_TYPES, getReminderState } from '../../utils/reminders'

// Farmer reminders: real records from GET /api/reminders.
// Upcoming (overdue + due today + future) and completed stay in separate
// sections; filters work client-side. Create/edit share one dialog, delete
// asks for confirmation, and completion uses the persisted backend endpoint.
export default function RemindersPage() {
  useDocumentTitle('Reminders')
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [dialog, setDialog] = useState(null)
  const [flash, setFlash] = useState(null)

  const loadReminders = useCallback(() => {
    return getMyReminders()
      .then((list) => {
        setReminders(Array.isArray(list) ? list : [])
        setLoadError(null)
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const reloadReminders = () => {
    setLoading(true)
    setLoadError(null)
    loadReminders()
  }

  const summary = useMemo(() => {
    let overdue = 0
    let dueToday = 0
    let completed = 0
    reminders.forEach((reminder) => {
      const state = getReminderState(reminder)
      if (state === 'completed') completed += 1
      else if (state === 'overdue') overdue += 1
      else if (state === 'due-today') dueToday += 1
    })
    return {
      total: reminders.length,
      upcoming: reminders.length - completed,
      overdue,
      dueToday,
      completed,
    }
  }, [reminders])

  const filtered = useMemo(() => {
    if (!typeFilter) return reminders
    return reminders.filter((reminder) => reminder.type === typeFilter)
  }, [reminders, typeFilter])

  const upcoming = useMemo(() => filtered.filter((r) => !r.completed), [filtered])
  const completed = useMemo(() => filtered.filter((r) => r.completed), [filtered])
  const filtersActive = typeFilter !== ''

  const openCreate = () => {
    setFlash(null)
    setDialog({ mode: 'create' })
  }
  const openEdit = (reminder) => {
    setFlash(null)
    setDialog({ mode: 'edit', reminder })
  }
  const openDelete = (reminder) => setDialog({ mode: 'delete', reminder })
  const closeDialog = () => setDialog(null)

  const handleSaved = (saved, isEdit) => {
    setReminders((prev) => {
      const exists = prev.some((reminder) => reminder.id === saved.id)
      if (exists) return prev.map((reminder) => (reminder.id === saved.id ? saved : reminder))
      return [saved, ...prev]
    })
    setDialog(null)
    setFlash(isEdit ? 'Reminder updated.' : 'Reminder added.')
  }

  const handleCompleted = (updated) => {
    setReminders((prev) => prev.map((reminder) => (reminder.id === updated.id ? updated : reminder)))
    setFlash('Nice work - reminder marked as done.')
  }

  const handleDeleted = (deleted) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== deleted.id))
    setDialog(null)
    setFlash('Reminder deleted.')
  }

  const clearFilters = () => setTypeFilter('')

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">My Farm</p>
          <h1 className="mt-1 text-2xl font-bold text-charcoal-900">Reminders</h1>
          <p className="mt-1 max-w-2xl text-sm text-charcoal-600">
            Stay on top of vaccinations, deworming, dipping, pregnancy checks and follow-ups.
            Overdue tasks appear first so nothing slips.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn btn-primary self-start sm:self-auto">
          <FiPlus className="h-4 w-4" aria-hidden="true" />
          Add reminder
        </button>
      </header>

      {flash && (<AlertMessage variant="success">{flash}</AlertMessage>)}

      {loadError && (
        <AlertMessage variant="error" title="Could not load your reminders">
          <p>{loadError}</p>
          <button type="button" onClick={reloadReminders} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      )}
      {loading ? (
        <div className="card flex items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite">
          <Spinner className="h-6 w-6 text-forest-700" />
          <p className="text-sm font-medium text-charcoal-600">Loading your reminders…</p>
        </div>
      ) : !loadError && (
        <>
          <section aria-label="Reminder summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard icon={FiBell} label="Upcoming" value={summary.upcoming} sub={summary.overdue > 0 ? `${summary.overdue} overdue` : summary.dueToday > 0 ? `${summary.dueToday} due today` : 'All caught up'} tone={summary.overdue > 0 ? 'danger' : 'default'} />
            <DashboardStatCard icon={FiBell} label="Overdue" value={summary.overdue} sub="Needs attention now" tone="danger" />
            <DashboardStatCard icon={FiBell} label="Due today" value={summary.dueToday} sub="Plan these into today" tone="earth" />
            <DashboardStatCard icon={FiCheckCircle} label="Completed" value={summary.completed} sub="Finished tasks" />
          </section>

          {reminders.length === 0 ? (
            <EmptyState
              icon={FiBell}
              title="No reminders yet"
              description="Add vaccination, deworming, dipping, pregnancy-check or follow-up reminders so important farm tasks never slip your mind."
              action={(<button type="button" onClick={openCreate} className="btn btn-primary"><FiPlus className="h-4 w-4" aria-hidden="true" />Add your first reminder</button>)}
            />
          ) : (
            <>
              <section aria-label="Filter reminders" className="card p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="sm:w-64">
                    <label htmlFor="reminder-type-filter" className="field-label">Reminder type</label>
                    <select id="reminder-type-filter" className="field-input" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                      <option value="">All types</option>
                      {REMINDER_TYPES.map((type) => (<option key={type} value={type}>{REMINDER_TYPE_LABELS[type]}</option>))}
                    </select>
                  </div>
                  {filtersActive && (
                    <button type="button" onClick={clearFilters} className="text-sm font-semibold text-forest-700 underline-offset-2 hover:underline sm:pb-2.5">
                      Clear filter
                    </button>
                  )}
                </div>
              </section>

              {filtersActive && (
                <p className="text-sm text-charcoal-500" role="status">
                  Showing {filtered.length} of {reminders.length} reminders
                </p>
              )}

              {filtered.length === 0 ? (
                <EmptyState
                  icon={FiBell}
                  title="No reminders match this filter"
                  description="Try a different reminder type, or clear the filter to see all your reminders."
                  action={(<button type="button" onClick={clearFilters} className="btn btn-secondary">Clear filter</button>)}
                />
              ) : (
                <>
                  <section aria-label="Upcoming reminders" className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">
                      Upcoming ({upcoming.length})
                    </h2>
                    {upcoming.length === 0 ? (
                      <p className="card px-5 py-6 text-sm text-charcoal-600">
                        Nothing upcoming{typeFilter ? ' for this type' : ''} - every task is done.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {upcoming.map((reminder) => (
                          <ReminderCard key={reminder.id} reminder={reminder} onEdit={openEdit} onDelete={openDelete} onCompleted={handleCompleted} />
                        ))}
                      </ul>
                    )}
                  </section>

                  <section aria-label="Completed reminders" className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-500">
                      Completed ({completed.length})
                    </h2>
                    {completed.length === 0 ? (
                      <p className="card px-5 py-6 text-sm text-charcoal-600">
                        Nothing completed yet - mark a task as done when you finish it.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {completed.map((reminder) => (
                          <ReminderCard key={reminder.id} reminder={reminder} onEdit={openEdit} onDelete={openDelete} onCompleted={handleCompleted} />
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </>
      )}

      {(dialog?.mode === 'create' || dialog?.mode === 'edit') && (
        <CreateReminderDialog
          reminder={dialog.mode === 'edit' ? dialog.reminder : null}
          onClose={closeDialog}
          onSaved={handleSaved}
        />
      )}
      {dialog?.mode === 'delete' && (
        <DeleteReminderDialog
          reminder={dialog.reminder}
          onCancel={closeDialog}
          onDeleted={handleDeleted}
        />
      )}


    </div>
  )
}

