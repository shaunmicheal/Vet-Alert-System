import api from './client'

export const REFERRAL_STATUSES = Object.freeze([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
])

export const getMyReferrals = async () => {
  const { data } = await api.get('/referrals')
  return data.data.referrals
}

export const getReferral = async (id) => {
  const { data } = await api.get(`/referrals/${id}`)
  return data.data.referral
}

export const createReferral = async (payload) => {
  const { data } = await api.post('/referrals', payload)
  return data.data.referral
}
