import api from './client'

// GET /api/animals - returns every animal on the logged-in farmer's farm.
export const getMyAnimals = async () => {
  const { data } = await api.get('/animals')
  return data.data.animals
}