import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi'
import AlertMessage from '../../components/ui/AlertMessage'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { homePathForRole } from '../../utils/constants'
import { getApiErrorMessage } from '../../utils/errors'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  useDocumentTitle('Sign in')

  const { login, sessionExpired, clearSessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values) => {
    try {
      setFormError(null)
      clearSessionExpired()
      const user = await login(values)

      const homePath = homePathForRole(user.role)
      const requestedPath = location.state && location.state.from && location.state.from.pathname
      const isOwnWorkspace =
        typeof requestedPath === 'string' &&
        (requestedPath === homePath || requestedPath.startsWith(`${homePath}/`))
      const destination = isOwnWorkspace ? requestedPath : homePath

      navigate(destination, { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest-700">
          VetAlert Zimbabwe
        </p>
        <h1 className="mt-2 text-2xl font-bold text-charcoal-900 sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-charcoal-600">Sign in to your workspace to continue.</p>
      </div>

      {sessionExpired && (
        <AlertMessage variant="warning" className="mb-5">
          Your session has expired. Please sign in again.
        </AlertMessage>
      )}

      {formError && (
        <AlertMessage variant="error" className="mb-5">
          {formError}
        </AlertMessage>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="login-email" className="field-label">
            Email address
          </label>
          <div className="relative">
            <FiMail
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
              aria-hidden="true"
            />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="field-input pl-10"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="field-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="field-label">
            Password
          </label>
          <div className="relative">
            <FiLock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
              aria-hidden="true"
            />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="field-input pl-10 pr-11"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-charcoal-500 transition hover:bg-charcoal-100 hover:text-charcoal-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <FiEyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <FiEye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="login-password-error" className="field-error" role="alert">
              {errors.password.message}
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
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal-600">
        New farmer?{' '}
        <Link
          to="/register"
          className="font-semibold text-forest-700 underline-offset-2 hover:underline"
        >
          Create a farmer account
        </Link>
      </p>
      <p className="mt-3 text-center text-xs leading-relaxed text-charcoal-500">
        Veterinary professionals and administrators receive accounts from VetAlert. Contact your
        administrator for access.
      </p>
    </div>
  )
}
