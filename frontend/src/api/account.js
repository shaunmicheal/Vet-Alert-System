import api from './client'

export const getAccount = async () => {
  const { data } = await api.get('/account/me')
  return data.data.user
}

export const updateAccountProfile = async (payload) => {
  const { data } = await api.patch('/account/profile', payload)
  return data.data.user
}

export const updateAccountEmail = async (payload) => {
  const { data } = await api.patch('/account/email', payload)
  return data.data
}

export const updateAccountPassword = async (payload) => {
  const { data } = await api.patch('/account/password', payload)
  return data.data
}
