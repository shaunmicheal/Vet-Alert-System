import { VET_CASE_STATUSES } from '../api/vet'
import { REFERRAL_STATUS_LABELS } from './referrals'
import { ANIMAL_TYPE_LABELS, REPORT_STATUS_LABELS, RISK_LEVEL_LABELS } from './constants'

export { VET_CASE_STATUSES }

export const VET_CASE_GROUPS = Object.freeze({
  PENDING: ['PENDING'],
  ACTIVE: ['ACCEPTED', 'IN_PROGRESS'],
  CLOSED: ['COMPLETED', 'DECLINED'],
})

export const VET_CASE_TRANSITIONS = Object.freeze({
  PENDING: ['ACCEPTED', 'DECLINED'],
  ACCEPTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  DECLINED: [],
})

export const availableCaseTransitions = (vetCase) => {
  if (!vetCase) return []
  return [...(VET_CASE_TRANSITIONS[vetCase.status] || [])]
}

export const CASE_TRANSITION_LABELS = Object.freeze({
  ACCEPTED: 'Accept referral',
  DECLINED: 'Decline referral',
  IN_PROGRESS: 'Mark in progress',
  COMPLETED: 'Mark completed',
})

export const CASE_STATUS_EXPLANATIONS = Object.freeze({
  PENDING: 'Awaiting your action. Accept the referral to take the case, or decline it so the farmer can seek another professional.',
  ACCEPTED: 'Referral accepted. Start work on the case when ready.',
  IN_PROGRESS: 'You are actively handling this case.',
  COMPLETED: 'This case has been completed.',
  DECLINED: 'This referral was declined. The farmer may seek another veterinary professional.',
})

export const CONFIRMED_TRANSITIONS = Object.freeze(['DECLINED', 'COMPLETED'])

export const requiresStatusConfirmation = (status) => CONFIRMED_TRANSITIONS.includes(status)

export const isActionableCase = (vetCase) =>
  vetCase != null && ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(vetCase.status)

export const countCasesByStatus = (cases) => {
  const counts = { PENDING: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, DECLINED: 0 }
  ;(Array.isArray(cases) ? cases : []).forEach((vetCase) => {
    if (vetCase && Object.prototype.hasOwnProperty.call(counts, vetCase.status)) {
      counts[vetCase.status] += 1
    }
  })
  return counts
}

export const sortCasesByPriority = (cases) =>
  [...(Array.isArray(cases) ? cases : [])].sort((a, b) => {
    const aHigh = a && a.report && a.report.riskLevel === 'HIGH' ? 0 : 1
    const bHigh = b && b.report && b.report.riskLevel === 'HIGH' ? 0 : 1
    if (aHigh !== bHigh) return aHigh - bHigh
    const aTime = a && a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTime = b && b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return bTime - aTime
  })

export const caseReference = (vetCase) => {
  if (!vetCase) return 'Case'
  const report = vetCase.report || {}
  const farmer = vetCase.farmer || {}
  const title = report.title || 'Health report'
  return farmer.name ? `${title} · ${farmer.name}` : title
}

export const caseLocation = (vetCase) => {
  const farm = (vetCase && vetCase.report && vetCase.report.farm) || {}
  if (farm.district && farm.province) return `${farm.district}, ${farm.province}`
  return farm.district || farm.province || ''
}

export const caseAnimalLabel = (vetCase) => {
  const animal = (vetCase && vetCase.report && vetCase.report.animal) || null
  if (!animal) return ''
  const typeLabel = ANIMAL_TYPE_LABELS[animal.animalType] || animal.animalType
  const name = animal.name || (animal.tagNumber ? `Tag ${animal.tagNumber}` : '')
  return [typeLabel, name].filter(Boolean).join(' · ')
}

export const caseStatusLabel = (status) => REFERRAL_STATUS_LABELS[status] || status || 'Unknown'

export const reportStatusLabel = (status) => REPORT_STATUS_LABELS[status] || status || 'Unknown'

export const riskLevelLabel = (riskLevel) => RISK_LEVEL_LABELS[riskLevel] || 'Not assessed'
