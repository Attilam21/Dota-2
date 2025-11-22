'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import type { PeersKPI } from '@/services/dota/kpiService'
import { buildTeammatesProfile } from '@/lib/dota/teammates'
import type { TeammatesProfile } from '@/types/teammates'
import TeammateTopTable from '@/components/dota/teammates/TeammateTopTable'
import TeammateSynergyScatter from '@/components/dota/teammates/TeammateSynergyScatter'
import TeammateInsights from '@/components/dota/teammates/TeammateInsights'

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiCard
              label="Compagni totali"
              value={`${profile.summary.totalTeammates}`}
              description="Numero totale di compagni unici"
            />
            <KpiCard
              label="Compagni con winrate positivo"
              value={`${profile.summary.positiveWinrate}`}
              description="Compagni con winrate ≥ 50%"
            />
            <KpiCard
              label="Compagni con winrate negativo"
              value={`${profile.summary.negativeWinrate}`}
              description="Compagni con winrate < 50%"
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
              description="Compagno con winrate più alto (≥5 partite)"
            />
          </div>

          {/* BLOCCO 2: Tabella Top compagni */}
          <TeammateTopTable teammates={profile.teammates} />

          {/* BLOCCO 3: Grafico Winrate vs Utilizzo */}
          <TeammateSynergyScatter teammates={profile.teammates} />

          {/* BLOCCO 4: Insight testuali */}
          <TeammateInsights teammates={profile.teammates} />
        </section>
      )}
    </div>
  )
}

function KpiCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description?: string
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-xl font-semibold text-white">{value}</div>
      {description && (
        <div className="mt-1 text-xs text-neutral-500">{description}</div>
      )}
    </div>
  )
}
