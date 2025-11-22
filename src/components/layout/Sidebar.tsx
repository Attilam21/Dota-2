'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Nuova struttura organizzata per sezioni
const navSections = [
  {
    title: 'Analisi Core',
    items: [
      { label: 'Panoramica', href: '/dashboard' },
      { label: 'Performance & Stile di Gioco', href: '/dashboard/performance' },
      { label: 'Hero Pool', href: '/dashboard/heroes' },
      { label: 'Team & Compagni', href: '/dashboard/teams-peers' },
      { label: 'Partite', href: '/dashboard/matches' },
    ],
  },
  {
    title: 'Coaching',
    items: [
      { label: 'Coaching & Task', href: '/dashboard/coaching' },
      { label: 'Profilazione FZTH', href: '/dashboard/profile' },
    ],
  },
  {
    title: 'Avanzato',
    items: [{ label: 'Esplora dati', href: '/dashboard/explorer' }],
  },
  {
    title: 'Sistema',
    items: [{ label: 'Impostazioni account', href: '/dashboard/settings' }],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-neutral-800 px-4 py-6">
      <div className="mb-6 px-2 text-sm font-semibold tracking-wide text-neutral-300">
        FZTH Dashboard
      </div>
      <nav className="space-y-6">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'block rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-300 hover:bg-neutral-900/60 hover:text-white',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
