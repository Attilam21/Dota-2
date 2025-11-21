'use client'

import Link from 'next/link'
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import { getHeroIconUrl, getHeroName } from '@/lib/dotaHeroes'
import {
  buildHeroSnapshot,
  buildMomentum,
  buildStrengthsAndWeaknesses,
  classifyPerformanceLevel,
  computePerformanceIndex,
  type HeroSnapshot as HeroSnap,
} from '@/lib/analytics/overview'
import LineChart from '@/components/charts/LineChart'
import MultiLineChart from '@/components/charts/MultiLineChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { PlayerOverviewKPI } from '@/services/dota/kpiService'

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

type PlayerOverviewStats = {
  totalMatches: number
  wins: number
  losses: number
  winRate: number // 0..100
  avgKills: number
  avgDeaths: number
  avgAssists: number
  kdaAvg: number
  avgDurationMinutes: number
}

type HeroSummary = {
  heroId: number
  matches: number
  wins: number
  winRate: number
}

import SyncPlayerPanel from '@/components/SyncPlayerPanel'

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

function DashboardOverview(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [rows, setRows] = useState<MatchRow[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [overviewKPI, setOverviewKPI] = useState<PlayerOverviewKPI | null>(null)
  const [kpiLoading, setKpiLoading] = useState<boolean>(false)
  const [openTasksCount, setOpenTasksCount] = useState<number>(0)
  const [fzthLevel, setFzthLevel] = useState<{
    level: number
    xp: number
    nextXp: number | null
  } | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        if (!playerId) {
          setRows(null)
          return
        }
        const listRes = await fetch(`/api/matches/list?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (!listRes.ok) {
          const msg = await listRes.json().catch(() => ({}))
          throw new Error(msg?.error || `List HTTP ${listRes.status}`)
        }
        const json: MatchRow[] = await listRes.json()
        if (!active) return
        // usa tutte le partite disponibili (nessun filtro data)
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
  }, [playerId, refreshTrigger])

  // Carica KPI avanzati
  useEffect(() => {
    let active = true
    async function loadKPI() {
      if (!playerId) return
      try {
        setKpiLoading(true)
        const res = await fetch(
          `/api/kpi/player-overview?playerId=${playerId}&limit=20`,
          { cache: 'no-store' },
        )
        if (res.ok) {
          const kpi: PlayerOverviewKPI = await res.json()
          if (active) setOverviewKPI(kpi)
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
  }, [playerId, refreshTrigger])

  // Carica task aperti
  useEffect(() => {
    let active = true
    async function loadTasks() {
      if (!playerId) return
      try {
        const res = await fetch(
          `/api/tasks/list?playerId=${playerId}&status=open`,
          {
            cache: 'no-store',
          },
        )
        if (res.ok) {
          const data = await res.json()
          if (active && data.tasks) {
            setOpenTasksCount(data.tasks.length)
          }
        }
      } catch (e) {
        // Ignora errori task
      }
    }
    loadTasks()
    return () => {
      active = false
    }
  }, [playerId, refreshTrigger])

  // Carica livello FZTH
  useEffect(() => {
    let active = true
    async function loadFzthLevel() {
      if (!playerId) return
      try {
        const res = await fetch(`/api/fzth/profile?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          if (active && data.level) {
            setFzthLevel({
              level: data.level.currentLevel || 1,
              xp: data.level.currentXp || 0,
              nextXp: data.level.nextLevelXp || null,
            })
          }
        }
      } catch (e) {
        // Ignora errori
      }
    }
    loadFzthLevel()
    return () => {
      active = false
    }
  }, [playerId, refreshTrigger])

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
    // Also trigger a reload of the player list in the header if possible,
    // but since that's in a separate component, a full page refresh might be needed
    // or we rely on the user navigating.
    // For now, just re-fetching matches is good.
    // Ideally we would use a context or SWR/TanStack Query for this.
    // To ensure the PlayerSelector also updates, we can force a router refresh.
    window.location.reload()
  }

  const stats: PlayerOverviewStats | null = useMemo(() => {
    if (!rows || rows.length === 0) return null
    const total = rows.length
    const wins = rows.reduce((acc, r) => acc + (r.result === 'win' ? 1 : 0), 0)
    const losses = total - wins
    const winRate = total > 0 ? (wins / total) * 100 : 0
    const sumKills = rows.reduce((a, r) => a + (r.kills ?? 0), 0)
    const sumDeaths = rows.reduce((a, r) => a + (r.deaths ?? 0), 0)
    const sumAssists = rows.reduce((a, r) => a + (r.assists ?? 0), 0)
    const avgKills = total > 0 ? sumKills / total : 0
    const avgDeaths = total > 0 ? sumDeaths / total : 0
    const avgAssists = total > 0 ? sumAssists / total : 0
    const kdaAvg = (avgKills + avgAssists) / Math.max(1, avgDeaths)
    const avgDurationMinutes =
      total > 0
        ? Math.round(
            rows.reduce((a, r) => a + (r.duration_seconds ?? 0), 0) /
              total /
              60,
          )
        : 0
    return {
      totalMatches: total,
      wins,
      losses,
      winRate: Number(winRate.toFixed(1)),
      avgKills: Number(avgKills.toFixed(1)),
      avgDeaths: Number(avgDeaths.toFixed(1)),
      avgAssists: Number(avgAssists.toFixed(1)),
      kdaAvg: Number(kdaAvg.toFixed(2)),
      avgDurationMinutes,
    }
  }, [rows])

  const heroSnap: HeroSnap[] = useMemo(
    () => buildHeroSnapshot(rows ?? [], 5),
    [rows],
  )

  // Trend performance (ultime 10 partite): score semplice (kills+assists - deaths)
  const trendPoints = useMemo(() => {
    if (!rows || rows.length === 0) return []
    const lastN = rows.slice(0, 10).reverse() // cronologico crescente
    return lastN.map((r, idx) => ({
      minute: idx,
      goldDiff: r.kills + r.assists - r.deaths, // riuso SparkLine con campo goldDiff
    }))
  }, [rows])

  const performanceIndex = useMemo(() => {
    if (!stats) return 0
    return computePerformanceIndex({
      winRatePercent: stats.winRate,
      kdaAvg: stats.kdaAvg,
    })
  }, [stats])

  const momentum = useMemo(() => {
    if (!rows || rows.length === 0)
      return { last10: [], last5Wr: 0, prev5Wr: 0, trend: 'na' as const }
    const results = rows.map((r) => r.result)
    return buildMomentum(results)
  }, [rows])

  const insights = useMemo(
    () => buildStrengthsAndWeaknesses(rows ?? []),
    [rows],
  )

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
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panoramica giocatore</h1>
          <p className="text-sm text-neutral-400">Player #{playerId}</p>
        </div>
        {/* Optional: Allow syncing another player even if one is selected */}
        <div className="hidden lg:block">
          {/* Could put a mini sync button here if needed, but for now keep it simple */}
        </div>
      </div>

      {loading && (
        <div className="text-neutral-400">Caricamento dati panoramica…</div>
      )}
      {error && (
        <div className="text-red-400">
          Errore nel caricamento della panoramica giocatore: {error}
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
        <>
          {/* A. Header rapido */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Panoramica</h1>
                <p className="text-sm text-neutral-400">Player #{playerId}</p>
              </div>
              <div className="flex items-center gap-4">
                {/* FZTH Score */}
                <div className="text-center">
                  <div className="text-xs text-neutral-400">FZTH Score</div>
                  <div className="text-2xl font-bold">{performanceIndex}</div>
                  <div className="text-xs text-neutral-500">
                    {classifyPerformanceLevel(performanceIndex)}
                  </div>
                </div>
                {/* Livello FZTH */}
                {fzthLevel && (
                  <div className="text-center">
                    <div className="text-xs text-neutral-400">Livello</div>
                    <div className="text-2xl font-bold">{fzthLevel.level}</div>
                    {fzthLevel.nextXp && (
                      <div className="text-xs text-neutral-500">
                        {fzthLevel.xp} / {fzthLevel.nextXp} XP
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ultimi 20 match: KPI rapidi */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <div className="text-xs text-neutral-400">
                  Winrate (ultimi 20)
                </div>
                <div className="text-lg font-semibold">
                  {(() => {
                    const last20 = rows.slice(0, 20)
                    const wins = last20.filter((r) => r.result === 'win').length
                    return last20.length > 0
                      ? `${((wins / last20.length) * 100).toFixed(1)}%`
                      : '0%'
                  })()}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <div className="text-xs text-neutral-400">
                  KDA medio (ultimi 20)
                </div>
                <div className="text-lg font-semibold">
                  {(() => {
                    const last20 = rows.slice(0, 20)
                    const avgKda =
                      last20.length > 0
                        ? last20.reduce((acc, r) => {
                            const kda =
                              (r.kills + r.assists) / Math.max(1, r.deaths)
                            return acc + kda
                          }, 0) / last20.length
                        : 0
                    return avgKda.toFixed(2)
                  })()}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <div className="text-xs text-neutral-400">GPM medio</div>
                <div className="text-lg font-semibold">
                  {overviewKPI?.avgGpm
                    ? `${Math.round(overviewKPI.avgGpm)}`
                    : 'N/D'}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                <div className="text-xs text-neutral-400">XPM medio</div>
                <div className="text-lg font-semibold">
                  {overviewKPI?.avgXpm
                    ? `${Math.round(overviewKPI.avgXpm)}`
                    : 'N/D'}
                </div>
              </div>
            </div>

            {/* Mini card Punti di forza e Aree critiche */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-green-800 bg-green-900/20 p-3">
                <div className="mb-2 text-xs font-medium text-green-300">
                  💪 Punti di forza
                </div>
                <div className="text-sm text-neutral-300">
                  {insights
                    .filter((i) => i.type === 'strength')
                    .slice(0, 2)
                    .map((i) => i.title)
                    .join(', ') || 'Nessun punto di forza identificato'}
                </div>
              </div>
              <div className="rounded-lg border border-red-800 bg-red-900/20 p-3">
                <div className="mb-2 text-xs font-medium text-red-300">
                  ⚠️ Aree critiche
                </div>
                <div className="text-sm text-neutral-300">
                  {insights
                    .filter((i) => i.type === 'weakness')
                    .slice(0, 2)
                    .map((i) => i.title)
                    .join(', ') || 'Nessuna area critica identificata'}
                </div>
              </div>
            </div>
          </div>

          {/* B. Trend sintetico - Grafico unico con Winrate, KDA, GPM */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm text-neutral-300">
              Trend sintetico (ultimi 20 match)
            </h2>
            {overviewKPI && (
              <MultiLineChart
                data={rows
                  .slice(0, 20)
                  .reverse()
                  .map((r, idx) => {
                    const last20 = rows.slice(0, 20)
                    const matchesUpToIdx = last20.slice(0, idx + 1)
                    const wins = matchesUpToIdx.filter(
                      (m) => m.result === 'win',
                    ).length
                    const winrate =
                      matchesUpToIdx.length > 0
                        ? (wins / matchesUpToIdx.length) * 100
                        : 0
                    const avgKda =
                      matchesUpToIdx.length > 0
                        ? matchesUpToIdx.reduce((acc, m) => {
                            const kda =
                              (m.kills + m.assists) / Math.max(1, m.deaths)
                            return acc + kda
                          }, 0) / matchesUpToIdx.length
                        : 0
                    return {
                      x: idx,
                      winrate: Number(winrate.toFixed(1)),
                      kda: Number(avgKda.toFixed(2)),
                      gpm: overviewKPI.gpmSeries[idx]?.gpm || 0,
                    }
                  })}
                lines={[
                  { key: 'winrate', color: '#22c55e', label: 'Winrate %' },
                  { key: 'kda', color: '#60a5fa', label: 'KDA' },
                  { key: 'gpm', color: '#f59e0b', label: 'GPM' },
                ]}
              />
            )}
          </div>

          {/* C. Snapshot Hero Pool - Top 3 */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm text-neutral-300">Snapshot Hero Pool</h2>
              <Link
                href="/dashboard/heroes"
                className="text-xs text-blue-400 hover:underline"
              >
                Vedi Hero Pool completo →
              </Link>
            </div>
            {heroSnap.length === 0 ? (
              <div className="text-sm text-neutral-500">
                Nessun dato disponibile
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {heroSnap.slice(0, 3).map((h) => {
                  const icon = getHeroIconUrl(h.heroId)
                  const name = getHeroName(h.heroId)
                  return (
                    <div
                      key={h.heroId}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        {icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={icon}
                            alt={name}
                            width={24}
                            height={24}
                            className="h-6 w-6 rounded"
                            loading="lazy"
                            onError={(e) => {
                              ;(
                                e.currentTarget as HTMLImageElement
                              ).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-neutral-700 text-xs">
                            {name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                      <div className="space-y-1 text-xs text-neutral-400">
                        <div>{h.matches} partite</div>
                        <div>
                          Winrate:{' '}
                          <span className="text-green-400">{h.winRate}%</span>
                        </div>
                        <div>KDA: {h.kdaAvg}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* D. Collegamento rapido ai Task */}
          <div className="rounded-lg border border-blue-800 bg-blue-900/20 p-4">
            {openTasksCount > 0 ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-300">
                    Hai {openTasksCount} task da completare
                  </div>
                  <div className="text-xs text-neutral-400">
                    Completa i task per migliorare le tue prestazioni
                  </div>
                </div>
                <Link
                  href="/dashboard/coaching"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Vai ai Task →
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-300">
                    Genera nuovi task basati sui tuoi KPI
                  </div>
                  <div className="text-xs text-neutral-400">
                    Crea task personalizzati per migliorare le tue prestazioni
                  </div>
                </div>
                <Link
                  href="/dashboard/coaching"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Genera Task →
                </Link>
              </div>
            )}
          </div>

          {/* KPI dettagliati (mantenuti per retrocompatibilità) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <KpiCard label="Winrate" value={`${stats?.winRate ?? 0}%`} />
            <KpiCard label="KDA medio" value={`${stats?.kdaAvg ?? 0}`} />
            <KpiCard
              label="Partite giocate"
              value={`${stats?.totalMatches ?? 0}`}
            />
            <KpiCard
              label="Durata media (min)"
              value={`${stats?.avgDurationMinutes ?? 0}`}
            />
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-xs text-neutral-400">
                FZTH Performance Index
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-semibold">{performanceIndex}</div>
                {(() => {
                  const lvl = classifyPerformanceLevel(performanceIndex)
                  const cls =
                    performanceIndex > 70
                      ? 'bg-green-900/40 text-green-300'
                      : performanceIndex >= 40
                        ? 'bg-yellow-900/40 text-yellow-300'
                        : 'bg-red-900/40 text-red-300'
                  return (
                    <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>
                      {lvl}
                    </span>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Row 2: Eroi più giocati + Trend/Momentum */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Eroi più giocati
              </h2>
              {heroSnap.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  Nessun dato disponibile
                </div>
              ) : (
                <div className="space-y-2">
                  {heroSnap.slice(0, 5).map((h) => {
                    const icon = getHeroIconUrl(h.heroId)
                    const name = getHeroName(h.heroId)
                    return (
                      <div
                        key={h.heroId}
                        className="flex items-center justify-between rounded-md bg-neutral-900/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          {icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={icon}
                              alt={name}
                              width={20}
                              height={20}
                              className="h-5 w-5 rounded"
                              loading="lazy"
                              onError={(e) => {
                                ;(
                                  e.currentTarget as HTMLImageElement
                                ).style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-neutral-700 text-[10px]">
                              {name.charAt(0)}
                            </div>
                          )}
                          <span>{name}</span>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {h.matches} partite · {h.winRate}% WR · KDA {h.kdaAvg}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-2 text-sm text-neutral-300">
                Momentum ultime 10 partite
              </h2>
              {/* Strip W/L */}
              <div className="mb-3 flex gap-1">
                {(momentum.last10.length > 0 ? momentum.last10 : []).map(
                  (r, idx) => (
                    <div
                      key={idx}
                      className={`h-3 w-3 rounded ${
                        r === 'win' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      title={r}
                    />
                  ),
                )}
              </div>
              <div className="text-xs text-neutral-400">
                Ultime 5: {momentum.last5Wr}% · Precedenti 5: {momentum.prev5Wr}
                % ·{' '}
                {momentum.trend === 'up'
                  ? 'Trend in crescita'
                  : momentum.trend === 'down'
                    ? 'Trend in calo'
                    : momentum.trend === 'flat'
                      ? 'Trend stabile'
                      : 'Trend non valutabile (poche partite)'}
              </div>
              <div className="mt-4">
                <SparkLine points={trendPoints} />
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {insights.map((c, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-neutral-800 p-4"
              >
                <div className="mb-1 text-xs uppercase tracking-wide text-neutral-400">
                  {c.type === 'strength'
                    ? 'Punto di forza'
                    : 'Area da migliorare'}
                </div>
                <div className="mb-2 text-sm font-medium text-neutral-200">
                  {c.title}
                </div>
                <div className="text-sm text-neutral-300">{c.description}</div>
                <div className="mt-3">
                  <Link
                    href="/dashboard/coaching"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Vai alla sezione Coaching per un piano dedicato
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Grafici KPI avanzati */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Grafico KDA per match */}
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Trend KDA per partita
              </h2>
              {overviewKPI && overviewKPI.kdaSeries.length > 0 ? (
                <>
                  <LineChart
                    data={overviewKPI.kdaSeries.slice(0, 20).map((d) => ({
                      x: d.matchId,
                      y: d.kda,
                      label: new Date(d.date).toLocaleDateString('it-IT'),
                    }))}
                    color="#60a5fa"
                  />
                  <ExplanationCard
                    title="Cosa misura il KDA"
                    description="Il KDA (Kill/Death/Assist) indica l'efficienza nelle partite. Un KDA alto significa che contribuisci di più al team con kill e assist, mantenendo poche morti."
                    timeRange="Ultime 20 partite"
                    interpretation={
                      overviewKPI.kdaAvg >= 2.0
                        ? 'Il tuo KDA è buono e stabile.'
                        : overviewKPI.kdaAvg >= 1.5
                          ? 'Il tuo KDA è nella media, cerca di ridurre le morti per migliorarlo.'
                          : 'Il tuo KDA è basso, concentrati su sopravvivenza e partecipazione ai fight.'
                    }
                  />
                </>
              ) : (
                <div className="text-sm text-neutral-500">
                  {kpiLoading
                    ? 'Caricamento dati KPI...'
                    : 'Dati KDA non disponibili'}
                </div>
              )}
            </div>

            {/* Grafico GPM per match (placeholder - da popolare quando disponibile) */}
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Trend GPM per partita
              </h2>
              {overviewKPI && overviewKPI.gpmSeries.length > 0 ? (
                <>
                  <LineChart
                    data={overviewKPI.gpmSeries.slice(0, 20).map((d) => ({
                      x: d.matchId,
                      y: d.gpm,
                      label: new Date(d.date).toLocaleDateString('it-IT'),
                    }))}
                    color="#22c55e"
                  />
                  <ExplanationCard
                    title="Cosa misura il GPM"
                    description="Il GPM (Gold Per Minute) indica quanto gold guadagni al minuto. Un GPM alto significa farming efficiente e buona gestione dell'economia."
                    timeRange="Ultime 20 partite"
                    interpretation={
                      overviewKPI.avgGpm >= 400
                        ? 'Il tuo GPM è ottimo, stai farmando bene.'
                        : overviewKPI.avgGpm >= 300
                          ? 'Il tuo GPM è nella media, cerca di migliorare il farming.'
                          : 'Il tuo GPM è basso, concentrati su last hit e partecipazione ai fight per più gold.'
                    }
                  />
                </>
              ) : (
                <div className="text-sm text-neutral-500">
                  {kpiLoading
                    ? 'Caricamento dati KPI...'
                    : 'Dati GPM non disponibili (richiedono dettagli match completi)'}
                </div>
              )}
            </div>

            {/* Grafico XPM per match */}
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Trend XPM per partita
              </h2>
              {overviewKPI && overviewKPI.xpmSeries.length > 0 ? (
                <>
                  <LineChart
                    data={overviewKPI.xpmSeries.slice(0, 20).map((d) => ({
                      x: d.matchId,
                      y: d.xpm,
                      label: new Date(d.date).toLocaleDateString('it-IT'),
                    }))}
                    color="#f59e0b"
                  />
                  <ExplanationCard
                    title="Cosa misura l'XPM"
                    description="L'XPM (Experience Per Minute) indica quanto experience guadagni al minuto. Un XPM alto significa che stai livellando velocemente e sei più forte prima."
                    timeRange="Ultime 20 partite"
                    interpretation={
                      overviewKPI.avgXpm >= 500
                        ? 'Il tuo XPM è ottimo, stai livellando velocemente.'
                        : overviewKPI.avgXpm >= 400
                          ? 'Il tuo XPM è nella media, cerca di partecipare di più ai fight per più experience.'
                          : 'Il tuo XPM è basso, concentrati su farming e partecipazione agli scontri.'
                    }
                  />
                </>
              ) : (
                <div className="text-sm text-neutral-500">
                  {kpiLoading
                    ? 'Caricamento dati KPI...'
                    : 'Dati XPM non disponibili (richiedono dettagli match completi)'}
                </div>
              )}
            </div>

            {/* Grafico Damage per match */}
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Danni agli eroi per partita
              </h2>
              {overviewKPI && overviewKPI.damageSeries.length > 0 ? (
                <>
                  <LineChart
                    data={overviewKPI.damageSeries.slice(0, 20).map((d) => ({
                      x: d.matchId,
                      y: d.damage,
                      label: new Date(d.date).toLocaleDateString('it-IT'),
                    }))}
                    color="#ef4444"
                  />
                  <ExplanationCard
                    title="Cosa misura il Damage"
                    description="I danni agli eroi indicano quanto impatto hai negli scontri. Danni alti significano che stai contribuendo attivamente ai fight del team."
                    timeRange="Ultime 20 partite"
                    interpretation={
                      overviewKPI.avgHeroDamage >= 15000
                        ? 'Stai facendo molti danni, ottimo impatto nei fight.'
                        : overviewKPI.avgHeroDamage >= 10000
                          ? 'I tuoi danni sono nella media, cerca di essere più presente agli scontri.'
                          : 'I tuoi danni sono bassi, concentrati su partecipazione ai fight e item damage.'
                    }
                  />
                </>
              ) : (
                <div className="text-sm text-neutral-500">
                  {kpiLoading
                    ? 'Caricamento dati KPI...'
                    : 'Dati Damage non disponibili (richiedono dettagli match completi)'}
                </div>
              )}
            </div>
          </div>

          {/* FZTH level */}
          <div className="rounded-lg border border-neutral-800 p-4">
            {(() => {
              const lvl = classifyPerformanceLevel(performanceIndex)
              const pct = Math.max(0, Math.min(100, performanceIndex))
              return (
                <>
                  <div className="mb-1 text-sm text-neutral-300">
                    Livello FZTH stimato:{' '}
                    <span className="font-medium">{lvl}</span> (calcolato sui
                    tuoi risultati attuali)
                  </div>
                  <div className="h-2 w-full rounded bg-neutral-900">
                    <div
                      className={`h-2 rounded ${
                        pct > 70
                          ? 'bg-green-500'
                          : pct >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-neutral-400">
                    Migliora il livello completando task nella sezione Coaching
                    (in arrivo).
                  </div>
                </>
              )
            })()}
          </div>

          {/* Mini lista ultime partite */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm text-neutral-300">Ultime partite</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-900/60 text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                    <th className="px-3 py-2 text-left font-medium">Eroe</th>
                    <th className="px-3 py-2 text-left font-medium">
                      K / D / A
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Risultato
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Durata (min)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((m) => {
                    const durationMinutes = Math.round(
                      (m.duration_seconds ?? 0) / 60,
                    )
                    return (
                      <tr
                        key={m.match_id}
                        className="border-t border-neutral-800 hover:bg-neutral-900/40"
                      >
                        <td className="px-3 py-2">
                          {new Date(m.start_time).toLocaleString('it-IT')}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const icon = getHeroIconUrl(m.hero_id)
                              const name = getHeroName(m.hero_id)
                              return (
                                <>
                                  {icon ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={icon}
                                      alt={name}
                                      width={20}
                                      height={20}
                                      className="h-5 w-5 rounded"
                                      loading="lazy"
                                      onError={(e) => {
                                        ;(
                                          e.currentTarget as HTMLImageElement
                                        ).style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <div className="flex h-5 w-5 items-center justify-center rounded bg-neutral-700 text-[10px]">
                                      {name.charAt(0)}
                                    </div>
                                  )}
                                  <span>{name}</span>
                                </>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {m.kills} / {m.deaths} / {m.assists}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              m.result === 'win'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }
                          >
                            {m.result === 'win' ? 'Vittoria' : 'Sconfitta'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{durationMinutes}</td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/dashboard/matches/${m.match_id}?playerId=${m.player_account_id}`}
                            className="text-blue-400 hover:underline"
                          >
                            Apri
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

function SparkLine({
  points,
}: {
  points: Array<{ minute: number; goldDiff: number }>
}) {
  const width = 560
  const height = 160

  if (!points || points.length === 0) {
    return <div className="text-sm text-neutral-500">Dati non disponibili</div>
  }

  const minX = 0
  const maxX = points[points.length - 1].minute || 1
  const minY = Math.min(...points.map((p) => p.goldDiff), 0)
  const maxY = Math.max(...points.map((p) => p.goldDiff), 0)

  const scaleX = (m: number) =>
    ((m - minX) / (maxX - minX || 1)) * (width - 40) + 20
  const scaleY = (g: number) =>
    height - (((g - minY) / (maxY - minY || 1)) * (height - 30) + 15)

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${scaleX(p.minute)} ${scaleY(p.goldDiff)}`,
    )
    .join(' ')

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="text-blue-400"
    >
      <line
        x1="0"
        y1={scaleY(0)}
        x2={width}
        y2={scaleY(0)}
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1"
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
