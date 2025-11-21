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
      avgGpm: overviewKPI?.avgGpm ?? 0,
      avgXpm: overviewKPI?.avgXpm ?? 0,
    }
  }, [rows, overviewKPI])

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

  // Trend prestazioni per grafico (ultime 10-20 partite)
  const trendData = useMemo(() => {
    if (!rows || rows.length === 0 || !overviewKPI) return []
    const last20 = rows.slice(0, 20).reverse() // cronologico crescente

    return last20.map((r, idx) => {
      const matchesUpToIdx = last20.slice(0, idx + 1)
      const wins = matchesUpToIdx.filter((m) => m.result === 'win').length
      const winrate =
        matchesUpToIdx.length > 0 ? (wins / matchesUpToIdx.length) * 100 : 0
      const avgKda =
        matchesUpToIdx.length > 0
          ? matchesUpToIdx.reduce((acc, m) => {
              const kda = (m.kills + m.assists) / Math.max(1, m.deaths)
              return acc + kda
            }, 0) / matchesUpToIdx.length
          : 0

      return {
        x: idx,
        winrate: Number(winrate.toFixed(1)),
        kda: Number(avgKda.toFixed(2)),
        gpm: overviewKPI.gpmSeries[idx]?.gpm || 0,
      }
    })
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
            return acc + (overviewKPI.gpmSeries[0]?.gpm || 400)
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
    <div className="space-y-8 p-6 text-white">
      {/* Header */}
      <div>
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
        <>
          {/* 🔷 BLOCCO 1 — HEADER & KPI */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6">
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {/* Nome giocatore */}
              <div className="col-span-2 md:col-span-1 lg:col-span-2">
                <div className="text-xs text-neutral-400">Giocatore</div>
                <div className="text-lg font-semibold">Player #{playerId}</div>
              </div>

              {/* Winrate ultime 20 */}
              <KpiCard
                label="Winrate (ultime 20)"
                value={last20Stats ? `${last20Stats.winRate}%` : 'N/D'}
              />

              {/* KDA medio */}
              <KpiCard
                label="KDA medio"
                value={last20Stats ? `${last20Stats.kdaAvg}` : 'N/D'}
              />

              {/* GPM medio */}
              <KpiCard
                label="GPM medio"
                value={
                  last20Stats && last20Stats.avgGpm > 0
                    ? `${Math.round(last20Stats.avgGpm)}`
                    : 'N/D'
                }
              />

              {/* XPM medio */}
              <KpiCard
                label="XPM medio"
                value={
                  last20Stats && last20Stats.avgXpm > 0
                    ? `${Math.round(last20Stats.avgXpm)}`
                    : 'N/D'
                }
              />

              {/* Stato forma */}
              {formStatus && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="text-xs text-neutral-400">Stato forma</div>
                  <div className="flex items-center gap-2">
                    {formStatus.trend === 'up' ? (
                      <>
                        <span className="text-lg">📈</span>
                        <span className="text-sm font-semibold text-green-400">
                          In crescita
                        </span>
                      </>
                    ) : formStatus.trend === 'down' ? (
                      <>
                        <span className="text-lg">📉</span>
                        <span className="text-sm font-semibold text-red-400">
                          In calo
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">➡️</span>
                        <span className="text-sm font-semibold text-neutral-400">
                          Stabile
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-500">
                    Ultimi 10: {formStatus.last10Wr}% vs Precedenti:{' '}
                    {formStatus.prev10Wr}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🔷 BLOCCO 2 — TREND PRESTAZIONI */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-200">
              Trend prestazioni recenti
            </h2>
            {trendData.length > 0 ? (
              <MultiLineChart
                data={trendData}
                lines={[
                  { key: 'winrate', color: '#22c55e', label: 'Winrate %' },
                  { key: 'kda', color: '#60a5fa', label: 'KDA' },
                  { key: 'gpm', color: '#f59e0b', label: 'GPM' },
                ]}
                width={800}
                height={300}
              />
            ) : (
              <div className="text-sm text-neutral-500">
                {kpiLoading
                  ? 'Caricamento dati trend...'
                  : 'Dati trend non disponibili'}
              </div>
            )}
          </div>

          {/* 🔷 BLOCCO 3 — HERO POOL SNAPSHOT */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-200">
                Hero Pool Snapshot
              </h2>
              <Link
                href="/dashboard/heroes"
                className="text-sm text-blue-400 hover:underline"
              >
                Vai a Hero Pool →
              </Link>
            </div>
            {heroSnap.length === 0 ? (
              <div className="text-sm text-neutral-500">
                Nessun dato disponibile
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {heroSnap.map((h) => {
                  const icon = getHeroIconUrl(h.heroId)
                  const name = getHeroName(h.heroId)
                  return (
                    <div
                      key={h.heroId}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        {icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={icon}
                            alt={name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded"
                            loading="lazy"
                            onError={(e) => {
                              ;(
                                e.currentTarget as HTMLImageElement
                              ).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-700 text-sm">
                            {name.charAt(0)}
                          </div>
                        )}
                        <span className="text-base font-medium">{name}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">KDA medio:</span>
                          <span className="font-semibold">
                            {h.kdaAvg.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Winrate:</span>
                          <span className="font-semibold text-green-400">
                            {h.winRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 🔷 BLOCCO 4 — INSIGHTS SINTETICI */}
          {insights && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Punto di forza */}
              {insights.strength && (
                <div className="rounded-lg border border-green-800 bg-green-900/20 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">💪</span>
                    <h3 className="text-sm font-semibold text-green-300">
                      Punto di forza
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-300">
                    {insights.strength}
                  </p>
                </div>
              )}

              {/* Punto debole */}
              {insights.weakness && (
                <div className="rounded-lg border border-red-800 bg-red-900/20 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <h3 className="text-sm font-semibold text-red-300">
                      Punto debole
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-300">
                    {insights.weakness}
                  </p>
                </div>
              )}

              {/* Suggerimento operativo */}
              <div className="rounded-lg border border-blue-800 bg-blue-900/20 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <h3 className="text-sm font-semibold text-blue-300">
                    Suggerimento operativo
                  </h3>
                </div>
                <p className="text-sm text-neutral-300">
                  {insights.suggestion}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Componente KPI Card uniforme
function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="mb-1 text-xs text-neutral-400">{label}</div>
      <div className="text-xl font-semibold text-neutral-200">{value}</div>
    </div>
  )
}
