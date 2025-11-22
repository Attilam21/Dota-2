'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import MultiLineChart from '@/components/charts/MultiLineChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { PlayerOverviewKPI } from '@/services/dota/kpiService'
import type {
  MatchWithAnalysis,
  PlayerPerformanceProfile,
} from '@/types/playerPerformance'
import { calculatePlayerPerformanceProfile } from '@/lib/dota/performanceProfile'
import PerformanceProfileCards from '@/components/dota/performance/PerformanceProfileCards'
import PerformanceStyleTrend from '@/components/dota/performance/PerformanceStyleTrend'
import PerformancePhaseKPI from '@/components/dota/performance/PerformancePhaseKPI'
import PerformanceInsights from '@/components/dota/performance/PerformanceInsights'

export default function PerformancePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">
          Caricamento performance & stile di gioco…
        </div>
      }
    >
      <PerformanceContent />
    </Suspense>
  )
}

function PerformanceContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [overviewKPI, setOverviewKPI] = useState<PlayerOverviewKPI | null>(null)
  const [performanceProfile, setPerformanceProfile] =
    useState<PlayerPerformanceProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [intervalFilter, setIntervalFilter] = useState<'20' | '10'>('20')

  useEffect(() => {
    let active = true
    async function load() {
      if (!playerId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)

        // 1. Load overview KPI (for existing Performance Aggregata chart)
        const overviewRes = await fetch(
          `/api/kpi/player-overview?playerId=${playerId}&limit=20`,
          { cache: 'no-store' },
        )
        if (overviewRes.ok && active) {
          const overview: PlayerOverviewKPI = await overviewRes.json()
          setOverviewKPI(overview)
        }

        // 2. Load performance profile data (matches + analysis)
        const profileRes = await fetch(
          `/api/performance/profile?playerId=${playerId}&limit=20`,
          { cache: 'no-store' },
        )
        if (profileRes.ok && active) {
          const matchesWithAnalysis: MatchWithAnalysis[] =
            await profileRes.json()

          // HARDENED: Ensure matchesWithAnalysis is always an array (never undefined/null)
          const safeMatches =
            Array.isArray(matchesWithAnalysis) && matchesWithAnalysis.length > 0
              ? matchesWithAnalysis
              : []

          // Calculate performance profile - always returns valid structure
          const profile = calculatePlayerPerformanceProfile(safeMatches)
          setPerformanceProfile(profile)
        }
      } catch (e: any) {
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

  if (!playerId) {
    return (
      <div className="p-6 text-neutral-300">
        Seleziona un giocatore per visualizzare le performance
      </div>
    )
  }

  return (
    <div className="space-y-4 text-white">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Performance & Stile di Gioco</h1>
        <p className="text-sm text-neutral-400">
          Analisi approfondita delle tue prestazioni e del tuo stile di gioco
        </p>
        <p className="text-xs text-neutral-500">Player #{playerId}</p>
      </div>

      {loading && (
        <div className="text-neutral-400">
          Caricamento performance & stile di gioco…
        </div>
      )}
      {error && (
        <div className="text-red-400">Errore nel caricamento: {error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* BLOCCO 1: Profilo di Gioco (4 card) */}
          {performanceProfile && (
            <PerformanceProfileCards indices={performanceProfile.indices} />
          )}

          {/* Grafico Performance Aggregata (esistente, Tier-1) */}
          {overviewKPI &&
            overviewKPI.kdaSeries &&
            overviewKPI.kdaSeries.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-200">
                    Performance Aggregata
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      Intervallo:
                    </span>
                    <button
                      onClick={() => setIntervalFilter('20')}
                      className={`rounded px-2 py-1 text-xs ${
                        intervalFilter === '20'
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      Ultime 20
                    </button>
                    <button
                      onClick={() => setIntervalFilter('10')}
                      className={`rounded px-2 py-1 text-xs ${
                        intervalFilter === '10'
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      Ultime 10
                    </button>
                  </div>
                </div>
                <div className="h-[280px]">
                  <MultiLineChart
                    data={overviewKPI.kdaSeries
                      .slice(0, intervalFilter === '10' ? 10 : 20)
                      .map((kda, idx) => ({
                        x: idx,
                        kda: kda.kda,
                        gpm: overviewKPI.gpmSeries?.[idx]?.gpm || 0,
                        xpm: overviewKPI.xpmSeries?.[idx]?.xpm || 0,
                      }))}
                    lines={[
                      { key: 'kda', color: '#60a5fa', label: 'KDA' },
                      { key: 'gpm', color: '#f59e0b', label: 'GPM' },
                      { key: 'xpm', color: '#22c55e', label: 'XPM' },
                    ]}
                    width={800}
                    height={280}
                  />
                </div>
                <ExplanationCard
                  title="Trend Performance"
                  description="Il grafico mostra l'evoluzione di KDA, GPM e XPM. Una linea stabile indica consistenza, mentre variazioni significative suggeriscono aree di miglioramento."
                  timeRange={`Ultimi ${intervalFilter} match`}
                />
              </div>
            )}

          {/* BLOCCO 2: Trend di Stile (grafico multiplo) */}
          {performanceProfile && (
            <PerformanceStyleTrend trend={performanceProfile.styleTrend} />
          )}

          {/* BLOCCO 3: KPI per Fase (Early/Mid/Late) */}
          {performanceProfile && (
            <PerformancePhaseKPI phaseKPI={performanceProfile.phaseKPI} />
          )}

          {/* BLOCCO 4: Insight testuali */}
          {performanceProfile && (
            <PerformanceInsights insights={performanceProfile.insights} />
          )}

          {/* Messaggio se non ci sono dati */}
          {!performanceProfile && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="text-sm text-neutral-500">
                Dati insufficienti per calcolare il profilo di gioco. Serve
                almeno una partita con analisi completa.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
