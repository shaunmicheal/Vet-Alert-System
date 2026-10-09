import api from './client'

export const getMyAnimals = async () => {
  const { data } = await api.get('/animals')
  return data.data.animals
}

export const createAnimal = async (payload) => {
  const { data } = await api.post('/animals', payload)
  return data.data.animal
}

export const updateAnimal = async (id, payload) => {
  const { data } = await api.put(`/animals/${id}`, payload)
  return data.data.animal
}

export const deleteAnimal = async (id) => {
  const { data } = await api.delete(`/animals/${id}`)
  return data.data
}
