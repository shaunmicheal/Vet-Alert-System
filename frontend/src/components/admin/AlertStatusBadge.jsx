export default function AlertStatusBadge({ isActive }) {
  if (isActive) {
    return (
      <span className="badge font-semibold border-amber-200 bg-amber-50 text-amber-800">
        Active
      </span>
    )
  }

  return (
    <span className="badge border-charcoal-200 bg-charcoal-100 text-charcoal-600">
      Acknowledged
    </span>
  )
}
