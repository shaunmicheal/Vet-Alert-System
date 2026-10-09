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
        <svg viewBox="0 0 64 64" className="h-6 w-6" role="presentation" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 22 C14 15 19 12 23 15 L26 17 C28 15 36 15 38 17 L41 15 C45 12 50 15 50 22 L46 30 C44 36 40 44 32 44 C24 44 20 36 18 30 Z" />
            <path d="M20 20 L17 14" />
            <path d="M44 20 L47 14" />
          </g>
          <path d="M32 44 C32 50 36 53 42 53 L46 53" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
        </svg>
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
