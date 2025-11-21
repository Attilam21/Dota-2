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
    <div className="space-y-6 p-6 text-white">
      <div>
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
        <>
          {/* 3.1. Grafico principale (Performance Aggregata) */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6">
            <div className="mb-4 flex items-center justify-between">
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
                />
                <ExplanationCard
                  title="Trend Performance"
                  description="Il grafico mostra l'evoluzione di KDA, GPM e XPM. Una linea stabile indica consistenza, mentre variazioni significative suggeriscono aree di miglioramento."
                  timeRange={`Ultimi ${intervalFilter} match`}
                />
              </>
            )}
          </div>

          {/* B. Consistenza */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-4 text-lg font-semibold text-neutral-200">
              Consistenza
            </h2>
            {consistencyMetrics && winrateComparison && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-xs text-neutral-400">
                      Deviazione standard KDA
                    </div>
                    <div className="text-lg font-semibold">
                      {consistencyMetrics.kdaStdDev.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {consistencyMetrics.kdaStdDev < 1.0
                        ? '✓ Consistente'
                        : consistencyMetrics.kdaStdDev < 2.0
                          ? '⚠ Variabile'
                          : '✗ Molto variabile'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-xs text-neutral-400">
                      Deviazione standard GPM
                    </div>
                    <div className="text-lg font-semibold">
                      {consistencyMetrics.gpmStdDev.toFixed(0)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {consistencyMetrics.gpmStdDev < 100
                        ? '✓ Consistente'
                        : '⚠ Variabile'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-xs text-neutral-400">
                      Winrate globale vs recente
                    </div>
                    <div className="text-sm">
                      Globale:{' '}
                      <span className="font-semibold">
                        {winrateComparison.global.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm">
                      Recente:{' '}
                      <span className="font-semibold">
                        {winrateComparison.recent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
                  <div className="text-sm font-medium text-neutral-200">
                    Interpretazione Consistenza
                  </div>
                  <div className="mt-2 text-xs text-neutral-300">
                    {consistencyMetrics.kdaStdDev < 1.0 &&
                    consistencyMetrics.gpmStdDev < 100 ? (
                      <span className="text-green-400">
                        ✓ Le tue prestazioni sono consistenti. Mantieni questo
                        livello di stabilità per migliorare ulteriormente.
                      </span>
                    ) : (
                      <span className="text-yellow-400">
                        ⚠ Le tue prestazioni mostrano variazioni significative.
                        Cerca di identificare i fattori che causano queste
                        fluttuazioni e lavora sulla consistenza.
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/dashboard/coaching"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    Genera Task legati a questa sezione →
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* C. Stile di gioco */}
          {styleKPI && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-4 text-lg font-semibold text-neutral-200">
                Stile di Gioco
              </h2>

              {/* 3.2. Stile di Gioco – Radar Chart */}
              {styleKPI && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium text-neutral-300">
                    Stile di Gioco – Radar Chart
                  </h3>
                  <PlaystyleRadar
                    aggression={styleKPI.killsPerMinute * 20}
                    kp={styleKPI.fightParticipation}
                    farm={(styleKPI.farmingEfficiency.avgGpm / 600) * 100}
                    macro={(styleKPI.avgTowerDamage / 3000) * 100}
                  />
                </div>
              )}

              {/* 3.4. KPI per fase di gioco (Early/Mid/Late) - Riordinato */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-neutral-300">
                  KPI per Fase di Gioco
                </h3>
                <div className="space-y-4">
                  {/* Early Game */}
                  {styleKPI.earlyDeathsSeries.length > 0 && (
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                      <h4 className="mb-2 text-xs font-semibold text-neutral-300">
                        Early Game (0-10 minuti)
                      </h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <div
                            className="text-xs text-neutral-400"
                            title="Last hits al minuto 10"
                          >
                            CS al minuto 10
                          </div>
                          <div className="text-lg font-semibold text-neutral-200">
                            {formatValueOrNA(
                              styleKPI.farmingEfficiency.avgLastHitsPerMin * 10,
                            )}
                          </div>
                        </div>
                        <div>
                          <div
                            className="text-xs text-neutral-400"
                            title="Gold al minuto 10"
                          >
                            Gold al minuto 10
                          </div>
                          <div className="text-lg font-semibold text-neutral-200">
                            {formatValueOrNA(
                              styleKPI.farmingEfficiency.avgGpm * 10,
                            )}
                          </div>
                        </div>
                        <div>
                          <div
                            className="text-xs text-neutral-400"
                            title="Morti nei primi 10 minuti"
                          >
                            Morti early (media)
                          </div>
                          <div className="text-lg font-semibold text-neutral-200">
                            {formatValueOrNA(styleKPI.earlyDeathsAvg)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mid Game */}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                    <h4 className="mb-2 text-xs font-semibold text-neutral-300">
                      Mid Game (10-30 minuti)
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <div
                          className="text-xs text-neutral-400"
                          title="Partecipazione alla distruzione delle torri"
                        >
                          Partecipazione torri
                        </div>
                        <div className="text-lg font-semibold text-neutral-200">
                          {formatValueOrNA(styleKPI.avgTowerDamage)}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-xs text-neutral-400"
                          title="Partecipazione a Roshan"
                        >
                          Partecipazione Roshan
                        </div>
                        <div className="text-lg font-semibold text-neutral-200">
                          {formatValueOrNA(styleKPI.avgRoshanKills)}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-xs text-neutral-400"
                          title="Kill Participation percentuale"
                        >
                          Kill Participation (KP%)
                        </div>
                        <div className="text-lg font-semibold text-neutral-200">
                          {formatValueOrNA(styleKPI.fightParticipation)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Late Game */}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                    <h4 className="mb-2 text-xs font-semibold text-neutral-300">
                      Late Game (30+ minuti)
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <div
                          className="text-xs text-neutral-400"
                          title="Sopravvivenza nelle fasi finali"
                        >
                          Sopravvivenza
                        </div>
                        <div className="text-lg font-semibold text-neutral-200">
                          {formatValueOrNA(
                            styleKPI.deathsPerMinute < 0.3 ? 70 : 50,
                          )}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-xs text-neutral-400"
                          title="Danno erogato"
                        >
                          Danno output
                        </div>
                        <div className="text-lg font-semibold text-neutral-200">
                          {formatValueOrNA(styleKPI.damagePerMinute)}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-xs text-neutral-400"
                          title="Impatto complessivo"
                        >
                          Impact index
                        </div>
                        <div className="text-lg font-semibold text-neutral-200">
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

              {/* Badge playstyle */}
              {styleKPI.playstyleBadges.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium text-neutral-300">
                    Stile di Gioco Identificato
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {styleKPI.playstyleBadges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-blue-900/40 px-3 py-1 text-xs text-blue-300"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collegamento Coaching */}
              <div className="mt-6 rounded-lg border border-blue-800 bg-blue-900/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-300">
                      Genera Task legati a questa sezione
                    </div>
                    <div className="text-xs text-neutral-400">
                      Crea task personalizzati per migliorare le aree
                      identificate
                    </div>
                  </div>
                  <Link
                    href="/dashboard/coaching"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Genera Task →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 🔷 PERFORMANCE 2.0 - NUOVI BLOCCHI ADDITIVI */}

          {/* A) Radar Chart Stile di gioco */}
          {styleKPI && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-200">
                Radar Stile di Gioco
              </h2>
              <PlaystyleRadar
                aggression={styleKPI.killsPerMinute * 100} // normalizza
                kp={styleKPI.fightParticipation}
                farm={(overviewKPI?.avgGpm || 0) / 10} // normalizza GPM
                macro={(styleKPI.avgTowerDamage || 0) / 100} // normalizza
              />
            </div>
          )}

          {/* B) Recovery Index */}
          {overviewKPI && (
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
          )}

          {/* C) Fight Positioning */}
          {styleKPI && (
            <FightPositioning
              averageDistanceAllies={500} // placeholder - da calcolare da match detail
              averageDistanceEnemies={800} // placeholder
              deathsInFight={styleKPI.deathsPerMinute * 40} // approssimato
              fightDuration={40} // placeholder
            />
          )}
        </>
      )}
    </div>
  )
}
