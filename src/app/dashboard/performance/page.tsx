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

    const kdas = overviewKPI.kdaSeries.map((s) => s.kda)
    const gpms = overviewKPI.gpmSeries.map((s) => s.gpm).filter((g) => g > 0)
    const durations = overviewKPI.kdaSeries.map((s, i) => {
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
              {overviewKPI && (
                <>
                  <div className="h-[280px]">
                    <MultiLineChart
                      data={overviewKPI.kdaSeries
                        .slice(0, intervalFilter === '10' ? 10 : 20)
                        .map((kda, idx) => ({
                          x: idx,
                          kda: kda.kda,
                          gpm: overviewKPI.gpmSeries[idx]?.gpm || 0,
                          xpm: overviewKPI.xpmSeries[idx]?.xpm || 0,
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
                    <div className="text-xs font-medium text-neutral-200">
                      Interpretazione automatica
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-300">
                      {consistencyMetrics.kdaStdDev < 1.0 &&
                      consistencyMetrics.gpmStdDev < 100 ? (
                        <span className="text-green-400">
                          ✓ Prestazioni consistenti.
                        </span>
                      ) : (
                        <span className="text-yellow-400">
                          ⚠ Variazioni significative.
                        </span>
                      )}
                    </div>
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
                  aggression={styleKPI.killsPerMinute * 20}
                  kp={styleKPI.fightParticipation}
                  farm={(styleKPI.farmingEfficiency.avgGpm / 600) * 100}
                  macro={(styleKPI.avgTowerDamage / 3000) * 100}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sezione KPI per fase di gioco - Full width sotto */}
      {!loading && !error && styleKPI && (
        <div className="mt-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
            <h2 className="mb-3 text-lg font-semibold text-neutral-200">
              KPI per Fase di Gioco
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Early Game */}
              {styleKPI.earlyDeathsSeries.length > 0 && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
                  <h4 className="mb-2 text-xs font-semibold text-neutral-300">
                    Early Game (0-10 min)
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <div
                        className="text-[10px] text-neutral-400"
                        title="Last hits al minuto 10"
                      >
                        CS al minuto 10
                      </div>
                      <div className="text-sm font-semibold text-neutral-200">
                        {formatValueOrNA(
                          styleKPI.farmingEfficiency.avgLastHitsPerMin * 10,
                        )}
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-[10px] text-neutral-400"
                        title="Gold al minuto 10"
                      >
                        Gold al minuto 10
                      </div>
                      <div className="text-sm font-semibold text-neutral-200">
                        {formatValueOrNA(
                          styleKPI.farmingEfficiency.avgGpm * 10,
                        )}
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-[10px] text-neutral-400"
                        title="Morti nei primi 10 minuti"
                      >
                        Morti early (media)
                      </div>
                      <div className="text-sm font-semibold text-neutral-200">
                        {formatValueOrNA(styleKPI.earlyDeathsAvg)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mid Game */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
                <h4 className="mb-2 text-xs font-semibold text-neutral-300">
                  Mid Game (10-30 min)
                </h4>
                <div className="space-y-2">
                  <div>
                    <div
                      className="text-[10px] text-neutral-400"
                      title="Partecipazione alla distruzione delle torri"
                    >
                      Partecipazione torri
                    </div>
                    <div className="text-sm font-semibold text-neutral-200">
                      {formatValueOrNA(styleKPI.avgTowerDamage)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[10px] text-neutral-400"
                      title="Partecipazione a Roshan"
                    >
                      Partecipazione Roshan
                    </div>
                    <div className="text-sm font-semibold text-neutral-200">
                      {formatValueOrNA(styleKPI.avgRoshanKills)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[10px] text-neutral-400"
                      title="Kill Participation percentuale"
                    >
                      Kill Participation (KP%)
                    </div>
                    <div className="text-sm font-semibold text-neutral-200">
                      {formatValueOrNA(styleKPI.fightParticipation)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Late Game */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
                <h4 className="mb-2 text-xs font-semibold text-neutral-300">
                  Late Game (30+ min)
                </h4>
                <div className="space-y-2">
                  <div>
                    <div
                      className="text-[10px] text-neutral-400"
                      title="Sopravvivenza nelle fasi finali"
                    >
                      Sopravvivenza
                    </div>
                    <div className="text-sm font-semibold text-neutral-200">
                      {formatValueOrNA(
                        styleKPI.deathsPerMinute < 0.3 ? 70 : 50,
                      )}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[10px] text-neutral-400"
                      title="Danno erogato"
                    >
                      Danno output
                    </div>
                    <div className="text-sm font-semibold text-neutral-200">
                      {formatValueOrNA(styleKPI.damagePerMinute)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[10px] text-neutral-400"
                      title="Impatto complessivo"
                    >
                      Impact index
                    </div>
                    <div className="text-sm font-semibold text-neutral-200">
                      {formatValueOrNA(
                        (
                          (styleKPI.fightParticipation +
                            styleKPI.damagePerMinute / 10) /
                          2
                        ).toFixed(0),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
