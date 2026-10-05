import api from './client'

// The backend wraps every response as { success, data } on success and
// { success, message } on failure - unwrap the success payload here.
export const loginRequest = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials)
  return data.data
}

export const registerRequest = async (payload) => {
  const { data } = await api.post('/auth/register', payload)
  return data.data
}

export const getMeRequest = async () => {
  const { data } = await api.get('/auth/me')
  return data.data
}