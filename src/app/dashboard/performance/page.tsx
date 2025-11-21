'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import Link from 'next/link'
import LineChart from '@/components/charts/LineChart'
import MultiLineChart from '@/components/charts/MultiLineChart'
import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import PlaystyleRadar from '@/components/dota/performance/PlaystyleRadar'
import RecoveryScore from '@/components/dota/performance/RecoveryScore'
import FightPositioning from '@/components/dota/performance/FightPositioning'
import type {
  PlayerOverviewKPI,
  StyleOfPlayKPI,
} from '@/services/dota/kpiService'

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

// Utility per normalizzazione valori mancanti (senza file separato)
function formatValueOrNA(value: any): string | JSX.Element {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'number' && (isNaN(value) || !isFinite(value)))
  ) {
    return (
      <span
        className="text-neutral-500"
        title="Dato non disponibile per questo indicatore."
      >
        —
      </span>
    )
  }
  if (typeof value === 'number') {
    return value.toFixed(value < 10 ? 1 : 0)
  }
  return String(value)
}

function PerformanceContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [overviewKPI, setOverviewKPI] = useState<PlayerOverviewKPI | null>(null)
  const [styleKPI, setStyleKPI] = useState<StyleOfPlayKPI | null>(null)
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
        const [overviewRes, styleRes] = await Promise.all([
          fetch(`/api/kpi/player-overview?playerId=${playerId}&limit=20`, {
            cache: 'no-store',
          }),
          fetch(`/api/kpi/style-of-play?playerId=${playerId}&limit=100`, {
            cache: 'no-store',
          }),
        ])

        if (overviewRes.ok) {
          const overview: PlayerOverviewKPI = await overviewRes.json()
          if (active) setOverviewKPI(overview)
        }

        if (styleRes.ok) {
          const style: StyleOfPlayKPI = await styleRes.json()
          if (active) setStyleKPI(style)
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

  // Calcola deviazione standard per consistenza
  const consistencyMetrics = useMemo(() => {
    if (!overviewKPI) return null

    // Protezione array vuoti o undefined
    const kdaSeries = overviewKPI.kdaSeries || []
    const gpmSeries = overviewKPI.gpmSeries || []

    if (kdaSeries.length === 0) return null

    const kdas = kdaSeries.map((s) => s.kda)
    const gpms = gpmSeries.map((s) => s.gpm).filter((g) => g > 0)
    const durations = kdaSeries.map((s, i) => {
      // Approssima durata dalla serie
      return 40 // placeholder, dovrebbe venire dai dati match
    })

    const calcStdDev = (values: number[]) => {
      if (values.length === 0) return 0
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance =
        values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
        values.length
      return Math.sqrt(variance)
    }

    return {
      kdaStdDev: calcStdDev(kdas),
      gpmStdDev: gpms.length > 0 ? calcStdDev(gpms) : 0,
      durationStdDev: calcStdDev(durations),
    }
  }, [overviewKPI])

  // Winrate globale vs recente
  const winrateComparison = useMemo(() => {
    if (!overviewKPI) return null
    return {
      global: overviewKPI.winRate,
      recent: overviewKPI.winRate, // Per ora stesso valore, da migliorare con momentum
    }
  }, [overviewKPI])

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Colonna sinistra - Grafico principale (2/3 su desktop) */}
          <div className="space-y-4 lg:col-span-2">
            {/* 3.1. Grafico principale (Performance Aggregata) */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-200">
                  Performance Aggregata
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Intervallo:</span>
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
              {overviewKPI &&
              overviewKPI.kdaSeries &&
              overviewKPI.kdaSeries.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="text-sm text-neutral-500">
                  Dati non disponibili per il grafico
                </div>
              )}
            </div>
          </div>

          {/* Colonna destra - Consistenza e Radar (1/3 su desktop) */}
          <div className="space-y-4">
            {/* 3.3. Consistenza Prestazionale */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <h2 className="mb-3 text-lg font-semibold text-neutral-200">
                Consistenza
              </h2>
              {consistencyMetrics && winrateComparison && (
                <>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
                      <div
                        className="mb-1 text-xs text-neutral-400"
                        title="Misura la variabilità del KDA tra le partite"
                      >
                        Dev. standard KDA
                      </div>
                      <div className="text-base font-semibold text-neutral-200">
                        {formatValueOrNA(consistencyMetrics.kdaStdDev)}
                      </div>
                      <div className="mt-1 text-[10px] text-neutral-500">
                        {consistencyMetrics.kdaStdDev < 1.0
                          ? '✓ Consistente'
                          : consistencyMetrics.kdaStdDev < 2.0
                            ? '⚠ Variabile'
                            : '✗ Molto variabile'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
                      <div
                        className="mb-1 text-xs text-neutral-400"
                        title="Misura la variabilità del GPM tra le partite"
                      >
                        Dev. standard GPM
                      </div>
                      <div className="text-base font-semibold text-neutral-200">
                        {formatValueOrNA(consistencyMetrics.gpmStdDev)}
                      </div>
                      <div className="mt-1 text-[10px] text-neutral-500">
                        {consistencyMetrics.gpmStdDev < 100
                          ? '✓ Consistente'
                          : '⚠ Variabile'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
                      <div
                        className="mb-1 text-xs text-neutral-400"
                        title="Confronto tra winrate su tutte le partite e ultime 20"
                      >
                        Winrate Globale vs Ultime 20
                      </div>
                      <div className="text-xs text-neutral-300">
                        Globale:{' '}
                        <span className="font-semibold">
                          {formatValueOrNA(winrateComparison.global)}%
                        </span>
                      </div>
                      <div className="text-xs text-neutral-300">
                        Ultime 20:{' '}
                        <span className="font-semibold">
                          {formatValueOrNA(winrateComparison.recent)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="mb-2 text-xs font-medium text-neutral-200">
                      Interpretazione automatica
                    </div>
                    <div className="mb-3 text-[10px] text-neutral-300">
                      {consistencyMetrics.kdaStdDev < 1.0 &&
                      consistencyMetrics.gpmStdDev < 100 ? (
                        <span className="text-green-400">
                          ✓ Prestazioni consistenti: mantieni questo livello di
                          stabilità per migliorare ulteriormente.
                        </span>
                      ) : (
                        <span className="text-yellow-400">
                          ⚠ Variazioni significative: identifica i fattori che
                          causano queste fluttuazioni e lavora sulla
                          consistenza.
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/coaching?playerId=${playerId}`}
                      className="block rounded bg-blue-600/80 px-3 py-1.5 text-center text-[10px] font-medium text-white transition-colors hover:bg-blue-600"
                    >
                      Genera Task per migliorare la consistenza →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* 3.2. Stile di Gioco – Radar Chart */}
            {styleKPI && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-3 text-sm font-semibold text-neutral-200">
                  Stile di Gioco – Radar
                </h3>
                <PlaystyleRadar
                  aggression={Math.min(
                    100,
                    Math.max(0, styleKPI.killsPerMinute * 20),
                  )}
                  kp={Math.min(100, Math.max(0, styleKPI.fightParticipation))}
                  farm={Math.min(
                    100,
                    Math.max(
                      0,
                      ((styleKPI.farmingEfficiency.avgGpm || 0) / 600) * 100,
                    ),
                  )}
                  macro={Math.min(
                    100,
                    Math.max(0, ((styleKPI.avgTowerDamage || 0) / 3000) * 100),
                  )}
                />
                <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="mb-2 text-xs font-medium text-neutral-200">
                    Interpretazione Radar
                  </div>
                  <div className="mb-3 text-[10px] text-neutral-300">
                    Il radar mostra il tuo profilo di gioco su 4 assi:
                    Aggressività (capacità di generare kill e pressione), Farm
                    (efficienza nella raccolta risorse), Macro (gestione degli
                    obiettivi), KP% (partecipazione ai combattimenti).
                  </div>
                  <Link
                    href={`/dashboard/coaching?playerId=${playerId}`}
                    className="block rounded bg-blue-600/80 px-3 py-1.5 text-center text-[10px] font-medium text-white transition-colors hover:bg-blue-600"
                  >
                    Genera Task per ottimizzare lo stile →
                  </Link>
                </div>
              </div>
            )}

            {/* Indice di Aggressività */}
            {styleKPI && overviewKPI && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-3 text-sm font-semibold text-neutral-200">
                  Indice di Aggressività
                </h3>
                <div className="mb-3">
                  <div className="mb-1 text-xs text-neutral-400">
                    Score: {Math.round(styleKPI.killsPerMinute * 20)} / 100
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-900">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          100,
                          styleKPI.killsPerMinute * 20,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="mb-3 text-[10px] text-neutral-300">
                  {styleKPI.killsPerMinute > 0.3
                    ? 'Stile di gioco aggressivo: generi molte kill e pressione costante.'
                    : styleKPI.killsPerMinute > 0.15
                      ? 'Stile equilibrato: mix tra aggressività e farm.'
                      : 'Stile passivo: concentrato su farm e posizionamento sicuro.'}
                </div>
                <Link
                  href={`/dashboard/coaching?playerId=${playerId}`}
                  className="block rounded bg-blue-600/80 px-3 py-1.5 text-center text-[10px] font-medium text-white transition-colors hover:bg-blue-600"
                >
                  Genera Task per aggressività →
                </Link>
              </div>
            )}

            {/* Recovery Index */}
            {overviewKPI && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <RecoveryScore
                  score={(() => {
                    // Calcolo recovery score (approssimato)
                    const recoveryGpm =
                      Math.max(0, (overviewKPI.avgGpm || 0) - 300) / 2
                    const recoveryXpm =
                      Math.max(0, (overviewKPI.avgXpm || 0) - 400) / 2
                    const comebackKills = 50 // placeholder
                    return Math.round(
                      (recoveryGpm + recoveryXpm + comebackKills) / 3,
                    )
                  })()}
                  recoveryGpm={overviewKPI.avgGpm}
                  recoveryXpm={overviewKPI.avgXpm}
                />
                <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="mb-2 text-xs font-medium text-neutral-200">
                    Interpretazione Recovery
                  </div>
                  <div className="mb-3 text-[10px] text-neutral-300">
                    Il Recovery Index misura la tua capacità di scalare mid/late
                    game. Un indice alto indica buona capacità di recupero anche
                    dopo un early game difficile.
                  </div>
                  <Link
                    href={`/dashboard/coaching?playerId=${playerId}`}
                    className="block rounded bg-blue-600/80 px-3 py-1.5 text-center text-[10px] font-medium text-white transition-colors hover:bg-blue-600"
                  >
                    Genera Task per recovery →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* [REMOVED - TIER 2/3] Sezione KPI per fase di gioco
          Rimossa perché contiene KPI non garantiti:
          - Partecipazione torri (richiede parsed avanzato)
          - Partecipazione Roshan (richiede parsed avanzato)
          - Impact index (calcolo non basato su dati Tier 1)
          - CS/Gold al minuto 10 (richiede timeline dettagliata non sempre disponibile)
      */}
    </div>
  )
}
