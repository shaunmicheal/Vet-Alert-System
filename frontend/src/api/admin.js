import api from './client'

// GET /api/admin/stats -> { statistics } platform-wide aggregates for the
// Admin Console (users, professionals, reports, alerts, referrals). The admin
// router enforces the ADMIN role from the JWT server-side - the frontend never
// sends admin/user ids and never attaches tokens manually (shared interceptor).
export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats')
  return data.data.statistics
}