import api from './client'

// Veterinary professional workspace endpoints.
// Every query and mutation is scoped by the backend to referrals assigned to
// the logged-in professional's own record - the frontend never supplies
// ownership fields (no farmerId, no professionalId).
export const VET_CASE_STATUSES = Object.freeze([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
])

// GET /api/vet/cases -> referrals assigned to this professional, most recently
// updated first. Each case carries its report (animal/farm/symptoms + AI triage
// columns), the farmer's contact details (never a password), and the public
// view of the professional record.
export const getVetCases = async () => {
  const { data } = await api.get('/vet/cases')
  return data.data.cases
}

// GET /api/vet/cases/:id -> one assigned case in full (404 otherwise, so a vet
// can never probe cases assigned to another professional).
export const getVetCase = async (id) => {
  const { data } = await api.get(`/vet/cases/${id}`)
  return data.data.case
}

// PATCH /api/vet/cases/:id/status -> { case } with the persisted status.
// Body: { status } only. Allowed transitions (backend REFERRAL_STATUS_TRANSITIONS):
// PENDING -> ACCEPTED | DECLINED; ACCEPTED -> IN_PROGRESS;
// IN_PROGRESS -> COMPLETED; COMPLETED/DECLINED are terminal (409 otherwise).
export const updateVetCaseStatus = async (id, status) => {
  const { data } = await api.patch(`/vet/cases/${id}/status`, { status })
  return data.data.case
}

// PATCH /api/vet/cases/:id/response -> { case } with the persisted response.
// Body: { professionalResponse } only (trimmed, 10-2000 chars). Allowed on any
// assigned case - no status restriction in the backend.
export const respondToVetCase = async (id, professionalResponse) => {
  const { data } = await api.patch(`/vet/cases/${id}/response`, { professionalResponse })
  return data.data.case
}

// GET /api/vet/profile -> this professional's own record, or null when no
// professional profile is linked to the account yet. Identity comes from the
// authenticated JWT; the frontend never sends farmer/professional/user ids.
export const getVetProfile = async () => {
  const { data } = await api.get('/vet/profile')
  return data.data.profile ?? null
}

// PATCH /api/vet/profile -> partial update of the editable professional fields
// only (name, professionalType, phone, email, province, district,
// specialisation, availability). The backend schema is a strict object, so any
// other key (role, isActive, userId) is rejected with a 400. Returns the
// persisted { profile }.
export const updateVetProfile = async (payload) => {
  const { data } = await api.patch('/vet/profile', payload)
  return data.data.profile
}
