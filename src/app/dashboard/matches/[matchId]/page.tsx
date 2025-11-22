'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ExplanationCard from '@/components/charts/ExplanationCard'
import BarChart from '@/components/charts/BarChart'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'
import {
  formatNumberOrNA,
  formatPercentageOrNA,
  isValueMissing,
} from '@/utils/dotaFormatting'
import { FZTH_COLOR_USAGE } from '@/utils/fzthColors'
import SkeletonLoader, {
  SkeletonGrid,
  SkeletonChart,
} from '@/components/ui/SkeletonLoader'
import { getHeroName, getHeroIconUrl } from '@/lib/dotaHeroes'

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
  const [advancedKPI, setAdvancedKPI] =
    useState<DotaPlayerMatchAnalysis | null>(null)
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

  // Carica KPI avanzati da dota_player_match_analysis via route /api/dota/matches/[matchId]/players/[accountId]/analysis
  useEffect(() => {
    let active = true
    async function loadAdvancedKPI() {
      if (!matchId || !playerId) {
        console.log(
          '[DASHBOARD-MATCH] Missing matchId or playerId, skipping advanced KPI load',
        )
        return
      }

      try {
        setKpiLoading(true)
        console.log(
          '[DASHBOARD-MATCH] Loading advanced KPI from analysis route',
          { matchId, playerId },
        )

        const res = await fetch(
          `/api/dota/matches/${matchId}/players/${playerId}/analysis`,
          { cache: 'no-store' },
        )

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          console.error('[DASHBOARD-MATCH] Advanced KPI API error', {
            status: res.status,
            error: msg?.error,
          })
          // Non bloccare il rendering se l'analisi avanzata fallisce
          return
        }

        const kpi: DotaPlayerMatchAnalysis = await res.json()

        // Log valori ricevuti dalla fetch (solo Tier 1)
        console.log(
          '[DASHBOARD-MATCH] Advanced KPI received from API (Tier 1 only)',
          {
            matchId: kpi.matchId,
            accountId: kpi.accountId,
            rolePosition: kpi.rolePosition,
            killsEarly: kpi.killDistribution.early,
            killsMid: kpi.killDistribution.mid,
            killsLate: kpi.killDistribution.late,
          },
        )

        if (active) {
          setAdvancedKPI(kpi)
          // Log valori salvati nello stato (solo Tier 1)
          console.log(
            '[DASHBOARD-MATCH] Advanced KPI saved to state (Tier 1 only)',
            {
              killsEarly: kpi.killDistribution.early,
              killsMid: kpi.killDistribution.mid,
              killsLate: kpi.killDistribution.late,
            },
          )
        }
      } catch (e: any) {
        console.error('[DASHBOARD-MATCH] Error loading advanced match KPI:', e)
        // Non bloccare il rendering se l'analisi avanzata fallisce
        // Set advancedKPI to null per evitare rendering con dati parziali
        if (active) setAdvancedKPI(null)
      } finally {
        // SEMPRE eseguito: garantisce che loading non resti bloccato
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

  // Log di debug: mostra advancedKPI ogni volta che cambia (solo Tier 1)
  useEffect(() => {
    if (advancedKPI) {
      console.log('[D2-FRONT] Advanced KPI (Tier 1 only):', {
        matchId: advancedKPI.matchId,
        accountId: advancedKPI.accountId,
        rolePosition: advancedKPI.rolePosition,
        killDistribution: advancedKPI.killDistribution,
      })
    }
  }, [advancedKPI])

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

      {/* Loading state con skeleton elegante - transizione smooth */}
      {loading && (
        <div className="space-y-6 duration-300 animate-in fade-in">
          {/* Header skeleton */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
            <SkeletonLoader variant="text" className="mb-2 w-1/3" />
            <SkeletonLoader variant="text" className="w-1/4" />
          </div>

          {/* KPI Cards skeleton */}
          <SkeletonGrid cols={3} />

          {/* Charts skeleton */}
          <SkeletonChart />
          <SkeletonChart />
        </div>
      )}
      {error && (
        <div className="text-red-400">
          Errore nel caricamento del dettaglio partita: {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Header riorganizzato con badge risultato e pulsante Analisi completa */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      data.match.radiantWin
                        ? 'bg-green-900/60 text-green-300'
                        : 'bg-red-900/60 text-red-300'
                    }`}
                  >
                    {resultLabel}
                  </span>
                  <h1 className="text-2xl font-semibold text-neutral-100">
                    Partita #{data.match.matchId}
                  </h1>
                </div>
                <p className="mb-2 text-sm text-neutral-400">
                  Analisi FZTH – Player {playerId} –{' '}
                  {new Date(data.match.startTime).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  – Durata {minutes(data.match.durationSeconds)} min
                </p>
                <div className="flex items-center gap-3">
                  {(() => {
                    const heroName = getHeroName(data.player.heroId)
                    const heroIcon = getHeroIconUrl(data.player.heroId)
                    return (
                      <div className="flex items-center gap-2">
                        {heroIcon && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={heroIcon}
                            alt={heroName}
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
                        )}
                        <span className="text-sm text-neutral-300">
                          {heroName}
                        </span>
                      </div>
                    )
                  })()}
                  <span className="text-xs text-neutral-500">•</span>
                  <span className="text-xs text-neutral-400">
                    {advancedKPI
                      ? `Pos ${advancedKPI.rolePosition} (${
                          advancedKPI.rolePosition === 1
                            ? 'Carry'
                            : advancedKPI.rolePosition === 2
                              ? 'Mid'
                              : advancedKPI.rolePosition === 3
                                ? 'Offlane'
                                : advancedKPI.rolePosition === 4
                                  ? 'Soft Support'
                                  : 'Hard Support'
                        })`
                      : data.player.role
                        ? data.player.role
                        : data.player.lane
                          ? `Lane: ${data.player.lane}`
                          : 'Ruolo non disponibile'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dota/matches/${data.match.matchId}/players/${playerId}`}
                  className="rounded-md border border-blue-600/50 bg-blue-950/30 px-4 py-2 text-sm font-medium text-blue-300 transition-all hover:border-blue-500 hover:bg-blue-950/50 hover:text-blue-200"
                >
                  Analisi completa FZTH →
                </Link>
              </div>
            </div>
          </div>

          {/* SEZIONE 1: KPI Principali - 4 card */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: KDA & Impatto */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                KDA & Impatto
              </div>
              <div className="mb-2 text-2xl font-bold text-neutral-100">
                {data.player.kills} / {data.player.deaths} /{' '}
                {data.player.assists}
              </div>
              <div className="mb-1 text-xs text-neutral-400">KDA Ratio</div>
              <div className="mb-3 text-lg font-semibold text-neutral-200">
                {data.player.kda.toFixed(2)}
              </div>
              {/* Kill Participation - se disponibile team kills */}
              {(() => {
                // Calcolo semplificato: se abbiamo kills+assists possiamo mostrare un indicatore
                const totalKills = data.player.kills + data.player.assists
                return totalKills > 0 ? (
                  <div className="border-t border-neutral-800 pt-2 text-xs text-neutral-500">
                    Partecipazione: {totalKills} kill+assist
                  </div>
                ) : null
              })()}
            </div>

            {/* Card 2: Farm */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Farm
              </div>
              <div className="mb-2 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-neutral-400">GPM:</span>
                  <span className="text-xl font-bold text-neutral-100">
                    {formatNumberOrNA(data.player.gpm)}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-neutral-400">XPM:</span>
                  <span className="text-xl font-bold text-neutral-100">
                    {formatNumberOrNA(data.player.xpm)}
                  </span>
                </div>
              </div>
              <div className="mt-3 border-t border-neutral-800 pt-2 text-xs text-neutral-400">
                CS / Denies
              </div>
              <div className="text-sm font-semibold text-neutral-200">
                {formatNumberOrNA(data.player.lastHits)} /{' '}
                {formatNumberOrNA(data.player.denies)}
              </div>
            </div>

            {/* Card 3: Sopravvivenza */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Sopravvivenza
              </div>
              <div className="mb-2 text-2xl font-bold text-neutral-100">
                {data.player.deaths}
              </div>
              <div className="mb-1 text-xs text-neutral-400">Morti totali</div>
              {(() => {
                const durationMinutes = minutes(data.match.durationSeconds)
                const deathsPerMinute =
                  durationMinutes > 0 ? data.player.deaths / durationMinutes : 0
                let safetyLabel = 'Media'
                if (deathsPerMinute < 0.1) safetyLabel = 'Alta'
                else if (deathsPerMinute > 0.2) safetyLabel = 'Bassa'

                return (
                  <div className="mt-3 border-t border-neutral-800 pt-2">
                    <div className="text-xs text-neutral-400">Sicurezza</div>
                    <div
                      className={`text-sm font-semibold ${
                        safetyLabel === 'Alta'
                          ? 'text-green-400'
                          : safetyLabel === 'Bassa'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                      }`}
                    >
                      {safetyLabel}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Card 4: Obiettivi */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Obiettivi
              </div>
              <div className="text-sm text-neutral-500">
                Dati obiettivi non disponibili (in arrivo in una versione
                futura)
              </div>
            </div>
          </div>

          {/* SEZIONE 2: Gold Difference Timeline - grafico migliorato */}
          {data.timeline.goldDiffSeries &&
          data.timeline.goldDiffSeries.length > 0 ? (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-neutral-200">
                Timeline Gold Difference
              </h2>
              <div className="mb-4 h-[260px]">
                <SparkLine points={data.timeline.goldDiffSeries} />
              </div>
              <ExplanationCard
                title="Gold Difference Timeline"
                description="Mostra la differenza di gold tra il tuo team e il nemico nel tempo. Valori positivi (verde) indicano vantaggio economico, valori negativi (rosso) indicano svantaggio."
                timeRange="Durata della partita"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-neutral-200">
                Timeline Gold Difference
              </h2>
              <div className="flex h-[260px] items-center justify-center text-sm text-neutral-500">
                Timeline gold non disponibile per questa partita.
              </div>
            </div>
          )}

          {/* SEZIONE 3: Kills by Interval - grafico */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-neutral-200">
              Kills per Intervallo (10 min)
            </h2>
            <div className="mb-4 h-[240px]">
              <Bars data={data.timeline.killsByInterval} />
            </div>
            <ExplanationCard
              title="Kills per Intervallo"
              description="Mostra quanti kill ha fatto il tuo team (verde acqua) vs il nemico (rosso) in ogni intervallo di 10 minuti. Aiuta a capire quando il team ha dominato."
              timeRange="Durata della partita"
            />
          </div>

          {/* SEZIONE 4: Advanced KPI - con loading skeleton elegante */}
          {kpiLoading && (
            <div className="space-y-6 duration-300 animate-in fade-in">
              {/* Header skeleton */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <SkeletonLoader variant="text" className="w-1/4" />
              </div>

              {/* Kill Distribution skeleton (Tier 1) */}
              <SkeletonChart />
            </div>
          )}
          {!kpiLoading && advancedKPI && (
            <div className="space-y-6">
              {/* Header Advanced KPI */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-200">
                    Analisi Avanzata FZTH
                  </h2>
                  <Link
                    href={`/dota/matches/${matchId}/players/${playerId}`}
                    className="text-xs text-teal-400 hover:text-teal-300 hover:underline"
                  >
                    Vedi analisi completa →
                  </Link>
                </div>
              </div>

              {/* SEZIONE 5: Kill Distribution per fase (TIER 1 - garantito da kills_log) */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-2 text-base font-semibold text-neutral-200">
                  Kill Distribution per Fase
                </h3>
                <p className="mb-4 text-xs text-neutral-400">
                  Distribuzione delle tue kill nelle fasi di gioco.
                </p>

                {/* Grafico Kill Distribution - layout compatto */}
                <div className="mb-4 h-[180px]">
                  <BarChart
                    data={[
                      {
                        label: 'Early',
                        value: advancedKPI.killDistribution.early,
                        color: '#22c55e', // Green
                      },
                      {
                        label: 'Mid',
                        value: advancedKPI.killDistribution.mid,
                        color: '#f59e0b', // Orange
                      },
                      {
                        label: 'Late',
                        value: advancedKPI.killDistribution.late,
                        color: '#ef4444', // Red
                      },
                    ]}
                    width={560}
                    height={180}
                  />
                </div>

                {/* Cards Kill Distribution */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-3 text-center">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-green-300">
                      Early
                    </div>
                    <div className="text-xl font-bold text-green-200">
                      {advancedKPI.killDistribution.early}
                    </div>
                    <div className="mt-1 text-xs text-green-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.killPercentageDistribution.early,
                        1,
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-orange-800/50 bg-orange-900/20 p-3 text-center">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-orange-300">
                      Mid
                    </div>
                    <div className="text-xl font-bold text-orange-200">
                      {advancedKPI.killDistribution.mid}
                    </div>
                    <div className="mt-1 text-xs text-orange-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.killPercentageDistribution.mid,
                        1,
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-3 text-center">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-red-300">
                      Late
                    </div>
                    <div className="text-xl font-bold text-red-200">
                      {advancedKPI.killDistribution.late}
                    </div>
                    <div className="mt-1 text-xs text-red-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.killPercentageDistribution.late,
                        1,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEZIONE 6: Insight Match (regole determinate da dati Tier-1) */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-4 text-base font-semibold text-neutral-200">
                  Insight Match
                </h3>
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  {(() => {
                    const insights: string[] = []
                    const won = data.match.radiantWin
                    const kda = data.player.kda ?? 0
                    const gpm = data.player.gpm ?? 0
                    const deaths = data.player.deaths
                    const durationMinutes = minutes(data.match.durationSeconds)

                    // Analizza gold diff timeline per rimonte/vantaggi sprecati
                    const goldTimeline = data.timeline.goldDiffSeries || []
                    let earlyGoldLead = 0
                    let midGoldDiff = 0
                    if (goldTimeline.length > 0) {
                      // Gold diff a 10 minuti (early)
                      const earlyPoint = goldTimeline.find(
                        (p) => p.minute >= 10,
                      )
                      if (earlyPoint) earlyGoldLead = earlyPoint.goldDiff

                      // Gold diff a metà partita (mid)
                      const midPoint = goldTimeline.find(
                        (p) => p.minute >= durationMinutes / 2,
                      )
                      if (midPoint) midGoldDiff = midPoint.goldDiff
                    }

                    // Regole per partita persa
                    if (!won) {
                      // Regola 1: Prestazioni personali buone ma partita persa
                      if (gpm >= 350 && kda >= 1.5 && deaths >= 5) {
                        insights.push(
                          'Prestazioni personali buone ma partita persa: farm sopra la media, troppe morti. Lavora sul posizionamento e sulla sopravvivenza.',
                        )
                      }
                      // Regola 2: Vantaggio early sprecato
                      else if (earlyGoldLead > 2000 && midGoldDiff < 0) {
                        const minuteLost = goldTimeline.find(
                          (p) => p.goldDiff < 0,
                        )?.minute
                        insights.push(
                          `Vantaggio early sprecato: buon early game ma gold diff negativa dal minuto ${
                            minuteLost || 'X'
                          }. Focus su macro e chiusura partita.`,
                        )
                      }
                      // Regola 3: KDA basso
                      else if (kda < 1.0) {
                        insights.push(
                          `KDA basso: ${kda.toFixed(
                            2,
                          )}. Migliora il posizionamento e la partecipazione ai fight.`,
                        )
                      }
                      // Regola 4: Farm insufficiente
                      else if (gpm < 300) {
                        insights.push(
                          `Farming insufficiente: ${gpm} GPM. Focus su last hit e farm pattern.`,
                        )
                      }
                      // Regola 5: Troppe morti
                      else if (deaths >= 8) {
                        insights.push(
                          `Troppe morti: ${deaths}. Migliora il posizionamento e la mappa awareness.`,
                        )
                      }
                    } else {
                      // Regole per partita vinta
                      // Regola 1: Rimonta
                      if (goldTimeline.length > 0 && midGoldDiff < -1000) {
                        insights.push(
                          'Ottima capacità di rimonta: partita recuperata nonostante svantaggio di gold a metà game.',
                        )
                      }
                      // Regola 2: KDA eccellente
                      if (kda >= 2.5) {
                        insights.push(
                          `Ottimo KDA: ${kda.toFixed(
                            2,
                          )}. Eccellente performance nei fight.`,
                        )
                      }
                      // Regola 3: Farm efficiente
                      if (gpm >= 450) {
                        insights.push(
                          `Farming efficiente: ${gpm} GPM. Ottima gestione delle risorse.`,
                        )
                      }
                    }

                    // Se nessuna regola scatta, mostra messaggio generico
                    if (insights.length === 0) {
                      insights.push(
                        'Analizza i KPI principali per identificare aree di miglioramento o punti di forza.',
                      )
                    }

                    return (
                      <ul className="space-y-2 text-xs text-neutral-300">
                        {insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-0.5 text-blue-400">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  })()}
                </div>
                <ExplanationCard
                  title="Come usare questa analisi"
                  description="Gli insight sono generati automaticamente basandosi sui dati Tier-1 della partita. Usa queste informazioni per migliorare nelle prossime partite."
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
  const width = 700
  const height = 200

  if (!points || points.length === 0) {
    return <div className="text-sm text-neutral-500">Dati non disponibili</div>
  }

  const minX = 0
  const maxX = points[points.length - 1]?.minute || 1
  const minY = Math.min(...points.map((p) => p.goldDiff), 0)
  const maxY = Math.max(...points.map((p) => p.goldDiff), 0)
  const rangeY = maxY - minY || 1

  const scaleX = (m: number) =>
    ((m - minX) / (maxX - minX || 1)) * (width - 80) + 40
  const scaleY = (g: number) =>
    height - 40 - ((g - minY) / rangeY) * (height - 60)

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${scaleX(p.minute)} ${scaleY(p.goldDiff)}`,
    )
    .join(' ')

  // Tick marks every 5 or 10 minutes
  const tickInterval = maxX > 50 ? 10 : 5
  const ticks = []
  for (let i = 0; i <= maxX; i += tickInterval) {
    ticks.push(i)
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="max-w-full overflow-hidden"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background grid lines */}
      <defs>
        <pattern
          id="grid-gold"
          width="40"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-gold)" />

      {/* Zero line - evidenziata */}
      <line
        x1="40"
        y1={scaleY(0)}
        x2={width - 40}
        y2={scaleY(0)}
        stroke="#6b7280"
        strokeOpacity="0.6"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <text
        x={width - 50}
        y={scaleY(0) - 5}
        fontSize="9"
        fill="#9ca3af"
        textAnchor="end"
      >
        0
      </text>

      {/* X-axis ticks (every 5 or 10 minutes) */}
      {ticks.map((tick) => {
        const x = scaleX(tick)
        return (
          <g key={`tick-${tick}`}>
            <line
              x1={x}
              y1={height - 40}
              x2={x}
              y2={height - 35}
              stroke="#6b7280"
              strokeWidth="1"
            />
            <text
              x={x}
              y={height - 25}
              fontSize="9"
              fill="#9ca3af"
              textAnchor="middle"
            >
              {tick}m
            </text>
          </g>
        )
      })}

      {/* Data line */}
      <path
        d={path}
        fill="none"
        stroke={
          points[points.length - 1]?.goldDiff >= 0 ? '#22c55e' : '#ef4444'
        }
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points with tooltips */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={scaleX(p.minute)}
            cy={scaleY(p.goldDiff)}
            r="4"
            fill={p.goldDiff >= 0 ? '#22c55e' : '#ef4444'}
            stroke="#1f2937"
            strokeWidth="1.5"
            className="cursor-pointer"
          >
            <title>
              Minuto {p.minute}: {p.goldDiff >= 0 ? '+' : ''}
              {p.goldDiff.toLocaleString()} gold diff
            </title>
          </circle>
        </g>
      ))}

      {/* Y-axis label */}
      <text
        x={15}
        y={height / 2}
        fontSize="10"
        fill="#9ca3af"
        textAnchor="middle"
        transform={`rotate(-90, 15, ${height / 2})`}
        className="font-medium"
      >
        Gold Diff
      </text>
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
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="max-w-full overflow-hidden"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Legend */}
      <g>
        <rect x={20} y={10} width="12" height="12" fill="#14b8a6" rx="2" />
        <text
          x={36}
          y={19}
          fontSize="10"
          fill="#d4d4d8"
          className="font-medium"
        >
          Team
        </text>
        <rect x={90} y={10} width="12" height="12" fill="#ef4444" rx="2" />
        <text
          x={106}
          y={19}
          fontSize="10"
          fill="#d4d4d8"
          className="font-medium"
        >
          Enemy
        </text>
      </g>

      {/* Bars */}
      {data.map((d, idx) => {
        const x = 20 + idx * (barGroupWidth + gap)
        const teamH = scaleY(d.teamKills)
        const enemyH = scaleY(d.enemyKills)
        const maxH = Math.max(teamH, enemyH, 5) // Minimum height for visibility

        return (
          <g key={idx}>
            {/* Team kills bar */}
            <rect
              x={x}
              y={height - Math.max(teamH, 5) - 25}
              width="14"
              height={Math.max(teamH, 5)}
              fill="#14b8a6"
              rx="2"
              opacity={d.teamKills > 0 ? 1 : 0.3}
            >
              <title>Team: {d.teamKills} kills</title>
            </rect>

            {/* Enemy kills bar */}
            <rect
              x={x + 16}
              y={height - Math.max(enemyH, 5) - 25}
              width="14"
              height={Math.max(enemyH, 5)}
              fill="#ef4444"
              rx="2"
              opacity={d.enemyKills > 0 ? 1 : 0.3}
            >
              <title>Enemy: {d.enemyKills} kills</title>
            </rect>

            {/* Interval label */}
            <text
              x={x + 7}
              y={height - 5}
              fontSize="9"
              fill="#71717a"
              textAnchor="middle"
              className="font-medium"
            >
              {d.minuteFrom}-{d.minuteTo}m
            </text>

            {/* Value labels */}
            {d.teamKills > 0 && (
              <text
                x={x + 7}
                y={height - Math.max(teamH, 5) - 30}
                fontSize="8"
                fill="#14b8a6"
                textAnchor="middle"
                className="font-semibold"
              >
                {d.teamKills}
              </text>
            )}
            {d.enemyKills > 0 && (
              <text
                x={x + 23}
                y={height - Math.max(enemyH, 5) - 30}
                fontSize="8"
                fill="#ef4444"
                textAnchor="middle"
                className="font-semibold"
              >
                {d.enemyKills}
              </text>
            )}
          </g>
        )
      })}

      {/* Y-axis label */}
      <text
        x={15}
        y={height / 2}
        fontSize="10"
        fill="#71717a"
        textAnchor="middle"
        transform={`rotate(-90, 15, ${height / 2})`}
        className="font-medium"
      >
        Kills
      </text>
    </svg>
  )
}
