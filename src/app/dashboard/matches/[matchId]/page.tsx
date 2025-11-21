'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { AdvancedMatchKPI } from '@/services/dota/kpiService'

type MatchDetailResponse = {
  match: {
    matchId: number
    durationSeconds: number
    startTime: string
    radiantWin: boolean
    mode?: number
    lobbyType?: number
    avgRankTier?: number
  }
  player: {
    accountId: number
    heroId: number
    kills: number
    deaths: number
    assists: number
    lastHits?: number
    denies?: number
    gpm?: number
    xpm?: number
    heroDamage?: number
    towerDamage?: number
    heroHealing?: number
    kda: number
    lane?: string | number | null
    role?: string | null
  }
  timeline: {
    goldDiffSeries: Array<{ minute: number; goldDiff: number }>
    killsByInterval: Array<{
      minuteFrom: number
      minuteTo: number
      teamKills: number
      enemyKills: number
    }>
  }
}

function minutes(sec: number) {
  return Math.round(sec / 60)
}

export default function MatchDetailPage() {
  const params = useParams()
  const search = useSearchParams()
  const router = useRouter()

  const matchId = params?.matchId as string
  const playerId = search.get('playerId') || ''

  const [data, setData] = useState<MatchDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [advancedKPI, setAdvancedKPI] = useState<AdvancedMatchKPI | null>(null)
  const [kpiLoading, setKpiLoading] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    async function load() {
      if (!matchId || !playerId) {
        setError('Parametri mancanti')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const res = await fetch(
          `/api/matches/detail?matchId=${matchId}&playerId=${playerId}`,
          { cache: 'no-store' },
        )
        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }
        const json: MatchDetailResponse = await res.json()
        if (active) setData(json)
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
  }, [matchId, playerId])

  // Carica KPI avanzati
  useEffect(() => {
    let active = true
    async function loadAdvancedKPI() {
      if (!matchId || !playerId) return
      try {
        setKpiLoading(true)
        const res = await fetch(
          `/api/kpi/match-advanced?matchId=${matchId}&playerId=${playerId}`,
          { cache: 'no-store' },
        )
        if (res.ok) {
          const kpi: AdvancedMatchKPI | null = await res.json()
          if (active) setAdvancedKPI(kpi)
        }
      } catch (e) {
        console.error('Error loading advanced match KPI:', e)
      } finally {
        if (active) setKpiLoading(false)
      }
    }
    loadAdvancedKPI()
    return () => {
      active = false
    }
  }, [matchId, playerId])

  const resultLabel = useMemo(() => {
    if (!data) return null
    return data.match.radiantWin ? 'Vittoria' : 'Sconfitta'
  }, [data])

  return (
    <div className="space-y-6">
      <button
        onClick={() =>
          router.push(
            `/dashboard/matches${playerId ? `?playerId=${playerId}` : ''}`,
          )
        }
        className="text-sm text-neutral-300 hover:text-white"
      >
        ← Torna alle partite recenti
      </button>

      {loading && (
        <div className="text-neutral-400">Caricamento dati partita…</div>
      )}
      {error && (
        <div className="text-red-400">
          Errore nel caricamento del dettaglio partita: {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">
                Partita #{data.match.matchId}
              </h1>
              <p className="text-sm text-neutral-400">
                Dettaglio match da OpenDota (profilo FZTH)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-1 text-xs ${
                  data.match.radiantWin
                    ? 'bg-green-900 text-green-200'
                    : 'bg-red-900 text-red-200'
                }`}
              >
                {resultLabel}
              </span>
              <span className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-300">
                Durata: {minutes(data.match.durationSeconds)} min
              </span>
              <span className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-300">
                {new Date(data.match.startTime).toLocaleString('it-IT')}
              </span>
              <span className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-300">
                Eroe ID: {data.player.heroId}
              </span>
            </div>
          </div>

          {/* KPI Card */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-xs text-neutral-400">K/D/A</div>
              <div className="text-xl font-semibold">
                {data.player.kills} / {data.player.deaths} /{' '}
                {data.player.assists}
              </div>
              <div className="mt-2 text-xs text-neutral-400">KDA</div>
              <div className="text-sm">{data.player.kda.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-xs text-neutral-400">CS</div>
              <div className="text-xl font-semibold">
                {data.player.lastHits ?? 0} / {data.player.denies ?? 0}
              </div>
              <div className="mt-2 text-xs text-neutral-400">GPM / XPM</div>
              <div className="text-sm">
                {data.player.gpm ?? 0} / {data.player.xpm ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-xs text-neutral-400">Danni</div>
              <div className="text-sm">Eroe: {data.player.heroDamage ?? 0}</div>
              <div className="text-sm">
                Torri: {data.player.towerDamage ?? 0}
              </div>
              <div className="text-sm">
                Cura: {data.player.heroHealing ?? 0}
              </div>
            </div>
          </div>

          {/* Charts (SVG lightweight) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="mb-2 text-sm text-neutral-300">
                Gold Difference nel tempo
              </div>
              <SparkLine points={data.timeline.goldDiffSeries} />
              <ExplanationCard
                title="Cosa mostra il Gold Difference"
                description="Il grafico mostra la differenza di gold tra il tuo team e il nemico nel tempo. Valori positivi indicano vantaggio economico."
                timeRange="Durata della partita"
              />
            </div>
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="mb-2 text-sm text-neutral-300">
                Kills per intervallo (10 min)
              </div>
              <Bars data={data.timeline.killsByInterval} />
              <ExplanationCard
                title="Kills per intervallo"
                description="Mostra quanti kill ha fatto il tuo team (verde) vs il nemico (rosso) in ogni intervallo di 10 minuti. Aiuta a capire quando il team ha dominato."
                timeRange="Durata della partita"
              />
            </div>
          </div>

          {/* KPI avanzati */}
          {advancedKPI && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-4 text-lg font-semibold text-neutral-200">
                Analisi Avanzata Match
              </h2>

              {/* Timeline avanzata */}
              {advancedKPI.goldTimeline.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm text-neutral-300">
                    Timeline Gold e XP
                  </h3>
                  <div className="text-xs text-neutral-400">
                    Dati timeline disponibili per analisi dettagliata
                  </div>
                </div>
              )}

              {/* Item build */}
              {advancedKPI.itemBuild.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm text-neutral-300">Item Build</h3>
                  <div className="text-xs text-neutral-400">
                    {advancedKPI.itemBuild.length} item acquistati
                  </div>
                </div>
              )}

              {/* Vision stats */}
              {(advancedKPI.wardsPlaced !== undefined ||
                advancedKPI.observerWards !== undefined) && (
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {advancedKPI.wardsPlaced !== undefined && (
                    <div>
                      <div className="text-xs text-neutral-400">
                        Ward piazzate
                      </div>
                      <div className="text-lg font-semibold">
                        {advancedKPI.wardsPlaced}
                      </div>
                    </div>
                  )}
                  {advancedKPI.wardsDestroyed !== undefined && (
                    <div>
                      <div className="text-xs text-neutral-400">
                        Ward distrutte
                      </div>
                      <div className="text-lg font-semibold">
                        {advancedKPI.wardsDestroyed}
                      </div>
                    </div>
                  )}
                  {advancedKPI.observerWards !== undefined && (
                    <div>
                      <div className="text-xs text-neutral-400">
                        Observer wards
                      </div>
                      <div className="text-lg font-semibold">
                        {advancedKPI.observerWards}
                      </div>
                    </div>
                  )}
                  {advancedKPI.sentryWards !== undefined && (
                    <div>
                      <div className="text-xs text-neutral-400">
                        Sentry wards
                      </div>
                      <div className="text-lg font-semibold">
                        {advancedKPI.sentryWards}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fight participation */}
              {advancedKPI.fightParticipation !== undefined && (
                <div className="mb-6">
                  <div className="text-xs text-neutral-400">
                    Partecipazione ai fight
                  </div>
                  <div className="text-lg font-semibold">
                    {advancedKPI.fightParticipation.toFixed(1)}%
                  </div>
                </div>
              )}

              {/* Analisi risultato */}
              <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
                <h3 className="mb-2 text-sm font-medium text-neutral-200">
                  Analisi risultato partita
                </h3>
                <div className="text-xs text-neutral-300">
                  {data.match.radiantWin
                    ? 'Questa partita è stata vinta grazie a:'
                    : 'Questa partita è stata persa a causa di:'}
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-neutral-400">
                  {data.player.kda >= 2.0 && (
                    <li>Buon KDA ({data.player.kda.toFixed(2)})</li>
                  )}
                  {data.player.kda < 1.0 && (
                    <li>KDA basso ({data.player.kda.toFixed(2)})</li>
                  )}
                  {data.player.gpm && data.player.gpm >= 400 && (
                    <li>GPM alto ({data.player.gpm})</li>
                  )}
                  {data.player.gpm && data.player.gpm < 300 && (
                    <li>GPM basso ({data.player.gpm})</li>
                  )}
                  {data.player.heroDamage &&
                    data.player.heroDamage >= 15000 && (
                      <li>
                        Danni agli eroi alti (
                        {data.player.heroDamage.toLocaleString()})
                      </li>
                    )}
                  {data.player.towerDamage &&
                    data.player.towerDamage >= 2000 && (
                      <li>
                        Buon focus obiettivi (
                        {data.player.towerDamage.toLocaleString()})
                      </li>
                    )}
                </ul>
                <ExplanationCard
                  title="Come usare questa analisi"
                  description="I KPI chiave mostrano cosa ha funzionato o non ha funzionato in questa partita. Usa queste informazioni per migliorare nelle prossime partite."
                  timeRange="Partita singola"
                />
              </div>
            </div>
          )}
        </div>
      )}
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

function Bars({
  data,
}: {
  data: Array<{
    minuteFrom: number
    minuteTo: number
    teamKills: number
    enemyKills: number
  }>
}) {
  const width = 560
  const height = 160
  const barGroupWidth = 34
  const gap = 16

  if (!data || data.length === 0) {
    return <div className="text-sm text-neutral-500">Dati non disponibili</div>
  }

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.teamKills, d.enemyKills)),
  )
  const scaleY = (v: number) => (v / maxVal) * (height - 30)

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, idx) => {
        const x = 20 + idx * (barGroupWidth + gap)
        const teamH = scaleY(d.teamKills)
        const enemyH = scaleY(d.enemyKills)
        return (
          <g key={idx}>
            <rect
              x={x}
              y={height - teamH - 10}
              width={12}
              height={teamH}
              fill="#22c55e"
            />
            <rect
              x={x + 14}
              y={height - enemyH - 10}
              width={12}
              height={enemyH}
              fill="#ef4444"
            />
            <text x={x} y={height} fontSize="9" fill="#9ca3af">
              {d.minuteFrom}-{d.minuteTo}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
