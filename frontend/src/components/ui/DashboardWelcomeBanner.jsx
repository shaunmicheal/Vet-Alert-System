import { LIVESTOCK_IMAGES } from '../../utils/livestockImages'

export default function DashboardWelcomeBanner({
  eyebrow,
  title,
  description,
  image = LIVESTOCK_IMAGES.farmer,
  action,
  imagePosition = 'center 40%',
  stats = [],
}) {
  return (
    <section
      aria-label={typeof title === 'string' ? title : 'Welcome'}
      className="relative overflow-hidden rounded-2xl bg-forest-950 shadow-[0_18px_40px_-20px_rgba(15,33,20,0.55)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-forest-600/25 blur-2xl"
      />
      <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-8">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-sm font-medium text-forest-100/90">{eyebrow}</p>
          )}
          <h1
            className={`${eyebrow ? 'mt-2' : ''} text-2xl font-bold tracking-tight text-white sm:text-3xl`}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-forest-100/90">{description}</p>
          )}
          {stats.length > 0 && (
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-200/80">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 text-xl font-bold text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {action}
          </div>
        </div>
        <div
          className="relative h-44 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-forest-900 shadow-lg sm:h-52 lg:h-56 lg:w-[22rem]"
          role="img"
          aria-label={image.alt || 'Livestock grazing in a green field'}
        >
          <img
            src={image.src}
            alt=""
            aria-hidden="true"
            loading={image.loading || 'lazy'}
            decoding="async"
            width={image.width}
            height={image.height}
            style={{ objectPosition: imagePosition }}
            className="absolute inset-0 h-full w-full bg-forest-900 object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-forest-950/55 via-transparent to-transparent"
          />
        </div>
      </div>
    </section>
  )
}
