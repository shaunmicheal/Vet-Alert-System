import api from './client'

export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats')
  return data.data.statistics
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
