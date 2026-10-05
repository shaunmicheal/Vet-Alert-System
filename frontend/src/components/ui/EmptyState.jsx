// Reusable empty state for pages that have nothing to show yet.
export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={`card flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-forest-700">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <h2 className="text-lg font-semibold text-charcoal-900">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-charcoal-600">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}