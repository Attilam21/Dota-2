'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import type { PeersKPI } from '@/services/dota/kpiService'
import { buildTeammatesProfile } from '@/lib/dota/teammates'
import type { TeammatesProfile } from '@/types/teammates'
import CompanionsBars from '@/components/dota/teammates/CompanionsBars'
import CompanionsTable from '@/components/dota/teammates/CompanionsTable'
import CompanionsInsights from '@/components/dota/teammates/CompanionsInsights'

export default function TeamsPeersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">
          Caricamento statistiche compagni…
        </div>
      }
    >
      <TeamsPeersContent />
    </Suspense>
  )
}

function TeamsPeersContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [peersKPI, setPeersKPI] = useState<PeersKPI | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!playerId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await fetch(`/api/kpi/peers?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }
        const kpi: PeersKPI = await res.json()
        if (active) setPeersKPI(kpi)
      } catch (e: any) {
        console.error('Peers load error:', e)
        if (active) setError(e?.message ?? 'Errore sconosciuto')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [playerId])

  // Build teammates profile from PeersKPI
  const profile: TeammatesProfile | null = useMemo(() => {
    if (!peersKPI) return null
    return buildTeammatesProfile(peersKPI)
  }, [peersKPI])

  // Handler for future teammate click (for player details)
  function handleTeammateClick(teammate: any) {
    // TODO: Future - Navigate to teammate details page
    // For now, just log
    console.log('Teammate clicked:', teammate.accountId)
  }

  return (
    <div className="space-y-4 text-white">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Team & compagni</h1>
        <p className="text-sm text-neutral-400">
          Statistiche sui compagni abituali, winrate insieme e sinergie.
        </p>
        {playerId && (
          <p className="text-xs text-neutral-500">Player #{playerId}</p>
        )}
      </div>

      {loading && (
        <div className="text-neutral-400">
          Caricamento statistiche compagni…
        </div>
      )}
      {error && (
        <div className="text-red-400">Errore nel caricamento: {error}</div>
      )}

      {!loading && !error && (!profile || profile.teammates.length === 0) && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 text-neutral-300 backdrop-blur-sm">
          Nessun dato disponibile sui compagni. I dati vengono recuperati da
          OpenDota quando giochi in party con altri giocatori.
        </div>
      )}

      {!loading && !error && profile && profile.teammates.length > 0 && (
        <section className="mx-auto max-w-6xl space-y-6">
          {/* BLOCCO 1: KPI Overview */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard
              label="Compagni totali"
              value={`${profile.summary.totalTeammates}`}
            />
            <KpiCard
              label="Compagni con WR positivo (≥50%)"
              value={`${profile.summary.positiveWinrate}`}
            />
            <KpiCard
              label="Miglior compagno"
              value={
                profile.summary.bestTeammate
                  ? `${
                      profile.summary.bestTeammate.displayName ??
                      profile.summary.bestTeammate.accountId
                    } • ${profile.summary.bestTeammate.winrate}%`
                  : '—'
              }
            />
          </div>

          {/* BLOCCO 2: Grafico a barre orizzontali Top 15 */}
          <CompanionsBars teammates={profile.teammates} />

          {/* BLOCCO 3: Tabella compatta Top 15 */}
          <CompanionsTable
            teammates={profile.teammates}
            onTeammateClick={handleTeammateClick}
          />

          {/* BLOCCO 4: Insight testuali */}
          <CompanionsInsights teammates={profile.teammates} />
        </section>
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  )
}
