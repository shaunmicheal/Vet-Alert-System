import api from './client'

// Farm profile endpoints - /api/farmer/farm is scoped to the logged-in farmer
// by the backend; the frontend never sends a farmer id.
export const getMyFarm = async () => {
  const { data } = await api.get('/farmer/farm')
  return data.data.farm // Farm object or null when none exists yet
}

export const createMyFarm = async (payload) => {
  const { data } = await api.post('/farmer/farm', payload)
  return data.data.farm
}

export const updateMyFarm = async (payload) => {
  const { data } = await api.patch('/farmer/farm', payload)
  return data.data.farm
}