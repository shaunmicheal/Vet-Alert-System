import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiPhone, FiUser } from 'react-icons/fi'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getApiErrorMessage } from '../../utils/errors'

// Mirrors the backend registration schema (POST /api/auth/register).
// Registration is FARMER only - the backend assigns that role itself and the
// frontend never sends (or offers) a role field.
const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.email('Enter a valid email address'),
    phone: z.string().trim().max(30, 'Phone number must be 30 characters or fewer'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function RegisterPage() {
  useDocumentTitle('Create farmer account')

  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    try {
      setFormError(null)

      // Only fields the backend accepts - confirmPassword is never sent.
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      }
      if (values.phone.trim()) {
        payload.phone = values.phone.trim()
      }

      await registerUser(payload)
      navigate('/farmer', { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    }
  }

  const passwordToggle = (visible) => (
    <button
      type="button"
      onClick={() => setShowPassword((current) => !current)}
      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-700"
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
    >
      {visible ? (
        <FiEyeOff className="h-4 w-4" aria-hidden="true" />
      ) : (
        <FiEye className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-700">
          Farmer registration
        </p>
        <h1 className="mt-2 text-2xl font-bold text-charcoal-900 sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-charcoal-600">
          Join VetAlert Zimbabwe to report animal health issues and get early warnings.
        </p>
      </div>

      {formError && (
        <AlertMessage variant="error" className="mb-5">
          {formError}
        </AlertMessage>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="register-name" className="field-label">
            Full name
          </label>
          <div className="relative">
            <FiUser
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
              aria-hidden="true"
            />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Tendai Moyo"
              className="field-input pl-10"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'register-name-error' : undefined}
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p id="register-name-error" className="field-error" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-email" className="field-label">
            Email address
          </label>
          <div className="relative">
            <FiMail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
              aria-hidden="true"
            />
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="field-input pl-10"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="register-email-error" className="field-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-phone" className="field-label">
            Phone number <span className="font-normal text-charcoal-400">(optional)</span>
          </label>
          <div className="relative">
            <FiPhone
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
              aria-hidden="true"
            />
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+263 77 123 4567"
              className="field-input pl-10"
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'register-phone-error' : undefined}
              {...register('phone')}
            />
          </div>
          {errors.phone && (
            <p id="register-phone-error" className="field-error" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="register-password" className="field-label">
            Password
          </label>
          <div className="relative">
            <FiLock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
              aria-hidden="true"
            />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="field-input pl-10 pr-11"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'register-password-error' : undefined}
              {...register('password')}
            />
            {passwordToggle(showPassword)}
          </div>
          {errors.password && (
            <p id="register-password-error" className="field-error" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="field-label">
            Confirm password
          </label>
          <div className="relative">
            <FiLock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
              aria-hidden="true"
            />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="field-input pl-10 pr-11"
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              aria-describedby={
                errors.confirmPassword ? 'register-confirm-password-error' : undefined
              }
              {...register('confirmPassword')}
            />
            {passwordToggle(showPassword)}
          </div>
          {errors.confirmPassword && (
            <p id="register-confirm-password-error" className="field-error" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="h-4 w-4" />
              Creating account…
            </>
          ) : (
            <>
              Create farmer account
              <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal-600">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-forest-700 underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
      <p className="mt-3 text-center text-xs leading-relaxed text-charcoal-500">
        Only farmer accounts can self-register. Veterinary professionals and administrators are set
        up by VetAlert.
      </p>
    </div>
  )
}