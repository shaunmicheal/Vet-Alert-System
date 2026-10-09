import api from './client'

export const REMINDER_TYPES = Object.freeze([
  'VACCINATION',
  'DEWORMING',
  'DIPPING',
  'PREGNANCY_CHECK',
  'FOLLOW_UP',
  'OTHER',
])

export const getMyReminders = async () => {
  const { data } = await api.get('/reminders')
  return data.data.reminders
}

export const getReminder = async (id) => {
  const { data } = await api.get(`/reminders/${id}`)
  return data.data.reminder
}

export const createReminder = async (payload) => {
  const { data } = await api.post('/reminders', payload)
  return data.data.reminder
}

export const updateReminder = async (id, payload) => {
  const { data } = await api.patch(`/reminders/${id}`, payload)
  return data.data.reminder
}

export const completeReminder = async (id) => {
  const { data } = await api.patch(`/reminders/${id}/complete`)
  return data.data.reminder
}

export const deleteReminder = async (id) => {
  const { data } = await api.delete(`/reminders/${id}`)
  return data.data
}
