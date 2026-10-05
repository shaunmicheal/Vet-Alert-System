import api from './client'

// GET /api/reports - returns the logged-in farmer's health reports,
// newest first, each including its animal and symptoms.
export const getMyHealthReports = async () => {
  const { data } = await api.get('/reports')
  return data.data.reports
}