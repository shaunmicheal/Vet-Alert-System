import { Link, Outlet } from 'react-router-dom'
import { FaUserMd } from 'react-icons/fa'
import { FiAlertTriangle, FiFileText } from 'react-icons/fi'
import Logo from '../components/Logo'

const CURRENT_YEAR = new Date().getFullYear()

const FEATURES = [
  {
    icon: FiAlertTriangle,
    title: 'Early health alerts',
    description: 'High-risk cases and possible clusters are flagged straight away.',
  },
  {
    icon: FiFileText,
    title: 'Practical health advisories',
    description: 'Every assessment includes clear recommendations and warning signs to watch for.',
  },
  {
    icon: FaUserMd,
    title: 'Trusted professionals',
    description: 'Connect with veterinary professionals across Zimbabwe.',
  },
]

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-cream-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest-800 px-10 py-12 lg:flex xl:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-earth-500/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-24 h-64 w-64 rounded-full bg-forest-600/40"
        />

        <Link to="/" className="relative w-fit inline-block" aria-label="VetAlert Zimbabwe home">
          <Logo tone="light" />
        </Link>

        <div className="relative my-10 max-w-md">
          <h1 className="text-3xl font-bold leading-snug text-white xl:text-4xl">
            Protecting livestock health across Zimbabwe.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-forest-100">
            Early warnings, AI-assisted triage and a trusted veterinary network, built for farmers,
            veterinary professionals and administrators.
          </p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-900/70 text-forest-200">
                  <feature.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{feature.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-forest-100/90">
                    {feature.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-forest-100/70">
          © {CURRENT_YEAR} VetAlert Zimbabwe. Practical animal health tools for every
          province.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-charcoal-200 bg-white px-5 py-4 sm:px-8 lg:hidden">
          <Link to="/" aria-label="VetAlert Zimbabwe home">
            <Logo />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
