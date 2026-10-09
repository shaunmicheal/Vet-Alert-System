import { FiMapPin } from 'react-icons/fi'
import EmptyState from '../components/ui/EmptyState'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function ModulePlaceholder({ title, icon: Icon = FiMapPin }) {
  useDocumentTitle(title)

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          VetAlert Zimbabwe
        </p>
        <h1 className="mt-1 text-2xl font-bold text-charcoal-900">{title}</h1>
      </header>

      <EmptyState
        icon={Icon}
        title="Coming in a later phase"
        description={`The ${title} area is part of a later VetAlert Zimbabwe release. Navigation, permissions and the application shell are already in place.`}
      />
    </div>
  )
}
