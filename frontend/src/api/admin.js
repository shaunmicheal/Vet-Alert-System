import api from './client'

export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats')
  return data.data.statistics
}

export const getAdminUsers = async (params = {}) => {
  const query = { page: params.page || 1, limit: params.limit || 20 }
  if (params.role) query.role = params.role
  if (params.search) query.search = params.search
  const { data } = await api.get('/admin/users', { params: query })
  return { users: data.data.users, pagination: data.data.pagination }
}

export const getAdminUser = async (id) => {
  const { data } = await api.get(`/admin/users/${id}`)
  return data.data.user
}

export const getAdminReports = async (params = {}) => {
  const query = { page: params.page || 1, limit: params.limit || 20 }
  if (params.status) query.status = params.status
  if (params.riskLevel) query.riskLevel = params.riskLevel
  if (params.province) query.province = params.province
  if (params.animalType) query.animalType = params.animalType
  if (params.search) query.search = params.search
  const { data } = await api.get('/admin/reports', { params: query })
  return { reports: data.data.reports, pagination: data.data.pagination }
}

export const getAdminReport = async (id) => {
  const { data } = await api.get(`/admin/reports/${id}`)
  return data.data.report
}

export const getAdminReferrals = async (params = {}) => {
  const query = { page: params.page || 1, limit: params.limit || 20 }
  if (params.status) query.status = params.status
  if (params.province) query.province = params.province
  if (params.search) query.search = params.search
  const { data } = await api.get('/admin/referrals', { params: query })
  return { referrals: data.data.referrals, pagination: data.data.pagination }
}

export const getAdminReferral = async (id) => {
  const { data } = await api.get(`/admin/referrals/${id}`)
  return data.data.referral
}

export const getAdminProfessionals = async (params = {}) => {
  const query = { page: params.page || 1, limit: params.limit || 20 }
  if (params.province) query.province = params.province
  if (params.isActive === true || params.isActive === false) {
    query.isActive = params.isActive ? 'true' : 'false'
  }
  if (params.search) query.search = params.search
  const { data } = await api.get('/admin/veterinary', { params: query })
  return { professionals: data.data.professionals, pagination: data.data.pagination }
}

export const getAdminProfessional = async (id) => {
  const { data } = await api.get(`/admin/veterinary/${id}`)
  return data.data.professional
}

export const getAdminAlerts = async (params = {}) => {
  const query = {}
  if (params.type) query.type = params.type
  if (params.province) query.province = params.province
  if (params.district) query.district = params.district
  if (params.animalType) query.animalType = params.animalType
  if (params.isActive === true || params.isActive === false) {
    query.isActive = params.isActive ? 'true' : 'false'
  }
  const { data } = await api.get('/admin/alerts', { params: query })
  return data.data.alerts
}

export const getAdminAlert = async (id) => {
  const { data } = await api.get(`/admin/alerts/${id}`)
  return data.data.alert
}

export const acknowledgeAdminAlert = async (id) => {
  const { data } = await api.patch(`/admin/alerts/${id}/acknowledge`)
  return data.data.alert
}

export const createAdminAlert = async (payload) => {
  const body = { title: payload.title, message: payload.message }
  if (payload.province) body.province = payload.province
  if (payload.district) body.district = payload.district
  if (payload.animalType) body.animalType = payload.animalType
  const { data } = await api.post('/admin/alerts', body)
  return data.data.alert
}

export const runAdminClusterScan = async (payload = {}) => {
  const body = {}
  if (payload.district) body.district = payload.district
  const { data } = await api.post('/admin/alerts/cluster-scan', body)
  return data.data
}
