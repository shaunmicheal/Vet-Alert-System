export default function AnimalSummaryCard({ label, count, highlight = false }) {
  return (
    <div className={`card p-4 ${highlight ? 'border-forest-200 bg-forest-50' : ''}`}>
      <p
        className={`text-xs font-semibold uppercase tracking-wider ${
          highlight ? 'text-forest-700' : 'text-charcoal-500'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${highlight ? 'text-forest-800' : 'text-charcoal-900'}`}
      >
        {count}
      </p>
    </div>
  )
}
