/**
 * Coaching & Task Page
 *
 * FZTH Coaching Dashboard with tasks grouped by pillar
 */

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import SkeletonLoader, {
  SkeletonGrid,
  SkeletonCard,
} from '@/components/ui/SkeletonLoader'
import { CoachingHeader } from '@/components/dota/coaching/CoachingHeader'
import { TasksByPillar } from '@/components/dota/coaching/TasksByPillar'
import { CoachingImpact } from '@/components/dota/coaching/CoachingImpact'
import type { CoachingDashboardData } from '@/lib/dota/coaching/types'

export default function CoachingPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">Caricamento Coaching & Task…</div>
      }
    >
      <CoachingContent />
    </Suspense>
  )
}

function CoachingContent(): React.JSX.Element {
  const { activePlayer, loading: playerLoading } = useActivePlayer()
  const playerId = activePlayer?.dotaAccountId ?? 0

  const [data, setData] = useState<CoachingDashboardData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (playerLoading || !playerId) {
      if (!playerLoading && !playerId) setLoading(false)
      return
    }
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `/api/coaching/dashboard?playerId=${playerId}&autoCreate=true`,
          { cache: 'no-store' },
        )

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }

        const json: CoachingDashboardData = await res.json()
        if (active) setData(json)
      } catch (e: any) {
        console.error('[COACHING] Error loading dashboard:', e)
        if (active) setError(e?.message ?? 'Errore sconosciuto')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [playerId, playerLoading])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
        <SkeletonLoader variant="text" className="mb-2 w-1/3" />
        <SkeletonCard />
        <SkeletonGrid cols={2} />
        <SkeletonCard />
      </div>
    )
  }

  // Show error only if it's a real error, not just empty data
  if (error && !error.includes('table') && !error.includes('not found')) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
          <div className="font-semibold">Errore nel caricamento</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  // If no data but no error (or table not found), show empty state gracefully
  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">
            Coaching & Task
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Gestione e monitoraggio dei task di coaching FZTH
          </p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
          <div className="text-center text-neutral-400">
            <p className="mb-2">Nessun task disponibile al momento.</p>
            <p className="text-sm">
              I task verranno generati automaticamente quando saranno
              disponibili i dati di profiliazione.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">
          Coaching & Task
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Gestione e monitoraggio dei task di coaching FZTH
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* 1. Coaching Header */}
        <CoachingHeader data={data} />

        {/* 2. Tasks By Pillar */}
        <TasksByPillar data={data} />

        {/* 3. Coaching Impact */}
        <CoachingImpact impact={data.impact} />
      </div>
    </div>
  )
}
