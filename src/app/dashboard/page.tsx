'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

// Legge playerId esattamente come /dashboard/matches (stesso placeholder di test)
const TEST_PLAYER_ID = 86745912

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

export default function DashboardPage(): React.JSX.Element {
  const [rows, setRows] = useState<MatchRow[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const playerId = TEST_PLAYER_ID

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
        // filtro ultimi 30 giorni
        const now = Date.now()
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
        const filtered = (json || []).filter((m) => {
          const t = new Date(m.start_time).getTime()
          return Number.isFinite(t) && now - t <= THIRTY_DAYS
        })
        setRows(filtered)
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

  const topHeroes: HeroSummary[] = useMemo(() => {
    if (!rows || rows.length === 0) return []
    const map = new Map<number, { matches: number; wins: number }>()
    for (const r of rows) {
      const cur = map.get(r.hero_id) ?? { matches: 0, wins: 0 }
      cur.matches += 1
      if (r.result === 'win') cur.wins += 1
      map.set(r.hero_id, cur)
    }
    const list: HeroSummary[] = Array.from(map.entries()).map(
      ([heroId, v]) => ({
        heroId,
        matches: v.matches,
        wins: v.wins,
        winRate: Number(((v.wins / Math.max(1, v.matches)) * 100).toFixed(1)),
      }),
    )
    list.sort((a, b) => b.matches - a.matches)
    return list.slice(0, 3)
  }, [rows])

  // Trend performance (ultime 10 partite): score semplice (kills+assists - deaths)
  const trendPoints = useMemo(() => {
    if (!rows || rows.length === 0) return []
    const lastN = rows.slice(0, 10).reverse() // cronologico crescente
    return lastN.map((r, idx) => ({
      minute: idx,
      goldDiff: r.kills + r.assists - r.deaths, // riuso SparkLine con campo goldDiff
    }))
  }, [rows])

  if (!playerId) {
    return (
      <div className="p-8 text-white">
        <div className="rounded-lg border border-neutral-800 p-8 text-center text-neutral-300">
          Seleziona un account per vedere la panoramica
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
          Nessuna partita trovata negli ultimi 30 giorni.
        </div>
      )}

      {!loading && !error && rows && rows.length > 0 && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiCard
              label="Winrate (ultimi 30 gg)"
              value={`${stats?.winRate ?? 0}%`}
            />
            <KpiCard label="KDA medio" value={`${stats?.kdaAvg ?? 0}`} />
            <KpiCard
              label="Partite giocate"
              value={`${stats?.totalMatches ?? 0}`}
            />
            <KpiCard
              label="Durata media (min)"
              value={`${stats?.avgDurationMinutes ?? 0}`}
            />
          </div>

          {/* Row 2: Eroi più giocati + Trend */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Eroi più giocati
              </h2>
              {topHeroes.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  Nessun dato disponibile
                </div>
              ) : (
                <div className="space-y-2">
                  {topHeroes.map((h) => (
                    <div
                      key={h.heroId}
                      className="flex items-center justify-between rounded-md bg-neutral-900/50 px-3 py-2"
                    >
                      <div className="text-sm">Eroe #{h.heroId}</div>
                      <div className="text-xs text-neutral-400">
                        {h.matches} partite · {h.winRate}% WR
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-2 text-sm text-neutral-300">
                Trend performance (ultime partite)
              </h2>
              <SparkLine points={trendPoints} />
            </div>
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
                        <td className="px-3 py-2">Eroe #{m.hero_id}</td>
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
