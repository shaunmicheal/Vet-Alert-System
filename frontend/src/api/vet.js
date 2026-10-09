import api from './client'

export const VET_CASE_STATUSES = Object.freeze([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
])

export const getVetCases = async () => {
  const { data } = await api.get('/vet/cases')
  return data.data.cases
}

export const getVetCase = async (id) => {
  const { data } = await api.get(`/vet/cases/${id}`)
  return data.data.case
}

export const updateVetCaseStatus = async (id, status) => {
  const { data } = await api.patch(`/vet/cases/${id}/status`, { status })
  return data.data.case
}

export const respondToVetCase = async (id, professionalResponse) => {
  const { data } = await api.patch(`/vet/cases/${id}/response`, { professionalResponse })
  return data.data.case
}

export const getVetProfile = async () => {
  const { data } = await api.get('/vet/profile')
  return data.data.profile ?? null
}

export const createVetProfile = async (payload) => {
  const { data } = await api.post('/vet/profile', payload)
  return data.data.profile
}

export const updateVetProfile = async (payload) => {
  const { data } = await api.patch('/vet/profile', payload)
  return data.data.profile
}
