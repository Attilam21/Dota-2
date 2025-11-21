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
              {/* Link alla nuova analisi avanzata FZTH */}
              <Link
                href={`/dota/matches/${data.match.matchId}/players/${playerId}`}
                className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                📊 Analisi Avanzata FZTH
              </Link>
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

          {/* Mini-analisi automatica - mostra solo se advancedKPI è caricato */}
          {kpiLoading && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
              <div className="text-neutral-400">
                Caricamento analisi avanzata…
              </div>
            </div>
          )}
          {!kpiLoading && advancedKPI && data && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
              <h2 className="mb-3 text-sm font-medium text-neutral-200">
                Mini-analisi automatica (Dati reali da Supabase)
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Kill Distribution Early - dati reali da advancedKPI */}
                <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-3">
                  <div className="text-xs text-green-300">Kill Early Game</div>
                  <div className="text-sm font-semibold text-green-200">
                    {advancedKPI.killDistribution.early} kill
                  </div>
                  <div className="text-xs text-green-400/80">
                    {formatPercentageOrNA(
                      advancedKPI.killPercentageDistribution.early,
                      1,
                    )}{' '}
                    del totale
                  </div>
                </div>

                {/* Kill Distribution Mid - dati reali da advancedKPI */}
                <div className="rounded-lg border border-orange-800/50 bg-orange-900/20 p-3">
                  <div className="text-xs text-orange-300">Kill Mid Game</div>
                  <div className="text-sm font-semibold text-orange-200">
                    {advancedKPI.killDistribution.mid} kill
                  </div>
                  <div className="text-xs text-orange-400/80">
                    {formatPercentageOrNA(
                      advancedKPI.killPercentageDistribution.mid,
                      1,
                    )}{' '}
                    del totale
                  </div>
                </div>

                {/* Kill Distribution Late - dati reali da advancedKPI */}
                <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-3">
                  <div className="text-xs text-red-300">Kill Late Game</div>
                  <div className="text-sm font-semibold text-red-200">
                    {advancedKPI.killDistribution.late} kill
                  </div>
                  <div className="text-xs text-red-400/80">
                    {formatPercentageOrNA(
                      advancedKPI.killPercentageDistribution.late,
                      1,
                    )}{' '}
                    del totale
                  </div>
                </div>

                {/* Death Cost Summary - dati reali da advancedKPI */}
                <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-3">
                  <div className="text-xs text-red-300">Costo Morti (Gold)</div>
                  <div className="text-lg font-bold text-red-200">
                    {formatNumberOrNA(
                      advancedKPI.deathCostSummary.totalGoldLost,
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/dashboard/coaching"
                  className="text-sm text-blue-400 hover:underline"
                >
                  Crea Task da questo match →
                </Link>
              </div>
            </div>
          )}

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
                {formatNumberOrNA(data.player.lastHits)} /{' '}
                {formatNumberOrNA(data.player.denies)}
              </div>
              <div className="mt-2 text-xs text-neutral-400">GPM / XPM</div>
              <div className="text-sm">
                {formatNumberOrNA(data.player.gpm)} /{' '}
                {formatNumberOrNA(data.player.xpm)}
              </div>
              {/* Mostra role position da advancedKPI se disponibile */}
              {advancedKPI && (
                <div className="mt-2 text-xs text-neutral-400">
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
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-xs text-neutral-400">Danni</div>{' '}
              <div className="text-sm">
                Eroe: {formatNumberOrNA(data.player.heroDamage)}
              </div>
              <div className="text-sm">
                Torri: {formatNumberOrNA(data.player.towerDamage)}
              </div>
              <div className="text-sm">
                Cura: {formatNumberOrNA(data.player.heroHealing)}
              </div>
              {/* Mostra death cost summary da advancedKPI se disponibile */}
              {advancedKPI && (
                <>
                  <div className="mt-2 border-t border-neutral-700 pt-2 text-xs text-neutral-400">
                    Costo Morti (XP/CS)
                  </div>
                  <div className="text-xs text-yellow-300">
                    XP:{' '}
                    {formatNumberOrNA(advancedKPI.deathCostSummary.totalXpLost)}
                  </div>
                  <div className="text-xs text-orange-300">
                    CS:{' '}
                    {formatNumberOrNA(advancedKPI.deathCostSummary.totalCsLost)}
                  </div>
                </>
              )}
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

          {/* KPI avanzati da dota_player_match_analysis */}
          {kpiLoading && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <div className="text-neutral-400">
                Caricamento analisi avanzata…
              </div>
            </div>
          )}
          {!kpiLoading && advancedKPI && (
            <div className="rounded-lg border border-neutral-800 p-4">
              <h2 className="mb-4 text-lg font-semibold text-neutral-200">
                Analisi Avanzata Match FZTH
              </h2>

              {/* Death Cost Summary */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-3">
                  <div className="text-xs text-red-300">Gold Perso</div>
                  <div className="text-xl font-bold text-red-200">
                    {formatNumberOrNA(
                      advancedKPI.deathCostSummary.totalGoldLost,
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-yellow-800/50 bg-yellow-900/20 p-3">
                  <div className="text-xs text-yellow-300">XP Perso</div>
                  <div className="text-xl font-bold text-yellow-200">
                    {formatNumberOrNA(advancedKPI.deathCostSummary.totalXpLost)}
                  </div>
                </div>
                <div className="rounded-lg border border-orange-800/50 bg-orange-900/20 p-3">
                  <div className="text-xs text-orange-300">CS Perso</div>
                  <div className="text-xl font-bold text-orange-200">
                    {formatNumberOrNA(advancedKPI.deathCostSummary.totalCsLost)}
                  </div>
                </div>
              </div>

              {/* Kill Distribution per fase - grafico */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-neutral-300">
                  Kill Distribution per Fase (Grafico)
                </h3>
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded border border-green-800/50 bg-green-900/20 p-2 text-center">
                    <div className="text-xs text-green-300">Early</div>
                    <div className="text-lg font-semibold text-green-200">
                      {advancedKPI.killDistribution.early}
                    </div>
                    <div className="text-xs text-green-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.killPercentageDistribution.early,
                        1,
                      )}
                    </div>
                  </div>
                  <div className="rounded border border-orange-800/50 bg-orange-900/20 p-2 text-center">
                    <div className="text-xs text-orange-300">Mid</div>
                    <div className="text-lg font-semibold text-orange-200">
                      {advancedKPI.killDistribution.mid}
                    </div>
                    <div className="text-xs text-orange-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.killPercentageDistribution.mid,
                        1,
                      )}
                    </div>
                  </div>
                  <div className="rounded border border-red-800/50 bg-red-900/20 p-2 text-center">
                    <div className="text-xs text-red-300">Late</div>
                    <div className="text-lg font-semibold text-red-200">
                      {advancedKPI.killDistribution.late}
                    </div>
                    <div className="text-xs text-red-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.killPercentageDistribution.late,
                        1,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Death Distribution per fase - grafico */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-neutral-300">
                  Death Distribution per Fase (Grafico)
                </h3>
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded border border-red-800/50 bg-red-900/20 p-2 text-center">
                    <div className="text-xs text-red-300">Early</div>
                    <div className="text-lg font-semibold text-red-200">
                      {advancedKPI.deathDistribution.early}
                    </div>
                    <div className="text-xs text-red-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.deathPercentageDistribution.early,
                        1,
                      )}
                    </div>
                  </div>
                  <div className="rounded border border-orange-800/50 bg-orange-900/20 p-2 text-center">
                    <div className="text-xs text-orange-300">Mid</div>
                    <div className="text-lg font-semibold text-orange-200">
                      {advancedKPI.deathDistribution.mid}
                    </div>
                    <div className="text-xs text-orange-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.deathPercentageDistribution.mid,
                        1,
                      )}
                    </div>
                  </div>
                  <div className="rounded border border-green-800/50 bg-green-900/20 p-2 text-center">
                    <div className="text-xs text-green-300">Late</div>
                    <div className="text-lg font-semibold text-green-200">
                      {advancedKPI.deathDistribution.late}
                    </div>
                    <div className="text-xs text-green-400/80">
                      {formatPercentageOrNA(
                        advancedKPI.deathPercentageDistribution.late,
                        1,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Death by Role - grafico e tabella */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-neutral-300">
                  Death by Role (Pos1-5) - Dati reali da Supabase
                </h3>
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
                    return (
                      <div
                        key={pos}
                        className="rounded border border-neutral-800 bg-neutral-900/70 p-2 text-center"
                      >
                        <div className="text-xs text-neutral-400">Pos{pos}</div>
                        <div className="text-xs text-neutral-500">
                          {roleLabels[pos]}
                        </div>
                        <div className="text-lg font-semibold text-neutral-200">
                          {formatPercentageOrNA(value, 1)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Death Events Info */}
              {advancedKPI.deathEvents &&
                advancedKPI.deathEvents.length > 0 && (
                  <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900/30 p-3">
                    <div className="text-xs text-neutral-400">
                      Eventi di Morte Disponibili:{' '}
                      {advancedKPI.deathEvents.length}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Dati disponibili per analisi dettagliata della heatmap
                    </div>
                  </div>
                )}

              {/* Link alla pagina analisi completa */}
              <div className="mt-4">
                <Link
                  href={`/dota/matches/${matchId}/players/${playerId}`}
                  className="text-sm text-blue-400 hover:underline"
                >
                  📊 Vedi Analisi Completa Avanzata →
                </Link>
              </div>

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
                  {data.player.kda != null && data.player.kda >= 2.0 && (
                    <li>Buon KDA ({data.player.kda.toFixed(2)})</li>
                  )}
                  {data.player.kda != null && data.player.kda < 1.0 && (
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
