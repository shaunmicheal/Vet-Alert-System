import api from './client'

// Health report endpoints (all scoped to the logged-in farmer by the backend).
// NOTE: the backend has no report update/delete endpoint and no symptoms
// listing endpoint - only what exists here is implemented.

// GET /api/reports - optional filters: status, riskLevel, animalType.
// Reports are newest first and include their animal and symptoms.
export const getHealthReports = async (params = {}) => {
  const { data } = await api.get('/reports', { params })
  return data.data.reports
}

// Used by the farmer dashboard.
export const getMyHealthReports = async () => getHealthReports()

// GET /api/reports/:id - includes farm and referrals as well.
export const getHealthReport = async (id) => {
  const { data } = await api.get(`/reports/${id}`)
  return data.data.report
}

// POST /api/reports -> 201 { report }
export const createHealthReport = async (payload) => {
  const { data } = await api.post('/reports', payload)
  return data.data.report
}

// POST /api/reports/:id/triage -> { report, aiTriage }
// The AI-assisted risk assessment is a SEPARATE step: creating a report does
// not run the AI. Gemini stays server-side; the API key never reaches here.
export const runTriage = async (id) => {
  const { data } = await api.post(`/reports/${id}/triage`)
  return data.data
}