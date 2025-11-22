'use client'

import Link from 'next/link'
import { useActivePlayer } from '@/hooks/useActivePlayer'

export default function AdvancedAnalysisPage() {
  const { activePlayer, loading } = useActivePlayer()

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-neutral-400">Caricamento...</div>
      </div>
    )
  }

  const sections = [
    {
      title: 'Lane & Early Game',
      href: '/dashboard/advanced/lane-and-early',
      description:
        'Analisi della fase di lane e early game: CS, XP, lane winrate, first blood involvement.',
      icon: '🎯',
    },
    {
      title: 'Farm & Economy',
      href: '/dashboard/advanced/farm-and-economy',
      description:
        'Efficienza di farm e economy: GPM, XPM, dead gold, item timing, gold lead.',
      icon: '💰',
    },
    {
      title: 'Fights & Damage',
      href: '/dashboard/advanced/fights-and-damage',
      description:
        'Contributo ai fight e damage output: kill participation, damage share, teamfight impact.',
      icon: '⚔️',
    },
    {
      title: 'Vision & Map Control',
      href: '/dashboard/advanced/vision-and-map',
      description:
        'Controllo mappa e visione: wards piazzate/rimosse, heatmap posizioni, map control.',
      icon: '🗺️',
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analisi Avanzate</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Analisi approfondite delle performance di gioco con metriche
          dettagliate e visualizzazioni avanzate.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900"
          >
            <div className="mb-3 text-2xl">{section.icon}</div>
            <h2 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-400">
              {section.title}
            </h2>
            <p className="text-sm text-neutral-400">{section.description}</p>
          </Link>
        ))}
      </div>

      {!activePlayer && (
        <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
          <p className="text-sm text-yellow-200">
            ⚠️ Nessun giocatore attivo. Usa la modalità DEMO per visualizzare le
            analisi.
          </p>
        </div>
      )}
    </div>
  )
}
