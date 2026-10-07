import api from './client'

// Farmer referral endpoints. All are scoped to the logged-in farmer by the
// backend (farmerId comes from the token, never the client). The backend
// supports exactly these three operations - there is no update/delete.
export const REFERRAL_STATUSES = Object.freeze([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
])

// GET /api/referrals -> the farmer's own referrals, newest first. Each entry
// includes its report (with animal/farm/symptoms + AI triage columns) and the
// public view of the assigned professional.
export const getMyReferrals = async () => {
  const { data } = await api.get('/referrals')
  return data.data.referrals
}

// GET /api/referrals/:id -> one of the farmer's own referrals (404 otherwise).
export const getReferral = async (id) => {
  const { data } = await api.get(`/referrals/${id}`)
  return data.data.referral
}

// POST /api/referrals -> 201 { referral }. Body: { reportId, professionalId,
// farmerMessage? }. farmerMessage is optional (1-1000 chars when provided).
export const createReferral = async (payload) => {
  const { data } = await api.post('/referrals', payload)
  return data.data.referral
}
