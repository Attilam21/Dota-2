'use client'

import PlayerSelector from '@/components/PlayerSelector'

export default function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-800 px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-200">
          FZTH Dota 2 Dashboard
        </h2>
      </div>
      <div className="flex items-center gap-4 text-xs text-neutral-400">
        <div className="hidden items-center gap-2 md:flex">
          <span>Account:</span>
          <PlayerSelector />
        </div>
        <div className="hidden md:block">
          {/* periodo corrente informativo */}
          Periodo: Ultimi 180 giorni
        </div>
      </div>
    </header>
  )
}
