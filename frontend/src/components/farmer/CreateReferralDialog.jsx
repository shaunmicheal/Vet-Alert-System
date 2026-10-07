import { useState } from 'react'
import { FiCheckCircle, FiSend, FiShare2, FiX } from 'react-icons/fi'
import { createReferral } from '../../api/referrals'
import useDialogEffects from '../../hooks/useDialogEffects'
import { ANIMAL_TYPE_LABELS } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import AlertMessage from '../ui/AlertMessage'
import Spinner from '../ui/Spinner'

const MAX_MESSAGE_LENGTH = 1000

// Two-step referral creation flow: (1) optional message, (2) review + submit.
// The payload matches POST /api/referrals exactly - farmerMessage is only sent
// when it has content, and no ownership field ever comes from the client.
export default function CreateReferralDialog({ report, professional, onCancel, onCreated }) {
  useDialogEffects(onCancel)

  const [step, setStep] = useState('message') // 'message' | 'review'
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const trimmedMessage = message.trim()
  const animal = report.animal || null
  const animalLabel = animal
    ? ANIMAL_TYPE_LABELS[animal.animalType] || animal.animalType
    : 'General farm report'

  const handleSubmit = () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)

    const payload = { reportId: report.id, professionalId: professional.id }
    // Whitespace-only input is omitted so the strict backend schema
    // (min 1 char after trim) never sees an empty string.
    if (trimmedMessage) payload.farmerMessage = trimmedMessage

    createReferral(payload)
      .then((referral) => {
        onCreated(referral)
      })
      .catch((requestError) => {
        // Keep the dialog open on any failure so the farmer can retry or go back.
        setError(getApiErrorMessage(requestError))
        setSubmitting(false)
      })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-referral-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-charcoal-900/50"
        aria-label="Cancel referral"
        onClick={onCancel}
        disabled={submitting}
      />

      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
            <FiShare2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-800"
            aria-label="Cancel referral"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <h2 id="create-referral-title" className="mt-4 text-lg font-bold text-charcoal-900">
          {step === 'message' ? 'Refer this health report' : 'Review your referral'}
        </h2>

        {/* What is being shared */}
        <div className="mt-3 rounded-lg border border-charcoal-200 bg-cream-50 p-4 text-sm">
          <p className="font-semibold text-charcoal-900">{report.title}</p>
          <p className="mt-0.5 text-charcoal-600">
            {animalLabel} · Submitted {formatDate(report.createdAt)}
          </p>
          <p className="mt-2 border-t border-charcoal-200 pt-2 font-semibold text-charcoal-900">
            {professional.name}
          </p>
          <p className="mt-0.5 text-charcoal-600">
            {professional.professionalType || 'Professional'}
            {professional.district ? ` · ${professional.district}` : ''}
            {professional.province ? `, ${professional.province}` : ''}
          </p>
        </div>
