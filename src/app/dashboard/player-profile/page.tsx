/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import { getHeroIconUrl, getHeroName } from '@/lib/dotaHeroes'

type MatchRow = {
  id: string
  player_account_id: number
  match_id: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  duration_seconds: number
  start_time: string
  result: 'win' | 'lose'
  lane?: string | null
  role?: string | null
}

type PlayerKpi = {
  winRate: number
  kdaAvg: number
  avgDurationMinutes: number
  avgLastHits: number
  gpmAvg: number
  xpmAvg: number
  damageAvg: number
  towerDamageAvg: number
  totalMatches: number
}

type HeroSummary = {
  heroId: number
  matches: number
  wins: number
  winRate: number
  kdaAvg: number
  avgDurationMinutes: number
}

type RoleSummary = {
  role: string
  matches: number
  wins: number
  winRate: number
}
type LaneSummary = {
  lane: string
  matches: number
  wins: number
  winRate: number
}
type TrendPoint = { idx: number; score: number }
export default function PlayerProfilePage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">
          Caricamento profilo giocatore…
        </div>
      }
    >
      <PlayerProfileContent />
    </Suspense>
  )
}

function buildHeroStats(rows: MatchRow[]): HeroSummary[] {
  const map = new Map<
    number,
    {
      matches: number
      wins: number
      sumKills: number
      sumDeaths: number
      sumAssists: number
      sumDuration: number
    }
  >()
  for (const r of rows) {
    const cur = map.get(r.hero_id) ?? {
      matches: 0,
      wins: 0,
      sumKills: 0,
      sumDeaths: 0,
      sumAssists: 0,
      sumDuration: 0,
    }
    cur.matches += 1
    if (r.result === 'win') cur.wins += 1
    cur.sumKills += r.kills ?? 0
    cur.sumDeaths += r.deaths ?? 0
    cur.sumAssists += r.assists ?? 0
    cur.sumDuration += r.duration_seconds ?? 0
    map.set(r.hero_id, cur)
  }
  const list: HeroSummary[] = Array.from(map.entries()).map(([heroId, v]) => ({
    heroId,
    matches: v.matches,
    wins: v.wins,
    winRate: Number(((v.wins / Math.max(1, v.matches)) * 100).toFixed(1)),
    kdaAvg: Number(
      (
        (v.sumKills / v.matches + v.sumAssists / v.matches) /
        Math.max(1, v.sumDeaths / v.matches)
      ).toFixed(2),
    ),
    avgDurationMinutes: Math.round(v.sumDuration / Math.max(1, v.matches) / 60),
  }))
  list.sort((a, b) => b.matches - a.matches)
  return list.slice(0, 10)
}

function buildRoleStats(rows: MatchRow[]): RoleSummary[] {
  const map = new Map<string, { matches: number; wins: number }>()
  for (const r of rows) {
    const key = String(r.role ?? 'N/D')
    const cur = map.get(key) ?? { matches: 0, wins: 0 }
    cur.matches += 1
    if (r.result === 'win') cur.wins += 1
    map.set(key, cur)
  }
  return Array.from(map.entries()).map(([role, v]) => ({
    role,
    matches: v.matches,
    wins: v.wins,
    winRate: Number(((v.wins / Math.max(1, v.matches)) * 100).toFixed(1)),
  }))
}

function buildLaneStats(rows: MatchRow[]): LaneSummary[] {
  const map = new Map<string, { matches: number; wins: number }>()
  for (const r of rows) {
    const key = String(r.lane ?? 'N/D')
    const cur = map.get(key) ?? { matches: 0, wins: 0 }
    cur.matches += 1
    if (r.result === 'win') cur.wins += 1
    map.set(key, cur)
  }
  return Array.from(map.entries()).map(([lane, v]) => ({
    lane,
    matches: v.matches,
    wins: v.wins,
    winRate: Number(((v.wins / Math.max(1, v.matches)) * 100).toFixed(1)),
  }))
}

function buildTrendSeries(rows: MatchRow[]): TrendPoint[] {
  if (rows.length === 0) return []
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  )
  const last = sorted.slice(-20)
  return last.map((m, i) => ({
    idx: i + 1,
    score: (m.kills + m.assists) / Math.max(1, m.deaths),
  }))
}

function PlayerProfileContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)

  const [rows, setRows] = useState<MatchRow[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/matches/list?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }
        const json: MatchRow[] = await res.json()
        if (!active) return
        // Usa tutte le partite disponibili (nessun filtro temporale)
        setRows(json ?? [])
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

  const kpi: PlayerKpi | null = useMemo(() => {
    if (!rows || rows.length === 0) return null
    const total = rows.length
    const wins = rows.reduce((a, r) => a + (r.result === 'win' ? 1 : 0), 0)
    const winRate = Number(((wins / Math.max(1, total)) * 100).toFixed(1))
    const sumKills = rows.reduce((a, r) => a + (r.kills ?? 0), 0)
    const sumDeaths = rows.reduce((a, r) => a + (r.deaths ?? 0), 0)
    const sumAssists = rows.reduce((a, r) => a + (r.assists ?? 0), 0)
    const kdaAvg = Number(
      (
        (sumKills / total + sumAssists / total) /
        Math.max(1, sumDeaths / total)
      ).toFixed(2),
    )
    const avgDurationMinutes = Math.round(
      rows.reduce((a, r) => a + (r.duration_seconds ?? 0), 0) / total / 60,
    )
    // last_hits non presente in matches_digest → 0
    return {
      winRate,
      kdaAvg,
      avgDurationMinutes,
      avgLastHits: 0,
      gpmAvg: 0,
      xpmAvg: 0,
      damageAvg: 0,
      towerDamageAvg: 0,
      totalMatches: total,
    }
  }, [rows])

  const heroPool: HeroSummary[] = useMemo(
    () => buildHeroStats(rows ?? []),
    [rows],
  )
  const roleStats: RoleSummary[] = useMemo(
    () => buildRoleStats(rows ?? []),
    [rows],
  )
  const laneStats: LaneSummary[] = useMemo(
    () => buildLaneStats(rows ?? []),
    [rows],
  )
  const trend: TrendPoint[] = useMemo(
    () => buildTrendSeries(rows ?? []),
    [rows],
  )

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profilo giocatore</h1>
          <p className="text-sm text-neutral-400">
            Player #{playerId} – profilo aggregato su tutte le partite
            disponibili
          </p>
          <p className="text-xs text-neutral-500">
            {rows?.length ?? 0} partite analizzate
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-neutral-400">Caricamento profilo giocatore…</div>
      )}
      {error && (
        <div className="text-red-400">
          Errore nel caricamento del profilo: {error}
        </div>
      )}

      {!loading && !error && (!rows || rows.length === 0) && (
        <div className="rounded-lg border border-neutral-800 p-6 text-neutral-300">
          Nessuna partita disponibile per questo giocatore nel dataset corrente.
        </div>
      )}

      {!loading && !error && rows && rows.length > 0 && (
        <>
          {/* KPI principali */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <KpiCard label="Winrate" value={`${kpi?.winRate ?? 0}%`} />
            <KpiCard label="KDA medio" value={`${kpi?.kdaAvg ?? 0}`} />
            <KpiCard
              label="Durata media (min)"
              value={`${kpi?.avgDurationMinutes ?? 0}`}
            />
            <KpiCard label="CS medio" value={`${kpi?.avgLastHits ?? 0}`} />
            <KpiCard label="GPM medio" value={`${kpi?.gpmAvg ?? 0}`} />
            <KpiCard label="XPM medio" value={`${kpi?.xpmAvg ?? 0}`} />
          </div>

          {/* Distribuzioni ruolo/lane */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Distribuzione ruoli
              </h2>
              {roleStats.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  Dati ruolo non disponibili
                </div>
              ) : (
                <RoleLaneTable
                  rows={roleStats.map((r) => ({
                    label: r.role,
                    matches: r.matches,
                    winRate: r.winRate,
                  }))}
                />
              )}
            </div>
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Distribuzione lane
              </h2>
              {laneStats.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  Dati lane non disponibili
                </div>
              ) : (
                <RoleLaneTable
                  rows={laneStats.map((l) => ({
                    label: l.lane,
                    matches: l.matches,
                    winRate: l.winRate,
                  }))}
                />
              )}
            </div>
          </div>

          {/* Hero pool */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm text-neutral-300">
              Hero Pool (top 10)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-900/60 text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Eroe</th>
                    <th className="px-3 py-2 text-left font-medium">Partite</th>
                    <th className="px-3 py-2 text-left font-medium">Winrate</th>
                    <th className="px-3 py-2 text-left font-medium">
                      KDA medio
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Durata media (min)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {heroPool.map((h) => {
                    const icon = getHeroIconUrl(h.heroId)
                    const name = getHeroName(h.heroId)
                    return (
                      <tr
                        key={h.heroId}
                        className="border-t border-neutral-800"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
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
                        </td>
                        <td className="px-3 py-2">{h.matches}</td>
                        <td className="px-3 py-2">{h.winRate}%</td>
                        <td className="px-3 py-2">{h.kdaAvg}</td>
                        <td className="px-3 py-2">{h.avgDurationMinutes}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trend prestazioni + ultime partite */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm text-neutral-300">
              Trend prestazioni (ultimo 20)
            </h2>
            <TrendSpark points={trend} />
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-900/60 text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                    <th className="px-3 py-2 text-left font-medium">Eroe</th>
                    <th className="px-3 py-2 text-left font-medium">K/D/A</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Risultato
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Score</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...(rows ?? [])]
                    .sort(
                      (a, b) =>
                        new Date(b.start_time).getTime() -
                        new Date(a.start_time).getTime(),
                    )
                    .slice(0, 10)
                    .map((m) => {
                      const score =
                        (m.kills + m.assists) / Math.max(1, m.deaths)
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
                          <td className="px-3 py-2">{score.toFixed(2)}</td>
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

function RoleLaneTable({
  rows,
}: {
  rows: Array<{ label: string; matches: number; winRate: number }>
}) {
  const max = Math.max(1, ...rows.map((r) => r.matches))
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <div className="w-24 truncate text-xs text-neutral-300">
            {r.label}
          </div>
          <div className="h-2 flex-1 rounded bg-neutral-900">
            <div
              className="h-2 rounded bg-neutral-600"
              style={{ width: `${(r.matches / max) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-neutral-400">
            {r.matches} · {r.winRate}%
          </div>
        </div>
      ))}
    </div>
  )
}

function TrendSpark({ points }: { points: TrendPoint[] }) {
  const width = 560
  const height = 160
  if (!points || points.length === 0)
    return <div className="text-sm text-neutral-500">Dati non disponibili</div>
  const minX = 1
  const maxX = points[points.length - 1]?.idx || 1
  const minY = Math.min(...points.map((p) => p.score), 0)
  const maxY = Math.max(...points.map((p) => p.score), 0)
  const scaleX = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - 40) + 20
  const scaleY = (y: number) =>
    height - (((y - minY) / (maxY - minY || 1)) * (height - 30) + 15)
  const path = points
    .map(
      (p: TrendPoint, i: number) =>
        `${i === 0 ? 'M' : 'L'} ${scaleX(p.idx)} ${scaleY(p.score)}`,
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
