import { FaPaw } from 'react-icons/fa'

// VetAlert Zimbabwe wordmark. Use tone="light" on dark (forest) backgrounds.
export default function Logo({ tone = 'dark', compact = false }) {
  const isLight = tone === 'light'

  return (
    <span className="flex items-center gap-2.5">
      <span
        className={
          isLight
            ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-forest-800 shadow-sm'
            : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-700 text-cream-100 shadow-sm'
        }
        aria-hidden="true"
      >
        <FaPaw className="h-4 w-4" />
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={
            isLight
              ? 'text-[15px] font-bold tracking-tight text-white'
              : 'text-[15px] font-bold tracking-tight text-charcoal-900'
          }
        >
          VetAlert <span className={isLight ? 'text-forest-200' : 'text-forest-700'}>Zimbabwe</span>
        </span>
        {!compact && (
          <span
            className={
              isLight
                ? 'text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-200/80'
                : 'text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal-500'
            }
          >
            Livestock early warning
          </span>
        )}
      </span>
    </span>
  )
}