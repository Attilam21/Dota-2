'use client'

import Link from 'next/link'
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import { getHeroIconUrl, getHeroName } from '@/lib/dotaHeroes'
import {
  buildHeroSnapshot,
  buildMomentum,
  type HeroSnapshot as HeroSnap,
} from '@/lib/analytics/overview'
// [REMOVED - TIER 2] calculatePlayerTelemetry, TelemetryMatchRow
// Rimossi perché utilizzati solo per componenti Tier-2 rimossi
import MultiLineChart from '@/components/charts/MultiLineChart'
import type { PlayerOverviewKPI } from '@/services/dota/kpiService'
import SyncPlayerPanel from '@/components/SyncPlayerPanel'

type MatchRow = {
  id: string
  player_account_id: number
  match_id: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  duration_seconds: number
  start_time: string // ISO timestamptz
  result: 'win' | 'lose'
}

export default function DashboardPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">Caricamento dati panoramica…</div>
      }
    >
      <DashboardOverview />
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

function DashboardOverview(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [rows, setRows] = useState<MatchRow[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [overviewKPI, setOverviewKPI] = useState<PlayerOverviewKPI | null>(null)
  const [kpiLoading, setKpiLoading] = useState<boolean>(false)
  const [styleKPI, setStyleKPI] = useState<{
    fightParticipation: number
    earlyDeathsAvg: number
  } | null>(null)

  // Unica chiamata API per caricare le partite recenti
  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        if (!playerId) {
          setRows(null)
          return
        }
        const listRes = await fetch(
          `/api/matches/list?playerId=${playerId}&limit=20`,
          {
            cache: 'no-store',
          },
        )
        if (!listRes.ok) {
          const msg = await listRes.json().catch(() => ({}))
          throw new Error(msg?.error || `List HTTP ${listRes.status}`)
        }
        const json: MatchRow[] = await listRes.json()
        if (!active) return
        setRows(json || [])
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

  // Carica KPI avanzati per trend e insights
  useEffect(() => {
    let active = true
    async function loadKPI() {
      if (!playerId) return
      try {
        setKpiLoading(true)
        const [overviewRes, styleRes] = await Promise.all([
          fetch(`/api/kpi/player-overview?playerId=${playerId}&limit=20`, {
            cache: 'no-store',
          }),
          fetch(`/api/kpi/style-of-play?playerId=${playerId}&limit=20`, {
            cache: 'no-store',
          }),
        ])

        if (overviewRes.ok) {
          const kpi: PlayerOverviewKPI = await overviewRes.json()
          if (active) setOverviewKPI(kpi)
        }

        if (styleRes.ok) {
          const style = await styleRes.json()
          if (active) {
            setStyleKPI({
              fightParticipation: style.fightParticipation || 0,
              earlyDeathsAvg: style.earlyDeathsAvg || 0,
            })
          }
        }
      } catch (e) {
        console.error('Error loading KPI:', e)
      } finally {
        if (active) setKpiLoading(false)
      }
    }
    loadKPI()
    return () => {
      active = false
    }
  }, [playerId])

  const refreshData = () => {
    window.location.reload()
  }

  // Calcola KPI ultime 20 partite
  const last20Stats = useMemo(() => {
    if (!rows || rows.length === 0) return null
    const last20 = rows.slice(0, 20)
    const wins = last20.filter((r) => r.result === 'win').length
    const winRate = last20.length > 0 ? (wins / last20.length) * 100 : 0

    const sumKills = last20.reduce((a, r) => a + (r.kills ?? 0), 0)
    const sumDeaths = last20.reduce((a, r) => a + (r.deaths ?? 0), 0)
    const sumAssists = last20.reduce((a, r) => a + (r.assists ?? 0), 0)
    const avgKills = last20.length > 0 ? sumKills / last20.length : 0
    const avgDeaths = last20.length > 0 ? sumDeaths / last20.length : 0
    const avgAssists = last20.length > 0 ? sumAssists / last20.length : 0
    const kdaAvg = (avgKills + avgAssists) / Math.max(1, avgDeaths)

    return {
      winRate: Number(winRate.toFixed(1)),
      kdaAvg: Number(kdaAvg.toFixed(2)),
      avgGpm: overviewKPI?.avgGpm ?? null,
      avgXpm: overviewKPI?.avgXpm ?? null,
    }
  }, [rows, overviewKPI])

  // Calcola KPI globali per Blocco A
  const globalStats = useMemo(() => {
    if (!rows || rows.length === 0 || !overviewKPI) return null

    const total = rows.length
    const wins = rows.reduce((acc, r) => acc + (r.result === 'win' ? 1 : 0), 0)
    const winRate = total > 0 ? (wins / total) * 100 : 0

    const sumKills = rows.reduce((a, r) => a + (r.kills ?? 0), 0)
    const sumDeaths = rows.reduce((a, r) => a + (r.deaths ?? 0), 0)
    const sumAssists = rows.reduce((a, r) => a + (r.assists ?? 0), 0)
    const avgKills = total > 0 ? sumKills / total : 0
    const avgDeaths = total > 0 ? sumDeaths / total : 0
    const avgAssists = total > 0 ? sumAssists / total : 0
    const kdaAvg = (avgKills + avgAssists) / Math.max(1, avgDeaths)

    return {
      winRate: Number(winRate.toFixed(1)),
      kdaAvg: Number(kdaAvg.toFixed(2)),
      avgGpm: overviewKPI.avgGpm ?? null,
      avgXpm: overviewKPI.avgXpm ?? null,
    }
  }, [rows, overviewKPI])

  // [REMOVED - TIER 2] playerTelemetry
  // Rimossa perché utilizzata solo per componenti Tier-2 (Statistiche Aggiuntive, Punti di Forza/Debolezze)
  // che sono stati rimossi. I dati base (partite totali, hero pool) sono già disponibili direttamente da rows.

  // Calcola stato forma (ultimi 10 match)
  const formStatus = useMemo(() => {
    if (!rows || rows.length < 10) return null
    const last10 = rows.slice(0, 10)
    const prev10 = rows.slice(10, 20)

    if (prev10.length === 0) return null

    const last10Wins = last10.filter((r) => r.result === 'win').length
    const prev10Wins = prev10.filter((r) => r.result === 'win').length
    const last10Wr = (last10Wins / last10.length) * 100
    const prev10Wr = (prev10Wins / prev10.length) * 100

    return {
      trend:
        last10Wr > prev10Wr ? 'up' : last10Wr < prev10Wr ? 'down' : 'stable',
      last10Wr: Number(last10Wr.toFixed(1)),
      prev10Wr: Number(prev10Wr.toFixed(1)),
    }
  }, [rows])

  // Hero Pool Snapshot - Top 3
  const heroSnap: HeroSnap[] = useMemo(
    () => buildHeroSnapshot(rows ?? [], 3),
    [rows],
  )

  // Calcola telemetria per TelemetryPills
  const telemetry = useMemo(() => {
    if (!rows || rows.length === 0) return null

    // Lane predominante (approssimato da hero pool)
    const lane = 'Mid' // placeholder, da calcolare da hero pool se disponibile

    // Fase di forza (basato su durata media e performance)
    const avgDuration =
      rows.slice(0, 20).reduce((acc, r) => acc + (r.duration_seconds ?? 0), 0) /
      Math.max(1, rows.slice(0, 20).length)
    const powerPhase: 'early' | 'mid' | 'late' =
      avgDuration < 30 * 60 ? 'early' : avgDuration < 45 * 60 ? 'mid' : 'late'

    // Stile di gioco (basato su kills/min e assist)
    const avgKills =
      rows.slice(0, 20).reduce((acc, r) => acc + (r.kills ?? 0), 0) /
      Math.max(1, rows.slice(0, 20).length)
    const avgAssists =
      rows.slice(0, 20).reduce((acc, r) => acc + (r.assists ?? 0), 0) /
      Math.max(1, rows.slice(0, 20).length)
    const playstyle: 'aggressive' | 'balanced' | 'passive' =
      avgKills > 5 && avgAssists > 8
        ? 'aggressive'
        : avgKills < 3 && avgAssists < 5
          ? 'passive'
          : 'balanced'

    // Hero Pool Summary
    const allHeroes = buildHeroSnapshot(rows ?? [], 100)
    const comfort = allHeroes.filter(
      (h) => h.matches >= 5 && h.winRate >= 55,
    ).length
    const good = allHeroes.filter(
      (h) => h.matches >= 3 && h.winRate >= 50 && h.winRate < 55,
    ).length
    const situational = allHeroes.filter(
      (h) => h.matches < 3 || h.winRate < 50,
    ).length

    return {
      lane,
      powerPhase,
      playstyle,
      heroPoolSummary: { comfort, good, situational },
    }
  }, [rows])

  // Calcola sparkline data (ultimi 10 match)
  const sparklineData = useMemo(() => {
    if (!rows || rows.length < 3) return null

    const last10 = rows.slice(0, 10).reverse()
    const winrateData = last10.map((r, idx) => {
      const matchesUpToIdx = last10.slice(0, idx + 1)
      const wins = matchesUpToIdx.filter((m) => m.result === 'win').length
      return (wins / matchesUpToIdx.length) * 100
    })

    const killsPerMinData = last10.map((r) => {
      const durationMin = (r.duration_seconds ?? 0) / 60
      return durationMin > 0 ? (r.kills ?? 0) / durationMin : 0
    })

    const farmIndexData = last10.map((r, idx) => {
      // Approssima farm index da GPM se disponibile
      const gpm = overviewKPI?.gpmSeries[idx]?.gpm || 400
      const xpm = overviewKPI?.xpmSeries[idx]?.xpm || 500
      return (gpm + xpm) / 20 // normalizza
    })

    return {
      winrate: winrateData,
      aggression: killsPerMinData,
      farmIndex: farmIndexData,
    }
  }, [rows, overviewKPI])

  // Calcola Wow Insights
  const wowInsights = useMemo(() => {
    if (!rows || rows.length === 0) return null

    const last20 = rows.slice(0, 20)
    const fastMatches = last20.filter(
      (r) => (r.duration_seconds ?? 0) < 35 * 60,
    )
    const fastWins = fastMatches.filter((r) => r.result === 'win').length
    const fastWinrate =
      fastMatches.length > 0 ? (fastWins / fastMatches.length) * 100 : 0

    // Early death punish (approssimato)
    const earlyDeathMatches = last20.filter((r) => (r.deaths ?? 0) >= 2)
    const earlyDeathLosses = earlyDeathMatches.filter(
      (r) => r.result === 'lose',
    ).length
    const earlyDeathPunish =
      earlyDeathMatches.length > 0
        ? (earlyDeathLosses / earlyDeathMatches.length) * 100
        : 0

    // Level 6 timing (approssimato - placeholder)
    const level6Improvement = 5 // placeholder

    // Build mismatch (placeholder)
    const buildMismatch = 15 // placeholder

    return {
      fastWinrate: `Hai un winrate del ${fastWinrate.toFixed(
        1,
      )}% nelle partite sotto i 35 minuti.`,
      earlyDeathPunish: `Perdi il ${earlyDeathPunish.toFixed(
        1,
      )}% delle partite in cui muori 2 volte entro il 10° minuto.`,
      level6Impact: `Hai +${level6Improvement}% WR quando raggiungi il livello 6 entro il minuto 10.`,
      buildMismatch: `La tua build media differisce dal meta del ${buildMismatch}%.`,
    }
  }, [rows])

  // Calcola Game Phases Matrix
  const gamePhases = useMemo(() => {
    if (!rows || rows.length === 0 || !overviewKPI) return null

    const last20 = rows.slice(0, 20)
    const avgDeaths =
      last20.reduce((acc, r) => acc + (r.deaths ?? 0), 0) / last20.length

    return {
      early: {
        cs10: 50, // placeholder - da calcolare da match detail se disponibile
        gold10: 2500, // placeholder
        death10: avgDeaths * 0.3, // approssimato
      },
      mid: {
        tower: overviewKPI.avgTowerDamage || 0,
        roshan: 0.5, // placeholder
        fight: styleKPI?.fightParticipation || 0,
      },
      late: {
        survival: 70, // placeholder
        damage: overviewKPI.avgHeroDamage || 0,
        impact: 60, // placeholder
      },
    }
  }, [rows, overviewKPI, styleKPI])

  // Calcola Consistency
  const consistency = useMemo(() => {
    if (!rows || rows.length === 0 || !overviewKPI) return null

    const last20 = rows.slice(0, 20)
    const kdas = last20.map((r) => {
      const kda = (r.kills + r.assists) / Math.max(1, r.deaths)
      return kda
    })
    const durations = last20.map((r) => (r.duration_seconds ?? 0) / 60)

    const calcStdDev = (values: number[]) => {
      if (values.length === 0) return 0
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance =
        values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
        values.length
      return Math.sqrt(variance)
    }

    const devKDA = calcStdDev(kdas)
    const devDuration = calcStdDev(durations)

    const wins = last20.filter((r) => r.result === 'win').length
    const winrateRecent = (wins / last20.length) * 100
    const winrateGlobal = overviewKPI.winRate

    return {
      devStandardKDA: devKDA,
      devStandardDuration: devDuration,
      winrateRecent,
      winrateGlobal,
    }
  }, [rows, overviewKPI])

  // Trend prestazioni per grafico (ultime 10-20 partite)
  // Fix: gestisce NaN e valori mancanti per evitare crollo verticale
  const trendData = useMemo(() => {
    if (!rows || rows.length === 0 || !overviewKPI) return []
    const last20 = rows.slice(0, 20).reverse() // cronologico crescente

    let lastValidKda = 0
    let lastValidGpm = 0

    return last20
      .map((r, idx) => {
        const matchesUpToIdx = last20.slice(0, idx + 1)
        const wins = matchesUpToIdx.filter((m) => m.result === 'win').length
        const winrate =
          matchesUpToIdx.length > 0 ? (wins / matchesUpToIdx.length) * 100 : 0

        // Calcola KDA con gestione NaN
        const kda =
          matchesUpToIdx.length > 0
            ? matchesUpToIdx.reduce((acc, m) => {
                const kda = (m.kills + m.assists) / Math.max(1, m.deaths)
                return acc + (isNaN(kda) ? 0 : kda)
              }, 0) / matchesUpToIdx.length
            : 0

        // Usa ultimo valore valido se NaN o 0
        const validKda = isNaN(kda) || kda === 0 ? lastValidKda : kda
        if (validKda > 0) lastValidKda = validKda

        // GPM da serie (gestisce valori mancanti)
        const gpm = overviewKPI.gpmSeries?.[idx]?.gpm || lastValidGpm || 0
        if (gpm > 0) lastValidGpm = gpm

        return {
          x: idx,
          winrate: Number(winrate.toFixed(1)),
          kda: Number(validKda.toFixed(2)),
          gpm: Number(gpm.toFixed(0)),
        }
      })
      .filter((d) => !isNaN(d.kda) && !isNaN(d.gpm) && !isNaN(d.winrate))
  }, [rows, overviewKPI])

  // Insights sintetici (logiche statiche basate su dati reali)
  const insights = useMemo(() => {
    if (!rows || rows.length === 0 || !overviewKPI) return null

    const last20 = rows.slice(0, 20)
    const avgGpm = overviewKPI.avgGpm || 0
    const avgGpmAll =
      last20.length > 0
        ? last20.reduce((acc, r) => {
            // Approssima GPM se non disponibile
            return acc + (overviewKPI.gpmSeries?.[0]?.gpm || 400)
          }, 0) / last20.length
        : 400

    // Usa dati reali se disponibili, altrimenti approssima
    const fightParticipation = styleKPI?.fightParticipation
      ? styleKPI.fightParticipation / 100 // converti da percentuale a decimale
      : (() => {
          const avgAssists =
            last20.length > 0
              ? last20.reduce((acc, r) => acc + (r.assists ?? 0), 0) /
                last20.length
              : 0
          return avgAssists > 5 ? 0.5 : avgAssists > 3 ? 0.4 : 0.3
        })()

    const earlyDeathsAvg = styleKPI?.earlyDeathsAvg
      ? styleKPI.earlyDeathsAvg
      : (() => {
          const avgDeaths =
            last20.length > 0
              ? last20.reduce((acc, r) => acc + (r.deaths ?? 0), 0) /
                last20.length
              : 0
          return avgDeaths * 0.3 // approssima early deaths come 30% delle morti totali
        })()

    return {
      strength:
        avgGpm > avgGpmAll && avgGpm > 400
          ? 'Ottima fase di farm (GPM sopra la media delle tue partite recenti)'
          : avgGpm > 400
            ? 'Buon farming, mantieni questo livello'
            : null,
      weakness:
        fightParticipation < 0.45
          ? 'KP% basso rispetto allo standard (scarsa presenza nei fight)'
          : earlyDeathsAvg > 2
            ? 'Troppe morti early game, migliora il posizionamento nei primi 10 minuti'
            : null,
      suggestion:
        earlyDeathsAvg > 2 && fightParticipation < 0.4
          ? 'Partecipa ai primi teamfight entro i primi 15 minuti'
          : fightParticipation < 0.45
            ? 'Aumenta la presenza ai fight di squadra per migliorare il KP%'
            : earlyDeathsAvg > 2
              ? 'Riduci le morti early concentrandoti su posizionamento e mappa awareness nei primi minuti'
              : 'Continua a mantenere questo livello di prestazioni',
    }
  }, [rows, overviewKPI, styleKPI])

  if (!playerId) {
    return (
      <div className="p-8 text-white">
        <div className="mx-auto max-w-2xl rounded-lg border border-neutral-800 bg-neutral-900/30 p-8 text-center">
          <h2 className="mb-4 text-xl font-semibold">
            Benvenuto nella dashboard Dota 2
          </h2>
          <p className="mb-6 text-neutral-300">
            Per iniziare, inserisci l&apos;ID del tuo account Dota 2 e
            sincronizza i dati.
          </p>
          <SyncPlayerPanel onSyncCompleted={refreshData} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-white">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Panoramica</h1>
        <p className="text-sm text-neutral-400">Player #{playerId}</p>
      </div>

      {loading && (
        <div className="text-neutral-400">Caricamento dati panoramica…</div>
      )}
      {error && (
        <div className="text-red-400">
          Errore nel caricamento della panoramica: {error}
        </div>
      )}

      {!loading && !error && (!rows || rows.length === 0) && (
        <div className="rounded-lg border border-neutral-800 p-6 text-neutral-300">
          <div className="mb-4">
            Non sono ancora presenti partite. Inserisci un ID Dota 2 nel
            pannello di sincronizzazione per scaricare le tue partite da
            OpenDota.
          </div>
          <SyncPlayerPanel onSyncCompleted={refreshData} />
        </div>
      )}

      {!loading && !error && rows && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Colonna sinistra - Trend principale (2/3 su desktop) */}
          <div className="space-y-4 lg:col-span-2">
            {/* 🔷 BLOCCO B — TREND PRESTAZIONI */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-200">
                  Trend Ultime 20 Partite
                </h2>
                <div className="text-xs text-neutral-400">
                  {rows.length} partite analizzate
                </div>
              </div>
              {trendData.length > 0 ? (
                <div className="h-[280px]">
                  <MultiLineChart
                    data={trendData}
                    lines={[
                      { key: 'winrate', color: '#22c55e', label: 'Winrate %' },
                      { key: 'kda', color: '#60a5fa', label: 'KDA' },
                      { key: 'gpm', color: '#f59e0b', label: 'GPM' },
                    ]}
                    width={800}
                    height={280}
                  />
                </div>
              ) : (
                <div className="text-sm text-neutral-500">
                  {kpiLoading
                    ? 'Caricamento dati trend...'
                    : 'Dati non disponibili per questa sezione (dataset limitato per questo account).'}
                </div>
              )}
            </div>
          </div>

          {/* Colonna destra - KPI e Telemetria (1/3 su desktop) */}
          <div className="space-y-4">
            {/* 🔷 BLOCCO A — IDENTITÀ GIOCATORE */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <h2 className="mb-3 text-lg font-semibold text-neutral-200">
                Identità Giocatore
              </h2>
              <div className="mb-3">
                <div className="text-sm text-neutral-400">Nome giocatore</div>
                <div className="text-lg font-semibold">
                  Giocatore #{playerId}
                </div>
                <div className="mt-1">
                  <span className="text-xs text-neutral-500">Player ID: </span>
                  <span className="cursor-pointer text-xs text-blue-400 hover:underline">
                    {playerId}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Winrate complessivo */}
                <KpiCardWithTooltip
                  label="Winrate complessivo"
                  value={globalStats?.winRate ?? null}
                  suffix="%"
                  tooltip="Percentuale di vittorie su tutte le partite disponibili"
                />

                {/* KDA medio */}
                <KpiCardWithTooltip
                  label="KDA medio"
                  value={globalStats?.kdaAvg ?? null}
                  tooltip="Kill/Death/Assist Ratio medio: misura l'efficienza nelle partite"
                />

                {/* GPM medio */}
                <KpiCardWithTooltip
                  label="Gold per Minuto (GPM)"
                  value={globalStats?.avgGpm ?? null}
                  tooltip="Gold guadagnato al minuto: indica l'efficienza nel farming"
                />

                {/* XPM medio */}
                <KpiCardWithTooltip
                  label="Experience per Minuto (XPM)"
                  value={globalStats?.avgXpm ?? null}
                  tooltip="Experience guadagnata al minuto: indica la velocità di leveling"
                />
              </div>
              {/* Hero Pool Snapshot - Top 3 */}
              {heroSnap.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-xs font-semibold text-neutral-300">
                    Top 3 Eroi più Giocati
                  </h3>
                  <div className="space-y-2">
                    {heroSnap.slice(0, 3).map((hero) => (
                      <Link
                        key={hero.heroId}
                        href={`/dashboard/heroes?playerId=${playerId}`}
                        className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/70 p-2 transition-colors hover:bg-neutral-900/90"
                      >
                        {(() => {
                          const iconUrl = getHeroIconUrl(hero.heroId)
                          return iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={iconUrl}
                              alt={getHeroName(hero.heroId)}
                              width={24}
                              height={24}
                              className="h-6 w-6 rounded"
                            />
                          ) : null
                        })()}
                        <div className="min-w-0 flex-1">
                          <div
                            className="truncate text-xs font-medium text-neutral-200"
                            title={getHeroName(hero.heroId)}
                          >
                            {getHeroName(hero.heroId)}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {hero.matches} partite • {hero.winRate}% WR • KDA{' '}
                            {hero.kdaAvg.toFixed(2)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/dashboard/heroes?playerId=${playerId}`}
                    className="mt-2 block text-center text-xs text-blue-400 hover:underline"
                  >
                    Vedi Hero Pool completo →
                  </Link>
                </div>
              )}
            </div>

            {/* [REMOVED - TIER 2] Statistiche Aggiuntive
                Rimossa perché contiene:
                - Aggressività X/100 (indice composito non direttamente derivato da KPI Tier-1)
                - Consistenza X/100 (indice composito non direttamente derivato da KPI Tier-1)
                - Streak recente (non basato su tabelle attuali)
                
                Mantenute solo statistiche base (Partite totali, Hero Pool) se necessarie, ma integrate nel blocco principale.
            */}

            {/* [REMOVED - TIER 2] Insight FZTH - Punti di forza e debolezze
                Rimossa perché contiene insight generici non allineati a dati reali delle tabelle attuali.
                Gli insight devono essere basati su KPI Tier-1 specifici (KDA, GPM, winrate, ecc.) non su logiche compositive.
            */}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente KPI Card uniforme con tooltip e normalizzazione valori
function KpiCardWithTooltip({
  label,
  value,
  suffix = '',
  tooltip,
}: {
  label: string
  value: number | null
  suffix?: string
  tooltip?: string
}) {
  const displayValue =
    value !== null
      ? `${
          typeof formatValueOrNA(value) === 'string'
            ? formatValueOrNA(value)
            : value.toFixed(value < 10 ? 1 : 0)
        }${suffix}`
      : formatValueOrNA(null)

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
      <div className="mb-1 text-xs text-neutral-400" title={tooltip}>
        {label}
      </div>
      <div className="text-lg font-semibold text-neutral-200">
        {displayValue}
      </div>
    </div>
  )
}
