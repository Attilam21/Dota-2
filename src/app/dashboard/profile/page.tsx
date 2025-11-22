/**
 * Profilazione FZTH Page
 *
 * Enterprise-grade player profile dashboard with identity, pillars, tasks, progress, and focus areas
 */

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import SkeletonLoader, {
  SkeletonGrid,
  SkeletonChart,
} from '@/components/ui/SkeletonLoader'
import { ProfileHeader } from '@/components/dota/profile/ProfileHeader'
import { ProfilePillarsGrid } from '@/components/dota/profile/ProfilePillarsGrid'
import { ProfileTasksSummary } from '@/components/dota/profile/ProfileTasksSummary'
import { ProfileProgressTimeline } from '@/components/dota/profile/ProfileProgressTimeline'
import { ProfileFocusAreas } from '@/components/dota/profile/ProfileFocusAreas'
import { ProfileSummary } from '@/components/dota/profile/ProfileSummary'
import type { PlayerProfileAggregate } from '@/lib/dota/profile/types'
import { AnalysisLabel } from '@/components/dota/AnalysisLabel'

export default function ProfilePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">
          Caricamento Profilazione FZTH…
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  )
}

function ProfileContent(): React.JSX.Element {
  const { activePlayer, loading: playerLoading } = useActivePlayer()
  const playerId = activePlayer?.dotaAccountId ?? 0

  const [profile, setProfile] = useState<PlayerProfileAggregate | null>(null)
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

        const res = await fetch(`/api/profile/aggregate?playerId=${playerId}`, {
          cache: 'no-store',
        })

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }

        const json: PlayerProfileAggregate = await res.json()
        if (active) setProfile(json)
      } catch (e: any) {
        console.error('[PROFILE] Error loading profile:', e)
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
      <div className="space-y-6 p-6">
        <SkeletonLoader variant="text" className="mb-2 w-1/3" />
        <SkeletonGrid cols={4} />
        <SkeletonChart />
        <SkeletonChart />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
          <div className="font-semibold">Errore nel caricamento</div>
          <div className="text-sm">{error || 'Dati non disponibili'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">
          Profilazione FZTH
        </h1>
        <AnalysisLabel type="global" />
        <p className="mt-1 text-sm text-neutral-400">
          Cruscotto di stato e progresso del giocatore basato su dati Tier-1
        </p>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 1. Profile Header */}
        <ProfileHeader data={profile.identity} />

        {/* 2. Pillars Grid */}
        <ProfilePillarsGrid pillars={profile.pillars} />

        {/* 3. Tasks Summary */}
        <ProfileTasksSummary data={profile.tasks} />

        {/* 4. Progress Timeline */}
        {profile.progress.length > 0 && (
          <ProfileProgressTimeline data={profile.progress} />
        )}

        {/* 5. Focus Areas */}
        <ProfileFocusAreas areas={profile.focusAreas} />

        {/* 6. Executive Summary */}
        <ProfileSummary data={profile} />
      </div>
    </div>
  )
}
