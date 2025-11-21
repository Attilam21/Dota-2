'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerIdFromSearchParams } from '@/lib/playerId'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { StyleOfPlayKPI } from '@/services/dota/kpiService'

type HistoryKpi = {
  totalMatches: number
  winrate: number
  avgKda: number
  bestWinStreak: number
  currentLevel?: number
  currentLevelTitle?: string
}
type WinratePoint = {
  period: string
  matches: number
  wins: number
  winrate: number
}
type PerfPoint = {
  matchId: number
  startTime: string
  kda: number
  performanceIndex: number
}
type LevelProg = {
  currentLevel: number
  currentXp: number
  nextLevelXp: number
  ratio: number
}
type Milestone = { date: string; type: string; label: string; details?: string }
type HistorySummaryResponse = {
  kpi: HistoryKpi
  winrateTrend: WinratePoint[]
  performanceTrend: PerfPoint[]
  levelProgression?: LevelProg
  milestones: Milestone[]
}

export default function ProgressionPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-neutral-400">
          Caricamento storico & progressione…
        </div>
      }
    >
      <ProgressionContent />
    </Suspense>
  )
}

function ProgressionContent(): React.JSX.Element {
  const searchParams = useSearchParams()
  const playerId = getPlayerIdFromSearchParams(searchParams)
  const [data, setData] = useState<HistorySummaryResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [styleKPI, setStyleKPI] = useState<StyleOfPlayKPI | null>(null)
  const [styleLoading, setStyleLoading] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/players/history?playerId=${playerId}`, {
          cache: 'no-store',
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || `HTTP ${res.status}`)
        }
        const j: HistorySummaryResponse = await res.json()
        if (!active) return
        setData(j)
      } catch (e: any) {
        console.error('History load error', e?.message ?? e)
        if (active) setError(e?.message ?? 'Errore storico')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [playerId])

  // Carica KPI stile di gioco
  useEffect(() => {
    let active = true
    async function loadStyleKPI() {
      if (!playerId) return
      try {
        setStyleLoading(true)
        const res = await fetch(
          `/api/kpi/style-of-play?playerId=${playerId}&limit=100`,
          { cache: 'no-store' },
        )
        if (res.ok) {
          const kpi: StyleOfPlayKPI = await res.json()
          if (active) setStyleKPI(kpi)
        }
      } catch (e) {
        console.error('Error loading style KPI:', e)
      } finally {
        if (active) setStyleLoading(false)
      }
    }
    loadStyleKPI()
    return () => {
      active = false
    }
  }, [playerId])

  const kpi = data?.kpi

  return (
    <div className="space-y-6 p-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold">Storico & Progressione</h1>
        <p className="text-sm text-neutral-400">
          Analisi storica e progressione FZTH (solo dati Supabase)
        </p>
      </div>

      {loading && (
        <div className="text-neutral-400">
          Caricamento storico & progressione…
        </div>
      )}
      {error && (
        <div className="text-red-400">Errore nel caricamento: {error}</div>
      )}

      {!loading && !error && (!data || data.kpi.totalMatches === 0) && (
        <div className="rounded-lg border border-neutral-800 p-6 text-neutral-300">
          Nessuna partita disponibile per costruire lo storico.
        </div>
      )}

      {!loading && !error && data && data.kpi.totalMatches > 0 && (
        <>
          {/* KPI sintetici */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <KpiCard
              label="Totale partite"
              value={`${kpi?.totalMatches ?? 0}`}
            />
            <KpiCard label="Winrate storico" value={`${kpi?.winrate ?? 0}%`} />
            <KpiCard label="KDA medio storico" value={`${kpi?.avgKda ?? 0}`} />
            <KpiCard
              label="Streak migliore"
              value={`${kpi?.bestWinStreak ?? 0}`}
            />
            <KpiCard
              label="Livello FZTH"
              value={
                kpi?.currentLevelTitle
                  ? `${kpi.currentLevel} – ${kpi.currentLevelTitle}`
                  : 'N/D'
              }
            />
          </div>

          {/* Trend temporali */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-2 text-sm text-neutral-300">
                Winrate nel tempo
              </h2>
              <LineMini
                points={data.winrateTrend.map((p, i) => ({
                  x: i + 1,
                  y: p.winrate,
                }))}
                label="WR%"
              />
              <div className="mt-2 text-xs text-neutral-400">
                Periodi: {data.winrateTrend.length} · Media {kpi?.winrate ?? 0}%
              </div>
            </div>
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-2 text-sm text-neutral-300">
                Performance (ultimi match)
              </h2>
              <DualLineMini
                primary={data.performanceTrend.map((p, i) => ({
                  x: i + 1,
                  y: p.performanceIndex,
                }))}
                secondary={data.performanceTrend.map((p, i) => ({
                  x: i + 1,
                  y: Math.round(p.kda * 10),
                }))}
                labelPrimary="Index"
                labelSecondary="KDA x10"
              />
            </div>
          </div>

          {/* Progressione livello */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm text-neutral-300">
              Progressione livello FZTH
            </h2>
            {data.levelProgression ? (
              <div>
                <div className="mb-1 text-sm text-neutral-300">
                  Livello attuale:{' '}
                  <span className="font-medium">
                    {data.levelProgression.currentLevel}
                  </span>
                </div>
                <div className="h-2 w-full rounded bg-neutral-900">
                  <div
                    className="h-2 rounded bg-blue-500"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          Math.round(data.levelProgression.ratio * 100),
                        ),
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  XP: {data.levelProgression.currentXp} /{' '}
                  {data.levelProgression.nextLevelXp}
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                Sistema di progressione in fase di inizializzazione. Dati
                disponibili dopo le prossime partite.
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-2 text-sm text-neutral-300">Milestone</h2>
            {data.milestones.length === 0 ? (
              <div className="text-xs text-neutral-500">
                Nessun evento significativo identificato.
              </div>
            ) : (
              <div className="space-y-2">
                {data.milestones.map((m, idx) => (
                  <div
                    key={`${m.date}-${m.type}-${idx}`}
                    className="flex items-center justify-between rounded bg-neutral-900/40 px-3 py-2"
                  >
                    <div className="text-xs text-neutral-400">{m.date}</div>
                    <div className="flex-1 px-3 text-sm text-neutral-200">
                      {m.label}
                    </div>
                    {m.details && (
                      <div className="text-xs text-neutral-400">
                        {m.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KPI Stile di gioco avanzati */}
          {styleKPI && (
            <>
              <div className="rounded-lg border border-neutral-800 p-4">
                <h2 className="mb-4 text-lg font-semibold text-neutral-200">
                  Analisi Stile di Gioco
                </h2>

                {/* Badge playstyle */}
                {styleKPI.playstyleBadges.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {styleKPI.playstyleBadges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-blue-900/40 px-3 py-1 text-xs text-blue-300"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {/* KPI Aggressività */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-neutral-800 p-4">
                    <div className="text-xs text-neutral-400">Kill/minuto</div>
                    <div className="text-xl font-semibold">
                      {styleKPI.killsPerMinute.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 p-4">
                    <div className="text-xs text-neutral-400">Morti/minuto</div>
                    <div className="text-xl font-semibold">
                      {styleKPI.deathsPerMinute.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 p-4">
                    <div className="text-xs text-neutral-400">Danni/minuto</div>
                    <div className="text-xl font-semibold">
                      {styleKPI.damagePerMinute > 0
                        ? styleKPI.damagePerMinute.toFixed(0)
                        : 'N/D'}
                    </div>
                  </div>
                </div>

                {/* Grafico KP% per match */}
                {styleKPI.fightParticipationSeries.length > 0 && (
                  <div className="mb-6 rounded-lg border border-neutral-800 p-4">
                    <h3 className="mb-3 text-sm text-neutral-300">
                      Partecipazione ai fight (KP%) per partita
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
                      title="Cosa misura il KP%"
                      description="Il KP% (Kill Participation) indica quanto partecipi ai fight del tuo team. Un KP% alto significa che sei presente agli scontri e contribuisci attivamente."
                      timeRange="Ultime 20 partite"
                      interpretation={
                        styleKPI.fightParticipation >= 50
                          ? 'Il tuo KP% è buono, sei presente ai fight.'
                          : 'Il tuo KP% è sotto 40%, probabilmente sei poco presente agli scontri. Cerca di partecipare di più ai fight del team.'
                      }
                    />
                  </div>
                )}

                {/* Grafico morti early */}
                {styleKPI.earlyDeathsSeries.length > 0 && (
                  <div className="mb-6 rounded-lg border border-neutral-800 p-4">
                    <h3 className="mb-3 text-sm text-neutral-300">
                      Morti early game (primi 10 minuti) per partita
                    </h3>
                    <BarChart
                      data={styleKPI.earlyDeathsSeries
                        .slice(0, 20)
                        .map((d) => ({
                          label: `M${d.matchId.toString().slice(-3)}`,
                          value: d.earlyDeaths,
                          color: d.earlyDeaths >= 2 ? '#ef4444' : '#22c55e',
                        }))}
                    />
                    <div className="mt-2 text-xs text-neutral-400">
                      Media morti early: {styleKPI.earlyDeathsAvg.toFixed(1)}
                    </div>
                    <ExplanationCard
                      title="Cosa misura le morti early"
                      description="Le morti nei primi 10 minuti indicano la stabilità dell'early game. Troppe morti early possono compromettere la partita."
                      timeRange="Ultime 20 partite"
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
                  <div className="mb-6 rounded-lg border border-neutral-800 p-4">
                    <h3 className="mb-3 text-sm text-neutral-300">
                      Efficienza Farming
                    </h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-xs text-neutral-400">
                          GPM medio
                        </div>
                        <div className="text-lg font-semibold">
                          {styleKPI.farmingEfficiency.avgGpm.toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">
                          XPM medio
                        </div>
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
                        <div className="text-xs text-neutral-400">
                          Denies/min
                        </div>
                        <div className="text-lg font-semibold">
                          {styleKPI.farmingEfficiency.avgDeniesPerMin.toFixed(
                            1,
                          )}
                        </div>
                      </div>
                    </div>
                    <ExplanationCard
                      title="Efficienza farming"
                      description="GPM e XPM indicano quanto guadagni gold e experience. LH/min e Denies/min mostrano la precisione nel farming."
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
                  <div className="mb-6 rounded-lg border border-neutral-800 p-4">
                    <h3 className="mb-3 text-sm text-neutral-300">
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
                      description="I danni alle torri e la partecipazione a Roshan indicano quanto ti concentri sugli obiettivi per chiudere le partite."
                      timeRange="Tutte le partite disponibili"
                      interpretation={
                        styleKPI.avgTowerDamage >= 2000
                          ? 'Hai un buon focus sugli obiettivi, continua a pushare le torri.'
                          : 'Concentrati di più sugli obiettivi per chiudere le partite più velocemente.'
                      }
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* CTA Coaching */}
          <div className="rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-300">
                Vuoi trasformare questo storico in un piano di miglioramento?
              </div>
              <a
                href="/dashboard/coaching"
                className="text-sm text-blue-400 hover:underline"
              >
                Vai al Coaching
              </a>
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

function LineMini({
  points,
  label,
}: {
  points: Array<{ x: number; y: number }>
  label: string
}) {
  const width = 560
  const height = 160
  if (!points || points.length === 0)
    return (
      <div className="text-sm text-neutral-500">
        Servono più partite per questo grafico
      </div>
    )
  const minX = Math.min(...points.map((p) => p.x))
  const maxX = Math.max(...points.map((p) => p.x))
  const minY = Math.min(...points.map((p) => p.y), 0)
  const maxY = Math.max(...points.map((p) => p.y), 0)
  const sx = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - 40) + 20
  const sy = (y: number) =>
    height - (((y - minY) / (maxY - minY || 1)) * (height - 30) + 15)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`)
    .join(' ')
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="text-blue-400"
    >
      <line
        x1="0"
        y1={sy(0)}
        x2={width}
        y2={sy(0)}
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
      <text x={20} y={15} fill="currentColor" fontSize="10">
        {label}
      </text>
    </svg>
  )
}

function DualLineMini({
  primary,
  secondary,
  labelPrimary,
  labelSecondary,
}: {
  primary: Array<{ x: number; y: number }>
  secondary: Array<{ x: number; y: number }>
  labelPrimary: string
  labelSecondary: string
}) {
  const width = 560
  const height = 160
  const allX = [...primary.map((p) => p.x), ...secondary.map((p) => p.x)]
  const allY = [...primary.map((p) => p.y), ...secondary.map((p) => p.y)]
  if (allX.length === 0)
    return (
      <div className="text-sm text-neutral-500">
        Servono più partite per questo grafico
      </div>
    )
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY, 0)
  const maxY = Math.max(...allY, 0)
  const sx = (x: number) =>
    ((x - minX) / (maxX - minX || 1)) * (width - 40) + 20
  const sy = (y: number) =>
    height - (((y - minY) / (maxY - minY || 1)) * (height - 30) + 15)
  const path1 = primary
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`)
    .join(' ')
  const path2 = secondary
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`)
    .join(' ')
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="text-neutral-300"
    >
      <line
        x1="0"
        y1={sy(0)}
        x2={width}
        y2={sy(0)}
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
      />
      <path d={path1} fill="none" stroke="#60a5fa" strokeWidth="2" />
      <path d={path2} fill="none" stroke="#f59e0b" strokeWidth="2" />
      <text x={20} y={15} fill="#60a5fa" fontSize="10">
        {labelPrimary}
      </text>
      <text x={100} y={15} fill="#f59e0b" fontSize="10">
        {labelSecondary}
      </text>
    </svg>
  )
}
