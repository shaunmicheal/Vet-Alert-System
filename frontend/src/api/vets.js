import api from './client'

export const getVeterinaryDirectory = async (params = {}) => {
  const { data } = await api.get('/vets', { params })
  return data.data.professionals
}
