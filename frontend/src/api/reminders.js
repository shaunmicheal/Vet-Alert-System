import api from './client'

// Farmer reminder endpoints. Every request is scoped to the logged-in farmer by
// the backend (farmerId is derived from the auth token, never the client).
// The backend owns validation/ownership - this module only shapes payloads to
// match the existing contract (see backend/src/routes/reminderRoutes.js).
export const REMINDER_TYPES = Object.freeze([
  'VACCINATION',
  'DEWORMING',
  'DIPPING',
  'PREGNANCY_CHECK',
  'FOLLOW_UP',
  'OTHER',
])

// GET /api/reminders -> the farmer's own reminders, uncompleted first then
// oldest due date first.
export const getMyReminders = async () => {
  const { data } = await api.get('/reminders')
  return data.data.reminders
}

// GET /api/reminders/:id -> one of the farmer's own reminders (404 otherwise).
export const getReminder = async (id) => {
  const { data } = await api.get(`/reminders/${id}`)
  return data.data.reminder
}

// POST /api/reminders -> 201 { reminder }.
// Body: { title, description?, type, dueDate (YYYY-MM-DD) }.
export const createReminder = async (payload) => {
  const { data } = await api.post('/reminders', payload)
  return data.data.reminder
}

// PATCH /api/reminders/:id -> { reminder }.
// Only the editable fields are ever sent: title, description, type, dueDate.
export const updateReminder = async (id, payload) => {
  const { data } = await api.patch(`/reminders/${id}`, payload)
  return data.data.reminder
}

// PATCH /api/reminders/:id/complete -> { reminder } with completed: true.
// Completion is a persisted backend transition, never a local-only flag.
export const completeReminder = async (id) => {
  const { data } = await api.patch(`/reminders/${id}/complete`)
  return data.data.reminder
}

// DELETE /api/reminders/:id -> { success: true }.
export const deleteReminder = async (id) => {
  const { data } = await api.delete(`/reminders/${id}`)
  return data.data
}
