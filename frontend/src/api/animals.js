import api from './client'

// Animal endpoints. Ownership comes from the authenticated session - the
// backend scopes every request to the logged-in farmer's own farm.
export const getMyAnimals = async () => {
  const { data } = await api.get('/animals')
  return data.data.animals
}

// POST /api/animals -> 201 { animal }
export const createAnimal = async (payload) => {
  const { data } = await api.post('/animals', payload)
  return data.data.animal
}

// PUT /api/animals/:id -> { animal }
export const updateAnimal = async (id, payload) => {
  const { data } = await api.put(`/animals/${id}`, payload)
  return data.data.animal
}

// DELETE /api/animals/:id -> { message }
export const deleteAnimal = async (id) => {
  const { data } = await api.delete(`/animals/${id}`)
  return data.data
}