'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import Link from 'next/link'
import LineChart from '@/components/charts/LineChart'
import MultiLineChart from '@/components/charts/MultiLineChart'
import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
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

function PerformanceContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [overviewKPI, setOverviewKPI] = useState<PlayerOverviewKPI | null>(null)
  const [styleKPI, setStyleKPI] = useState<StyleOfPlayKPI | null>(null)
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
          {/* A. Performance aggregata */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-4 text-lg font-semibold text-neutral-200">
              Performance Aggregata (ultimi 20 match)
            </h2>
            {overviewKPI && (
              <>
                <MultiLineChart
                  data={overviewKPI.kdaSeries.slice(0, 20).map((kda, idx) => ({
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
                  description="Il grafico mostra l'evoluzione di KDA, GPM e XPM nelle ultime 20 partite. Una linea stabile indica consistenza, mentre variazioni significative suggeriscono aree di miglioramento."
                  timeRange="Ultimi 20 match"
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

              {/* Aggressività */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-neutral-300">
                  Aggressività
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-xs text-neutral-400">Kill/minuto</div>
                    <div className="text-lg font-semibold">
                      {styleKPI.killsPerMinute.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {styleKPI.killsPerMinute > 0.5
                        ? '✓ Molto aggressivo'
                        : styleKPI.killsPerMinute > 0.3
                          ? 'Aggressivo'
                          : 'Poco aggressivo'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-xs text-neutral-400">Morti/minuto</div>
                    <div className="text-lg font-semibold">
                      {styleKPI.deathsPerMinute.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {styleKPI.deathsPerMinute < 0.3
                        ? '✓ Buona sopravvivenza'
                        : 'Alta mortalità'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-xs text-neutral-400">Danni/minuto</div>
                    <div className="text-lg font-semibold">
                      {styleKPI.damagePerMinute > 0
                        ? Math.round(styleKPI.damagePerMinute)
                        : 'N/D'}
                    </div>
                  </div>
                </div>
                <ExplanationCard
                  title="Aggressività"
                  description="L'aggressività misura quanto sei attivo in combattimento. Un valore alto di kill/minuto indica uno stile aggressivo, mentre morti/minuto basse indicano buona sopravvivenza."
                  timeRange="Tutte le partite disponibili"
                />
              </div>

              {/* Presenza ai fight */}
              {styleKPI.fightParticipationSeries.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium text-neutral-300">
                    Presenza ai Fight (KP%)
                  </h3>
                  <LineChart
                    data={styleKPI.fightParticipationSeries
                      .slice(0, 20)
                      .map((d) => ({
                        x: d.matchId,
                        y: d.kp,
                        label: new Date(d.date).toLocaleDateString('it-IT'),
                      }))}
                    color="#f59e0b"
                  />
                  <div className="mt-2 text-xs text-neutral-400">
                    KP% medio: {styleKPI.fightParticipation.toFixed(1)}%
                  </div>
                  <ExplanationCard
                    title="Presenza ai fight"
                    description="Il KP% indica quanto partecipi ai fight del tuo team. Un KP% alto (≥50%) significa che sei presente agli scontri e contribuisci attivamente. Un KP% basso suggerisce che potresti essere troppo passivo o assente durante i fight."
                    timeRange="Ultimi 20 match"
                    interpretation={
                      styleKPI.fightParticipation >= 50
                        ? 'Il tuo KP% è buono, sei presente ai fight.'
                        : 'Il tuo KP% è sotto 40%, probabilmente sei poco presente agli scontri. Cerca di partecipare di più ai fight del team.'
                    }
                  />
                </div>
              )}

              {/* Early game */}
              {styleKPI.earlyDeathsSeries.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium text-neutral-300">
                    Early Game Stability
                  </h3>
                  <BarChart
                    data={styleKPI.earlyDeathsSeries.slice(0, 20).map((d) => ({
                      label: `M${d.matchId.toString().slice(-3)}`,
                      value: d.earlyDeaths,
                      color: d.earlyDeaths >= 2 ? '#ef4444' : '#22c55e',
                    }))}
                  />
                  <div className="mt-2 text-xs text-neutral-400">
                    Media morti early: {styleKPI.earlyDeathsAvg.toFixed(1)}
                  </div>
                  <ExplanationCard
                    title="Early game stability"
                    description="Le morti nei primi 10 minuti indicano la stabilità dell'early game. Troppe morti early possono compromettere la partita. Obiettivo: meno di 1.5 morti early per partita."
                    timeRange="Ultimi 20 match"
                    interpretation={
                      styleKPI.earlyDeathsAvg <= 1.5
                        ? 'Hai una buona stabilità early game, continua così.'
                        : 'Hai troppe morti early, concentrati su posizionamento e mappa awareness nei primi minuti.'
                    }
                  />
                </div>
              )}

              {/* Farming efficiency */}
              {styleKPI.farmingEfficiency.avgGpm > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium text-neutral-300">
                    Farming Efficiency
                  </h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-xs text-neutral-400">GPM medio</div>
                      <div className="text-lg font-semibold">
                        {styleKPI.farmingEfficiency.avgGpm.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400">XPM medio</div>
                      <div className="text-lg font-semibold">
                        {styleKPI.farmingEfficiency.avgXpm.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400">LH/min</div>
                      <div className="text-lg font-semibold">
                        {styleKPI.farmingEfficiency.avgLastHitsPerMin.toFixed(
                          1,
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400">Denies/min</div>
                      <div className="text-lg font-semibold">
                        {styleKPI.farmingEfficiency.avgDeniesPerMin.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <ExplanationCard
                    title="Efficienza farming"
                    description="GPM e XPM indicano quanto guadagni gold e experience. LH/min e Denies/min mostrano la precisione nel farming. Obiettivi: GPM ≥400, XPM ≥500."
                    timeRange="Tutte le partite disponibili"
                    interpretation={
                      styleKPI.farmingEfficiency.avgGpm >= 400
                        ? 'Il tuo farming è ottimo, continua così.'
                        : 'Il tuo farming può essere migliorato. Concentrati su last hit e partecipazione ai fight per più gold.'
                    }
                  />
                </div>
              )}

              {/* Objective focus */}
              {styleKPI.avgTowerDamage > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-medium text-neutral-300">
                    Focus Obiettivi
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-neutral-400">
                        Danni alle torri (media)
                      </div>
                      <div className="text-lg font-semibold">
                        {styleKPI.avgTowerDamage.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400">
                        Roshan uccisi (media)
                      </div>
                      <div className="text-lg font-semibold">
                        {styleKPI.avgRoshanKills.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <ExplanationCard
                    title="Focus obiettivi"
                    description="I danni alle torri e la partecipazione a Roshan indicano quanto ti concentri sugli obiettivi per chiudere le partite. Obiettivo: almeno 2000 danni alle torri per partita."
                    timeRange="Tutte le partite disponibili"
                    interpretation={
                      styleKPI.avgTowerDamage >= 2000
                        ? 'Hai un buon focus sugli obiettivi, continua a pushare le torri.'
                        : 'Concentrati di più sugli obiettivi per chiudere le partite più velocemente.'
                    }
                  />
                </div>
              )}

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
        </>
      )}
    </div>
  )
}
