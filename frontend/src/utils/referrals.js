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

// "What happens next" for each status, in plain language for farmers.
// A referral never means a disease has been confirmed.
export const REFERRAL_STATUS_NEXT = Object.freeze({
  PENDING: 'The professional will review your referral and accept or decline it. Any change will appear on this page.',
  ACCEPTED: 'The professional will start working on the case. Watch this page for their response.',
  IN_PROGRESS: 'The professional is handling the case right now. Check back here for updates.',
  COMPLETED: 'The case has been closed. Read the professional’s response below and contact them if you need further help.',
  DECLINED: 'This professional could not take the case. You can refer the same health report to another professional from the report page.',
})
