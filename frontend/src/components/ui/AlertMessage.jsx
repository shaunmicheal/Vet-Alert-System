import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi'

const VARIANTS = {
  error: { container: 'border-red-200 bg-red-50 text-red-800', Icon: FiAlertCircle },
  success: { container: 'border-forest-200 bg-forest-50 text-forest-800', Icon: FiCheckCircle },
  warning: { container: 'border-amber-200 bg-amber-50 text-amber-800', Icon: FiAlertTriangle },
  info: { container: 'border-sky-200 bg-sky-50 text-sky-900', Icon: FiInfo },
}

// Simple inline message for API errors, confirmations and information.
export default function AlertMessage({ variant = 'info', title, children, className = '' }) {
  const { container, Icon } = VARIANTS[variant] || VARIANTS.info
  const role = variant === 'error' ? 'alert' : 'status'

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${container} ${className}`}
      role={role}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5 space-y-1' : 'space-y-1'}>{children}</div>
      </div>
    </div>
  )
}