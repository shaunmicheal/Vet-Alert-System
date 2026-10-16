import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiRefreshCw } from 'react-icons/fi'
import AccountDeletionNotice from '../../components/account/AccountDeletionNotice'
import AccountEmailForm from '../../components/account/AccountEmailForm'
import AccountPasswordForm from '../../components/account/AccountPasswordForm'
import AccountSummary from '../../components/account/AccountSummary'
import ProfileDetailsForm from '../../components/account/ProfileDetailsForm'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'
import { readStoredAuth, writeStoredAuth } from '../../utils/storage'
import {
  getAccount,
  updateAccountEmail,
  updateAccountPassword,
  updateAccountProfile,
} from '../../api/account'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120, 'Name is too long'),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number is too long')
    .refine((value) => value === '' || value.length >= 5, {
      message: 'Phone number is too short',
    }),
})

const emailSchema = z.object({
  email: z.email('Enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })

const toProfileValues = (user) => ({
  name: user ? user.name || '' : '',
  phone: user ? user.phone || '' : '',
})

export default function AccountPageBody({ title = 'Account settings', showDeletion = false }) {
  useDocumentTitle(title)

  const { refreshUser } = useAuth()
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [profileMessage, setProfileMessage] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [emailMessage, setEmailMessage] = useState(null)
  const [emailError, setEmailError] = useState(null)
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '' },
  })
  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', currentPassword: '' },
  })
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const loadAccount = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const user = await getAccount()
      setAccount(user)
      profileForm.reset(toProfileValues(user))
      emailForm.reset({ email: user.email || '', currentPassword: '' })
    } catch (error) {
      setLoadError(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forms are stable; refetch only on mount/retry
  }, [])

  useEffect(() => {
    loadAccount()
  }, [loadAccount])

  const syncSessionUser = useCallback(
    async (user) => {
      setAccount(user)
      const stored = readStoredAuth()
      if (stored && stored.token) writeStoredAuth({ token: stored.token, user })
      if (refreshUser) await refreshUser()
    },
    [refreshUser],
  )

  const onProfileSubmit = async (values) => {
    setProfileError(null)
    setProfileMessage(null)
    try {
      const user = await updateAccountProfile({
        name: values.name.trim(),
        phone: values.phone.trim(),
      })
      await syncSessionUser(user)
      profileForm.reset(toProfileValues(user))
      setProfileMessage('Profile details saved.')
    } catch (error) {
      setProfileError(getApiErrorMessage(error))
    }
  }

  const onEmailSubmit = async (values) => {
    setEmailError(null)
    setEmailMessage(null)
    try {
      const result = await updateAccountEmail({
        email: values.email.trim().toLowerCase(),
        currentPassword: values.currentPassword,
      })
      if (result.user) await syncSessionUser(result.user)
      emailForm.reset({ email: result.user ? result.user.email : '', currentPassword: '' })
      setEmailMessage(result.message || 'Email updated.')
    } catch (error) {
      setEmailError(getApiErrorMessage(error))
    }
  }

  const onPasswordSubmit = async (values) => {
    setPasswordError(null)
    setPasswordMessage(null)
    try {
      const result = await updateAccountPassword(values)
      passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage(result.message || 'Password updated.')
    } catch (error) {
      setPasswordError(getApiErrorMessage(error))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="h-6 w-6 text-forest-700" />
        <span className="sr-only">Loading account settings</span>
      </div>
    )
  }

  if (loadError || !account) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-lede">Manage your sign-in details and personal information.</p>
        </div>
        <AlertMessage variant="error" title="Unable to load your account">
          <p>{loadError || 'Please try again.'}</p>
          <button type="button" onClick={loadAccount} className="btn btn-secondary mt-3">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </AlertMessage>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-lede">
          Manage your personal details, email, and password. Changes apply to your VetAlert
          sign-in immediately.
        </p>
      </div>
      <AccountSummary account={account} />
      <ProfileDetailsForm
        account={account}
        form={profileForm}
        message={profileMessage}
        error={profileError}
        onSubmit={onProfileSubmit}
      />
      <AccountEmailForm
        form={emailForm}
        message={emailMessage}
        error={emailError}
        onSubmit={onEmailSubmit}
      />
      <AccountPasswordForm
        form={passwordForm}
        message={passwordMessage}
        error={passwordError}
        onSubmit={onPasswordSubmit}
      />
      {showDeletion ? <AccountDeletionNotice /> : null}
    </div>
  )
}
