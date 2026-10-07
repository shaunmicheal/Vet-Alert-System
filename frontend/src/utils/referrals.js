// Plain-language explanations of each referral status, written for
// non-technical farmers. A referral never means a disease has been confirmed.
export const REFERRAL_STATUS_LABELS = Object.freeze({
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
})

export const REFERRAL_STATUS_EXPLANATIONS = Object.freeze({
  PENDING: 'Your referral has been submitted and is awaiting review.',
  ACCEPTED: 'A veterinary professional has accepted the referral.',
  IN_PROGRESS: 'The veterinary professional is currently working on the case.',
  COMPLETED: 'The referral has been completed.',
  DECLINED: 'The veterinary professional was unable to accept this referral.',
})
