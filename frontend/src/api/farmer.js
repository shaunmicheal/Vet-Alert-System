import api from './client'

export const getMyFarm = async () => {
  const { data } = await api.get('/farmer/farm')
  return data.data.farm
}

export const createMyFarm = async (payload) => {
  const { data } = await api.post('/farmer/farm', payload)
  return data.data.farm
}

export const updateMyFarm = async (payload) => {
  const { data } = await api.patch('/farmer/farm', payload)
  return data.data.farm
}
