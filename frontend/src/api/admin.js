import api from './client'

// GET /api/admin/stats -> { statistics } platform-wide aggregates for the
// Admin Console (users, professionals, reports, alerts, referrals). The admin
// router enforces the ADMIN role from the JWT server-side - the frontend never
// sends admin/user ids and never attaches tokens manually (shared interceptor).
export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats')
  return data.data.statistics
}

// GET /api/admin/alerts -> { alerts, count }. The admin router whitelists
// exactly these query keys (type, province, district, animalType, isActive -
// see backend alertQuerySchema) and rejects unknown keys with a clean 400, so
// nothing outside that list is ever forwarded. isActive must reach the server
// as the string 'true'/'false' to satisfy the backend zod enum.
export const getAdminAlerts = async (params = {}) => {
  const query = {}
  if (params.type) query.type = params.type
  if (params.province) query.province = params.province
  if (params.district) query.district = params.district
  if (params.animalType) query.animalType = params.animalType
  if (params.isActive === true || params.isActive === false) {
    query.isActive = params.isActive ? 'true' : 'false'
  }
  const { data } = await api.get('/admin/alerts', { params: query })
  return data.data.alerts
}

// GET /api/admin/alerts/:id -> { alert }. When the alert references one, the
// response also carries the linked health report (with animal, farm and
// symptoms). 404 for unknown ids, 400 for malformed ones.
export const getAdminAlert = async (id) => {
  const { data } = await api.get(`/admin/alerts/${id}`)
  return data.data.alert
}

// PATCH /api/admin/alerts/:id/acknowledge -> { alert }. The server flips
// isActive to false itself and never reads a body; acknowledging an alert
// that is already inactive is idempotent and simply returns it unchanged.
export const acknowledgeAdminAlert = async (id) => {
  const { data } = await api.patch(`/admin/alerts/${id}/acknowledge`)
  return data.data.alert
}

// POST /api/admin/alerts -> { alert } (201). The backend's strict schema
// accepts only these fields and forces type='SYSTEM'; type, isActive and
// reportId are rejected outright (400), so a manual alert can never
// impersonate a server-generated POSSIBLE_CLUSTER or HIGH_RISK alert.
export const createAdminAlert = async (payload) => {
  const body = { title: payload.title, message: payload.message }
  if (payload.province) body.province = payload.province
  if (payload.district) body.district = payload.district
  if (payload.animalType) body.animalType = payload.animalType
  const { data } = await api.post('/admin/alerts', body)
  return data.data.alert
}