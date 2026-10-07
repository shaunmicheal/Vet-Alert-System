import api from './client'

// Veterinary directory - read-only list of active veterinary professionals.
// RBAC: the backend allows FARMER and VETERINARY_PROFESSIONAL only.
export const getVeterinaryDirectory = async (params = {}) => {
  const { data } = await api.get('/vets', { params })
  return data.data.professionals
}