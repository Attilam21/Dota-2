'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import { getHeroIconUrl, getHeroName } from '@/lib/dotaHeroes'
import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { HeroPoolKPI } from '@/services/dota/kpiService'

// Componente per Hero Pool Matrix
function HeroPoolMatrix({
  heroes,
}: {
  heroes: Array<{
    heroId: number
    matches: number
    winRate: number
    kdaAvg: number
  }>
}) {
  if (heroes.length === 0) {
    return <div className="text-sm text-neutral-500">Dati non disponibili</div>
  }

  const maxMatches = Math.max(...heroes.map((h) => h.matches), 1)
  const maxWinrate = Math.max(...heroes.map((h) => h.winRate), 1)

  // Calcola quadranti
  const quadrantHeroes = {
    comfort: heroes.filter(
      (h) => h.matches >= maxMatches * 0.3 && h.winRate >= 50,
    ),
    highWinrate: heroes.filter(
      (h) => h.matches < maxMatches * 0.3 && h.winRate >= 50,
    ),
    overused: heroes.filter(
      (h) => h.matches >= maxMatches * 0.3 && h.winRate < 50,
    ),
    unexplored: heroes.filter(
      (h) => h.matches < maxMatches * 0.3 && h.winRate < 50,
    ),
  }

  const width = 560
  const height = 400

  return (
    <div className="w-full">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Griglia */}
        <line
          x1={width / 2}
          y1="0"
          x2={width / 2}
          y2={height}
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Etichette assi */}
        <text
          x={width / 2}
          y={height - 10}
          fontSize="12"
          fill="currentColor"
          textAnchor="middle"
        >
          Frequenza utilizzo →
        </text>
        <text
          x="10"
          y={height / 2}
          fontSize="12"
          fill="currentColor"
          transform={`rotate(-90, 10, ${height / 2})`}
        >
          Performance (Winrate) ↑
        </text>

        {/* Punti eroi */}
        {heroes.map((hero) => {
          const x = (hero.matches / maxMatches) * (width - 100) + 50
          const y = height - (hero.winRate / maxWinrate) * (height - 100) - 50
          const color =
            hero.matches >= maxMatches * 0.3 && hero.winRate >= 50
              ? '#22c55e' // Comfort
              : hero.matches < maxMatches * 0.3 && hero.winRate >= 50
                ? '#60a5fa' // High winrate
                : hero.matches >= maxMatches * 0.3 && hero.winRate < 50
                  ? '#ef4444' // Overused
                  : '#9ca3af' // Unexplored

          return (
            <g key={hero.heroId}>
              <circle cx={x} cy={y} r="6" fill={color} />
              <title>
                {getHeroName(hero.heroId)}: {hero.matches} partite,{' '}
                {hero.winRate}% WR
              </title>
            </g>
          )
        })}

        {/* Etichette quadranti */}
        <text
          x={width * 0.75}
          y={height * 0.25}
          fontSize="10"
          fill="#22c55e"
          fontWeight="bold"
        >
          Comfort Picks
        </text>
        <text
          x={width * 0.25}
          y={height * 0.25}
          fontSize="10"
          fill="#60a5fa"
          fontWeight="bold"
        >
          High Winrate / Low Usage
        </text>
        <text
          x={width * 0.75}
          y={height * 0.75}
          fontSize="10"
          fill="#ef4444"
          fontWeight="bold"
        >
          Overused / Underperforming
        </text>
        <text
          x={width * 0.25}
          y={height * 0.75}
          fontSize="10"
          fill="#9ca3af"
          fontWeight="bold"
        >
          Unexplored
        </text>
      </svg>

      {/* Legenda quadranti */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-neutral-400">
            Comfort Picks ({quadrantHeroes.comfort.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-neutral-400">
            High Winrate / Low Usage ({quadrantHeroes.highWinrate.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-neutral-400">
            Overused / Underperforming ({quadrantHeroes.overused.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-neutral-500" />
          <span className="text-neutral-400">
            Unexplored ({quadrantHeroes.unexplored.length})
          </span>
        </div>
      </div>
    </div>
  )
}

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
}

type HeroAggregatedStats = {
  heroId: number
  heroName: string
  heroImageUrl?: string | null
  matches: number
  wins: number
  losses: number
  winrate: number
  avgKda: number
  avgDurationMinutes: number
}

export default function HeroesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">
          Caricamento statistiche per eroe…
        </div>
      }
    >
      <HeroesContent />
    </Suspense>
  )
}

function HeroesContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [rows, setRows] = useState<MatchRow[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [heroPoolKPI, setHeroPoolKPI] = useState<HeroPoolKPI | null>(null)
  const [kpiLoading, setKpiLoading] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        if (!playerId) {
          setRows([])
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
        // Usa tutte le partite disponibili (nessun filtro temporale)
        setRows(json ?? [])
      } catch (e: any) {
        console.error('Heroes load error:', e)
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

  // Carica KPI hero pool
  useEffect(() => {
    let active = true
    async function loadKPI() {
      if (!playerId) return
      try {
        setKpiLoading(true)
        const res = await fetch(
          `/api/kpi/hero-pool?playerId=${playerId}&limit=100`,
          { cache: 'no-store' },
        )
        if (res.ok) {
          const kpi: HeroPoolKPI = await res.json()
          if (active) setHeroPoolKPI(kpi)
        }
      } catch (e) {
        console.error('Error loading hero pool KPI:', e)
      } finally {
        if (active) setKpiLoading(false)
      }
    }
    loadKPI()
    return () => {
      active = false
    }
  }, [playerId])

  const aggregated: HeroAggregatedStats[] = useMemo(() => {
    if (!rows || rows.length === 0) return []
    const byHero = new Map<
      number,
      {
        matches: number
        wins: number
        losses: number
        sumKda: number
        sumDuration: number
      }
    >()
    for (const r of rows) {
      const cur = byHero.get(r.hero_id) ?? {
        matches: 0,
        wins: 0,
        losses: 0,
        sumKda: 0,
        sumDuration: 0,
      }
      cur.matches += 1
      if (r.result === 'win') cur.wins += 1
      else cur.losses += 1
      const kda = (r.kills + r.assists) / Math.max(1, r.deaths)
      cur.sumKda += kda
      cur.sumDuration += r.duration_seconds ?? 0
      byHero.set(r.hero_id, cur)
    }
    const list: HeroAggregatedStats[] = Array.from(byHero.entries()).map(
      ([heroId, v]) => {
        const name = getHeroName(heroId)
        const icon = getHeroIconUrl(heroId)
        return {
          heroId,
          heroName: name,
          heroImageUrl: icon,
          matches: v.matches,
          wins: v.wins,
          losses: v.losses,
          winrate: Number(((v.wins / Math.max(1, v.matches)) * 100).toFixed(1)),
          avgKda: Number((v.sumKda / Math.max(1, v.matches)).toFixed(2)),
          avgDurationMinutes: Math.round(
            v.sumDuration / Math.max(1, v.matches) / 60,
          ),
        }
      },
    )
    // default sort: matches desc
    list.sort((a, b) => b.matches - a.matches)
    return list
  }, [rows])

  const kpis = useMemo(() => {
    const heroPool = aggregated.length
    const mostPlayed = aggregated[0] ?? null
    const eligible = aggregated.filter((h) => h.matches >= 3)
    let bestWr: HeroAggregatedStats | null = null
    let worstWr: HeroAggregatedStats | null = null
    if (eligible.length > 0) {
      bestWr = [...eligible].sort((a, b) => b.winrate - a.winrate)[0] ?? null
      worstWr = [...eligible].sort((a, b) => a.winrate - b.winrate)[0] ?? null
    }
    return { heroPool, mostPlayed, bestWr, worstWr }
  }, [aggregated])

  const [sortBy, setSortBy] = useState<'matches' | 'winrate'>('matches')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    const copy = [...aggregated]
    copy.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'matches') return mul * (a.matches - b.matches)
      return mul * (a.winrate - b.winrate)
    })
    return copy
  }, [aggregated, sortBy, sortDir])

  function toggleSort(key: 'matches' | 'winrate') {
    if (sortBy !== key) {
      setSortBy(key)
      setSortDir('desc')
    } else {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    }
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Eroi</h1>
          <p className="text-sm text-neutral-400">
            Panoramica delle performance per eroe su tutte le partite
            disponibili (dataset di test).
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-neutral-400">
          Caricamento statistiche per eroe…
        </div>
      )}
      {error && (
        <div className="text-red-400">Errore nel caricamento: {error}</div>
      )}

      {!loading && !error && rows && rows.length === 0 && (
        <div className="rounded-lg border border-neutral-800 p-6 text-neutral-300">
          Nessuna partita trovata per questo giocatore nel dataset disponibile.
        </div>
      )}

      {!loading && !error && aggregated.length > 0 && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiCard label="Hero pool" value={`${kpis.heroPool}`} />
            <KpiCard
              label="Eroe più giocato"
              value={
                kpis.mostPlayed
                  ? `${kpis.mostPlayed.heroName} • ${kpis.mostPlayed.matches}`
                  : 'N/D'
              }
            />
            <KpiCard
              label="Miglior WR (≥3)"
              value={
                kpis.bestWr
                  ? `${kpis.bestWr.heroName} • ${kpis.bestWr.winrate}%`
                  : 'N/D'
              }
            />
            <KpiCard
              label="Peggior WR (≥3)"
              value={
                kpis.worstWr
                  ? `${kpis.worstWr.heroName} • ${kpis.worstWr.winrate}%`
                  : 'N/D'
              }
            />
          </div>

          {/* Top 5 per winrate e più giocati */}
          {heroPoolKPI &&
            (heroPoolKPI.top5ByWinrate.length > 0 ||
              heroPoolKPI.top5ByMatches.length > 0) && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top 5 per winrate */}
                <div className="rounded-lg border border-neutral-800 p-4">
                  <h2 className="mb-3 text-sm text-neutral-300">
                    Top 5 eroi per winrate (min. 3 partite)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-neutral-900/60 text-neutral-300">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Eroe
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Winrate
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Partite
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {heroPoolKPI.top5ByWinrate.map((h) => {
                          const name = getHeroName(h.heroId)
                          const icon = getHeroIconUrl(h.heroId)
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
                              <td className="px-3 py-2">
                                <span className="text-green-400">
                                  {h.winRate}%
                                </span>
                              </td>
                              <td className="px-3 py-2">{h.matches}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <ExplanationCard
                    title="I tuoi eroi più forti"
                    description="Questi sono gli eroi con cui hai le migliori prestazioni. Considera di selezionarli quando possibile per massimizzare le tue possibilità di vittoria."
                    timeRange="Tutte le partite disponibili"
                  />
                </div>

                {/* Top 5 più giocati */}
                <div className="rounded-lg border border-neutral-800 p-4">
                  <h2 className="mb-3 text-sm text-neutral-300">
                    Top 5 eroi più giocati
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-neutral-900/60 text-neutral-300">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Eroe
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Partite
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Winrate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {heroPoolKPI.top5ByMatches.map((h) => {
                          const name = getHeroName(h.heroId)
                          const icon = getHeroIconUrl(h.heroId)
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
                              <td className="px-3 py-2">
                                <span
                                  className={
                                    h.winRate >= 50
                                      ? 'text-green-400'
                                      : 'text-red-400'
                                  }
                                >
                                  {h.winRate}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <ExplanationCard
                    title="I tuoi eroi preferiti"
                    description="Questi sono gli eroi che giochi più spesso. Se il winrate è buono, continua a usarli. Se è basso, considera di ampliare il tuo pool o migliorare con questi eroi."
                    timeRange="Tutte le partite disponibili"
                  />
                </div>
              </div>
            )}

          {/* Hero Pool Matrix */}
          {heroPoolKPI && heroPoolKPI.heroes.length > 0 && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Hero Pool Matrix
              </h2>
              <HeroPoolMatrix
                heroes={heroPoolKPI.heroes.map((h) => ({
                  heroId: h.heroId,
                  matches: h.matches,
                  winRate: h.winRate,
                  kdaAvg: h.kdaAvg,
                }))}
              />
              <ExplanationCard
                title="Come leggere la Hero Pool Matrix"
                description="Il grafico mostra la relazione tra frequenza di utilizzo (asse X) e performance (asse Y - winrate). I quadranti identificano: Comfort Picks (alto uso, alta performance), High Winrate/Low Usage (poco usati ma performanti), Overused/Underperforming (usati spesso ma con bassa performance), Unexplored (poco usati e bassa performance)."
                timeRange="Tutte le partite disponibili"
                interpretation="Usa questo grafico per identificare quali eroi dovresti giocare di più (High Winrate) e quali meno (Overused)."
              />
            </div>
          )}

          {/* Grafico comparativo winrate e KDA */}
          {heroPoolKPI && heroPoolKPI.top5ByMatches.length > 0 && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Confronto winrate e KDA dei 5 eroi principali
              </h2>
              <BarChart
                data={heroPoolKPI.top5ByMatches.map((h) => {
                  const hero = heroPoolKPI.heroes.find(
                    (he) => he.heroId === h.heroId,
                  )
                  return {
                    label: getHeroName(h.heroId),
                    value: h.winRate,
                    color: h.winRate >= 50 ? '#22c55e' : '#ef4444',
                  }
                })}
              />
              <ExplanationCard
                title="Come leggere questo grafico"
                description="Il grafico mostra il winrate dei tuoi 5 eroi più giocati. Eroi verdi hanno winrate positivo, rossi negativo. Usa queste informazioni per decidere quali eroi selezionare nel prossimo match."
                timeRange="Tutte le partite disponibili"
                interpretation="Se molti eroi sono rossi, considera di ampliare il tuo pool o migliorare con gli eroi attuali."
              />
            </div>
          )}

          {/* Indicatori per eroe - tabella estesa */}
          {heroPoolKPI && heroPoolKPI.heroes.length > 0 && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-3 text-sm text-neutral-300">
                Indicatori Dettagliati per Eroe
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-900/60 text-neutral-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Eroe</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Partite
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Winrate
                      </th>
                      <th className="px-3 py-2 text-left font-medium">KDA</th>
                      <th className="px-3 py-2 text-left font-medium">GPM</th>
                      <th className="px-3 py-2 text-left font-medium">XPM</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Ruolo/Lane
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {heroPoolKPI.heroes
                      .sort((a, b) => b.matches - a.matches)
                      .map((h) => {
                        const icon = getHeroIconUrl(h.heroId)
                        const name = getHeroName(h.heroId)
                        return (
                          <tr
                            key={h.heroId}
                            className="border-t border-neutral-800 hover:bg-neutral-900/40"
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
                            <td className="px-3 py-2">
                              <span
                                className={
                                  h.winRate >= 60
                                    ? 'text-green-400'
                                    : h.winRate < 45
                                      ? 'text-red-400'
                                      : 'text-neutral-300'
                                }
                              >
                                {h.winRate}%
                              </span>
                            </td>
                            <td className="px-3 py-2">{h.kdaAvg.toFixed(2)}</td>
                            <td className="px-3 py-2">
                              {h.avgGpm > 0 ? Math.round(h.avgGpm) : 'N/D'}
                            </td>
                            <td className="px-3 py-2">
                              {h.avgXpm > 0 ? Math.round(h.avgXpm) : 'N/D'}
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs text-neutral-400">
                                {h.primaryRole || 'N/D'} /{' '}
                                {h.primaryLane || 'N/D'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabella per-eroe */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm text-neutral-300">
              Performance per eroe
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-900/60 text-neutral-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Eroe</th>
                    <th
                      className="cursor-pointer px-3 py-2 text-left font-medium"
                      onClick={() => toggleSort('matches')}
                      title="Ordina per partite"
                    >
                      Partite{' '}
                      {sortBy === 'matches'
                        ? sortDir === 'desc'
                          ? '↓'
                          : '↑'
                        : ''}
                    </th>
                    <th
                      className="cursor-pointer px-3 py-2 text-left font-medium"
                      onClick={() => toggleSort('winrate')}
                      title="Ordina per winrate"
                    >
                      Winrate{' '}
                      {sortBy === 'winrate'
                        ? sortDir === 'desc'
                          ? '↓'
                          : '↑'
                        : ''}
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      KDA medio
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Durata media (min)
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Dettagli
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((h) => (
                    <tr key={h.heroId} className="border-t border-neutral-800">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {h.heroImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={h.heroImageUrl}
                              alt={h.heroName}
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
                              {h.heroName.charAt(0)}
                            </div>
                          )}
                          <span>{h.heroName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{h.matches}</td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            h.winrate >= 60
                              ? 'text-green-400'
                              : h.winrate < 45
                                ? 'text-red-400'
                                : 'text-neutral-300'
                          }
                        >
                          {h.winrate}%
                        </span>
                      </td>
                      <td className="px-3 py-2">{h.avgKda}</td>
                      <td className="px-3 py-2">{h.avgDurationMinutes}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/dashboard/matches?playerId=${playerId}&heroId=${h.heroId}`}
                          className="text-blue-400 hover:underline"
                        >
                          Vedi partite
                        </Link>
                      </td>
                    </tr>
                  ))}
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
