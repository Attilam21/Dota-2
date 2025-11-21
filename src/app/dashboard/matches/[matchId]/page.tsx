'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ExplanationCard from '@/components/charts/ExplanationCard'
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

        // Log valori ricevuti dalla fetch
        console.log('[DASHBOARD-MATCH] Advanced KPI received from API', {
          matchId: kpi.matchId,
          accountId: kpi.accountId,
          rolePosition: kpi.rolePosition,
          totalGoldLost: kpi.deathCostSummary.totalGoldLost,
          totalXpLost: kpi.deathCostSummary.totalXpLost,
          totalCsLost: kpi.deathCostSummary.totalCsLost,
          killsEarly: kpi.killDistribution.early,
          killsMid: kpi.killDistribution.mid,
          killsLate: kpi.killDistribution.late,
          deathPctEarly: kpi.deathPercentageDistribution.early,
          deathPctMid: kpi.deathPercentageDistribution.mid,
          deathPctLate: kpi.deathPercentageDistribution.late,
          deathByRole: kpi.deathByRole,
          hasDeathEvents: !!kpi.deathEvents?.length,
          deathEventsCount: kpi.deathEvents?.length ?? 0,
        })

        if (active) {
          setAdvancedKPI(kpi)
          // Log valori salvati nello stato
          console.log('[DASHBOARD-MATCH] Advanced KPI saved to state', {
            totalGoldLost: kpi.deathCostSummary.totalGoldLost,
            killsEarly: kpi.killDistribution.early,
            deathPctEarly: kpi.deathPercentageDistribution.early,
          })
          // Log di debug principale richiesto
          console.log('[D2-FRONT]', 'advancedKPI:', kpi)
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

  // Log di debug: mostra advancedKPI ogni volta che cambia
  useEffect(() => {
    console.log('[D2-FRONT]', 'advancedKPI:', advancedKPI)
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

      {/* Loading state con skeleton elegante */}
      {loading && (
        <div className="space-y-6">
          <SkeletonLoader variant="card" height="4rem" />
          <SkeletonGrid cols={3} />
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
          {/* Header con branding FZTH light */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-neutral-100">
                  Partita #{data.match.matchId}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    data.match.radiantWin
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {resultLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Analisi avanzata FZTH • Match ID: {data.match.matchId} • Player:{' '}
                {playerId}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dota/matches/${data.match.matchId}/players/${playerId}`}
                className="rounded-md border border-neutral-700 bg-neutral-800/50 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-all hover:border-teal-500/50 hover:bg-teal-950/30 hover:text-teal-300"
              >
                📊 Analisi Completa
              </Link>
              <span className="rounded-md bg-neutral-800/50 px-2 py-1 text-xs text-neutral-400">
                {minutes(data.match.durationSeconds)}m
              </span>
              <span className="rounded-md bg-neutral-800/50 px-2 py-1 text-xs text-neutral-400">
                {new Date(data.match.startTime).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* SEZIONE 1: KDA + Indicatori base - sempre visibile */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                K/D/A
              </div>
              <div className="text-2xl font-bold text-neutral-100">
                {data.player.kills} / {data.player.deaths} /{' '}
                {data.player.assists}
              </div>
              <div className="mt-2 text-xs text-neutral-400">KDA Ratio</div>
              <div className="text-sm font-semibold text-neutral-200">
                {data.player.kda.toFixed(2)}
              </div>
              {advancedKPI && (
                <div className="mt-3 border-t border-neutral-800 pt-3 text-xs text-neutral-500">
                  Role:{' '}
                  {advancedKPI.rolePosition === 1
                    ? 'Pos 1 (Carry)'
                    : advancedKPI.rolePosition === 2
                      ? 'Pos 2 (Mid)'
                      : advancedKPI.rolePosition === 3
                        ? 'Pos 3 (Offlane)'
                        : advancedKPI.rolePosition === 4
                          ? 'Pos 4 (Soft Support)'
                          : advancedKPI.rolePosition === 5
                            ? 'Pos 5 (Hard Support)'
                            : `Pos ${advancedKPI.rolePosition}`}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Farm
              </div>
              <div className="mb-3 text-xl font-bold text-neutral-100">
                {formatNumberOrNA(data.player.lastHits)} /{' '}
                {formatNumberOrNA(data.player.denies)}
              </div>
              <div className="mt-2 text-xs text-neutral-400">GPM / XPM</div>
              <div className="text-sm font-semibold text-neutral-200">
                {formatNumberOrNA(data.player.gpm)} /{' '}
                {formatNumberOrNA(data.player.xpm)}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                Danni
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Eroe:</span>
                  <span className="font-semibold text-neutral-200">
                    {formatNumberOrNA(data.player.heroDamage)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Torri:</span>
                  <span className="font-semibold text-neutral-200">
                    {formatNumberOrNA(data.player.towerDamage)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Cura:</span>
                  <span className="font-semibold text-neutral-200">
                    {formatNumberOrNA(data.player.heroHealing)}
                  </span>
                </div>
              </div>
              {advancedKPI && (
                <div className="mt-3 border-t border-neutral-800 pt-3 text-xs">
                  <div className="mb-1 text-neutral-400">Costo Morti:</div>
                  <div className="text-yellow-300">
                    XP:{' '}
                    {formatNumberOrNA(advancedKPI.deathCostSummary.totalXpLost)}
                  </div>
                  <div className="text-orange-300">
                    CS:{' '}
                    {formatNumberOrNA(advancedKPI.deathCostSummary.totalCsLost)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEZIONE 2: Gold/XP/CS Timeline - grafico */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-neutral-200">
              Timeline Gold Difference
            </h2>
            <div className="mb-4 h-[240px]">
              <SparkLine points={data.timeline.goldDiffSeries} />
            </div>
            <ExplanationCard
              title="Gold Difference Timeline"
              description="Mostra la differenza di gold tra il tuo team e il nemico nel tempo. Valori positivi (verde) indicano vantaggio economico, valori negativi (rosso) indicano svantaggio."
              timeRange="Durata della partita"
            />
          </div>

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

          {/* SEZIONE 4: Advanced KPI - con loading skeleton */}
          {kpiLoading && (
            <div className="space-y-6">
              <SkeletonChart />
              <SkeletonGrid cols={3} />
              <SkeletonChart />
              <SkeletonGrid cols={5} />
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

              {/* SEZIONE 5: Death Distribution per fase */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-4 text-base font-semibold text-neutral-200">
                  Death Distribution per Fase
                </h3>
                <p className="mb-4 text-xs text-neutral-400">
                  Distribuzione delle morti nelle tre fasi (Early: 0-10min, Mid:
                  10-30min, Late: 30+min)
                </p>

                {/* Grafico Death Distribution */}
                <div className="mb-4 h-[200px]">
                  <Bars
                    data={[
                      {
                        minuteFrom: 0,
                        minuteTo: 10,
                        teamKills: 0,
                        enemyKills: advancedKPI.deathDistribution.early,
                      },
                      {
                        minuteFrom: 10,
                        minuteTo: 30,
                        teamKills: 0,
                        enemyKills: advancedKPI.deathDistribution.mid,
                      },
                      {
                        minuteFrom: 30,
                        minuteTo: 60,
                        teamKills: 0,
                        enemyKills: advancedKPI.deathDistribution.late,
                      },
                    ]}
                  />
                </div>

                {/* Cards Death Distribution */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-3 text-center">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-red-300">
                      Early
                    </div>
                    <div className="text-xl font-bold text-red-200">
                      {advancedKPI.deathDistribution.early}
                    </div>
                    <div className="mt-1 text-xs text-red-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.deathPercentageDistribution.early,
                        1,
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-orange-800/50 bg-orange-900/20 p-3 text-center">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-orange-300">
                      Mid
                    </div>
                    <div className="text-xl font-bold text-orange-200">
                      {advancedKPI.deathDistribution.mid}
                    </div>
                    <div className="mt-1 text-xs text-orange-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.deathPercentageDistribution.mid,
                        1,
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-3 text-center">
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-green-300">
                      Late
                    </div>
                    <div className="text-xl font-bold text-green-200">
                      {advancedKPI.deathDistribution.late}
                    </div>
                    <div className="mt-1 text-xs text-green-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.deathPercentageDistribution.late,
                        1,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEZIONE 6: Kill Distribution per fase */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-4 text-base font-semibold text-neutral-200">
                  Kill Distribution per Fase
                </h3>
                <p className="mb-4 text-xs text-neutral-400">
                  Distribuzione delle kill nelle tre fasi (Early: 0-10min, Mid:
                  10-30min, Late: 30+min)
                </p>

                {/* Grafico Kill Distribution */}
                <div className="mb-4 h-[200px]">
                  <Bars
                    data={[
                      {
                        minuteFrom: 0,
                        minuteTo: 10,
                        teamKills: advancedKPI.killDistribution.early,
                        enemyKills: 0,
                      },
                      {
                        minuteFrom: 10,
                        minuteTo: 30,
                        teamKills: advancedKPI.killDistribution.mid,
                        enemyKills: 0,
                      },
                      {
                        minuteFrom: 30,
                        minuteTo: 60,
                        teamKills: advancedKPI.killDistribution.late,
                        enemyKills: 0,
                      },
                    ]}
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

              {/* SEZIONE 7: Death by Role */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-4 text-base font-semibold text-neutral-200">
                  Death by Role (Pos1-5)
                </h3>
                <p className="mb-4 text-xs text-neutral-400">
                  Percentuale di morti causate da ciascun ruolo avversario
                </p>

                {/* Grafico Death by Role */}
                <div className="mb-4 h-[200px]">
                  <Bars
                    data={[1, 2, 3, 4, 5].map((pos) => {
                      const value = advancedKPI.deathByRole[
                        `pos${pos}` as keyof typeof advancedKPI.deathByRole
                      ] as number
                      return {
                        minuteFrom: pos,
                        minuteTo: pos + 1,
                        teamKills: 0,
                        enemyKills: value,
                      }
                    })}
                  />
                </div>

                {/* Cards Death by Role */}
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((pos) => {
                    const value = advancedKPI.deathByRole[
                      `pos${pos}` as keyof typeof advancedKPI.deathByRole
                    ] as number
                    const roleLabels: Record<number, string> = {
                      1: 'Carry',
                      2: 'Mid',
                      3: 'Offlane',
                      4: 'Soft Sup',
                      5: 'Hard Sup',
                    }
                    const maxValue = Math.max(
                      ...([1, 2, 3, 4, 5] as const).map(
                        (p) =>
                          advancedKPI.deathByRole[
                            `pos${p}` as keyof typeof advancedKPI.deathByRole
                          ] as number,
                      ),
                    )
                    const isMax = value === maxValue && value > 0

                    return (
                      <div
                        key={pos}
                        className={`rounded-lg border p-3 text-center transition-all ${
                          isMax
                            ? 'border-orange-600/50 bg-orange-900/20'
                            : 'border-neutral-800 bg-neutral-900/70'
                        }`}
                      >
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
                          Pos{pos}
                        </div>
                        <div className="mb-1 text-[10px] text-neutral-500">
                          {roleLabels[pos]}
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            isMax ? 'text-orange-300' : 'text-neutral-200'
                          }`}
                        >
                          {formatPercentageOrNA(value, 1)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SEZIONE 8: Death Cost Summary */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-4 text-base font-semibold text-neutral-200">
                  Costo Opportunità delle Morti
                </h3>
                <p className="mb-4 text-xs text-neutral-400">
                  Risorse perse durante i tempi di respawn causati dalle morti
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-red-300">
                      Gold Perso
                    </div>
                    <div className="text-2xl font-bold text-red-200">
                      {formatNumberOrNA(
                        advancedKPI.deathCostSummary.totalGoldLost,
                      )}
                    </div>
                    <div className="mt-2 text-xs text-red-400/80">
                      Durante tutti i respawn
                    </div>
                  </div>

                  <div className="rounded-lg border border-yellow-800/50 bg-yellow-900/20 p-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-yellow-300">
                      XP Perso
                    </div>
                    <div className="text-2xl font-bold text-yellow-200">
                      {formatNumberOrNA(
                        advancedKPI.deathCostSummary.totalXpLost,
                      )}
                    </div>
                    <div className="mt-2 text-xs text-yellow-400/80">
                      Esperienza non guadagnata
                    </div>
                  </div>

                  <div className="rounded-lg border border-orange-800/50 bg-orange-900/20 p-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-orange-300">
                      CS Perso
                    </div>
                    <div className="text-2xl font-bold text-orange-200">
                      {formatNumberOrNA(
                        advancedKPI.deathCostSummary.totalCsLost,
                      )}
                    </div>
                    <div className="mt-2 text-xs text-orange-400/80">
                      Last hits mancati
                    </div>
                  </div>
                </div>
              </div>

              {/* SEZIONE 9: Insight Box (Placeholder Fase 3C) */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
                <h3 className="mb-4 text-base font-semibold text-neutral-200">
                  Insight Match
                </h3>
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="mb-2 text-xs font-medium text-neutral-300">
                    {data.match.radiantWin
                      ? '✅ Partita vinta grazie a:'
                      : '❌ Partita persa a causa di:'}
                  </div>
                  <ul className="space-y-1.5 text-xs text-neutral-400">
                    {data.player.kda != null && data.player.kda >= 2.0 && (
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">•</span>
                        <span>Buon KDA: {data.player.kda.toFixed(2)}</span>
                      </li>
                    )}
                    {data.player.kda != null && data.player.kda < 1.0 && (
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">•</span>
                        <span>KDA basso: {data.player.kda.toFixed(2)}</span>
                      </li>
                    )}
                    {data.player.gpm && data.player.gpm >= 400 && (
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">•</span>
                        <span>GPM alto: {data.player.gpm}</span>
                      </li>
                    )}
                    {data.player.gpm && data.player.gpm < 300 && (
                      <li className="flex items-center gap-2">
                        <span className="text-orange-400">•</span>
                        <span>GPM basso: {data.player.gpm}</span>
                      </li>
                    )}
                    {data.player.heroDamage &&
                      data.player.heroDamage >= 15000 && (
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">•</span>
                          <span>
                            Danni agli eroi alti:{' '}
                            {data.player.heroDamage.toLocaleString()}
                          </span>
                        </li>
                      )}
                    {data.player.towerDamage &&
                      data.player.towerDamage >= 2000 && (
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">•</span>
                          <span>
                            Focus obiettivi:{' '}
                            {data.player.towerDamage.toLocaleString()}
                          </span>
                        </li>
                      )}
                  </ul>
                </div>
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
      className="max-w-full overflow-hidden"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background grid lines */}
      <defs>
        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Zero line */}
      <line
        x1="20"
        y1={scaleY(0)}
        x2={width - 20}
        y2={scaleY(0)}
        stroke="#0d9488"
        strokeOpacity="0.4"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />

      {/* Data line */}
      <path
        d={path}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(p.minute)}
          cy={scaleY(p.goldDiff)}
          r="3"
          fill="#14b8a6"
          stroke="#0d9488"
          strokeWidth="1.5"
        />
      ))}

      {/* Labels */}
      <text
        x={width - 100}
        y={20}
        fontSize="10"
        fill="#a1a1aa"
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
