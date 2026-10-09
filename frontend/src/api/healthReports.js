import api from './client'


export const getHealthReports = async (params = {}) => {
  const { data } = await api.get('/reports', { params })
  return data.data.reports
}

export const getMyHealthReports = async () => getHealthReports()

export const getHealthReport = async (id) => {
  const { data } = await api.get(`/reports/${id}`)
  return data.data.report
}

export const createHealthReport = async (payload) => {
  const { data } = await api.post('/reports', payload)
  return data.data.report
}

export const runTriage = async (id) => {
  const { data } = await api.post(`/reports/${id}/triage`)
  return data.data
}
