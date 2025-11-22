/**
 * Single Match Advanced Analysis Page
 *
 * Shows the same 4 sections as /dashboard/advanced but for a SINGLE match:
 * - Lane & Early Game
 * - Farm & Economy
 * - Fights & Damage
 * - Vision & Map Control
 *
 * Uses /api/dota/match-advanced/* endpoints (NOT /api/dota/advanced/*)
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import Link from 'next/link'
import { SkeletonChart } from '@/components/ui/SkeletonLoader'
import MultiLineChart from '@/components/charts/MultiLineChart'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import type {
  LaneAnalysis,
  FarmEconomyAnalysis,
  FightsDamageAnalysis,
  VisionMapAnalysis,
} from '@/lib/dota/advancedAnalysis/types'
import { InfoBanner } from '@/components/dashboard/InfoBanner'

export default function MatchAdvancedSectionsPage() {
  const params = useParams()
  const search = useSearchParams()
  const { activePlayer, loading: playerLoading } = useActivePlayer()

  const matchId = params?.matchId as string
  const playerId =
    activePlayer?.dotaAccountId?.toString() || search.get('playerId') || ''

  const [laneData, setLaneData] = useState<LaneAnalysis | null>(null)
  const [economyData, setEconomyData] = useState<FarmEconomyAnalysis | null>(
    null,
  )
  const [fightsData, setFightsData] = useState<FightsDamageAnalysis | null>(
    null,
  )
  const [visionData, setVisionData] = useState<VisionMapAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (playerLoading) return

    if (!matchId || !playerId) {
      setError('Parametri mancanti: matchId e playerId sono richiesti')
      setLoading(false)
      return
    }

    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Load all 4 sections in parallel (SINGLE MATCH APIs)
        const [laneRes, economyRes, fightsRes, visionRes] = await Promise.all([
          fetch(
            `/api/dota/match-advanced/lane?matchId=${matchId}&playerId=${playerId}`,
          ),
          fetch(
            `/api/dota/match-advanced/economy?matchId=${matchId}&playerId=${playerId}`,
          ),
          fetch(
            `/api/dota/match-advanced/fights?matchId=${matchId}&playerId=${playerId}`,
          ),
          fetch(
            `/api/dota/match-advanced/vision?matchId=${matchId}&playerId=${playerId}`,
          ),
        ])

        if (!laneRes.ok || !economyRes.ok || !fightsRes.ok || !visionRes.ok) {
          throw new Error('Failed to load match advanced analysis')
        }

        const [laneJson, economyJson, fightsJson, visionJson] =
          await Promise.all([
            laneRes.json(),
            economyRes.json(),
            fightsRes.json(),
            visionRes.json(),
          ])

        // Set data directly (already in correct format)
        setLaneData(laneJson)
        setEconomyData(economyJson)
        setFightsData(fightsJson)
        setVisionData(visionJson)
      } catch (err: any) {
        console.error('Error fetching match advanced analysis:', err)
        setError(err.message || 'Errore durante il caricamento dei dati.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [matchId, playerId, playerLoading])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
        <h1 className="text-3xl font-bold text-white">
          Analisi Avanzata Match
        </h1>
        <p className="text-neutral-400">
          Caricamento analisi avanzata per questo match...
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
        <h1 className="text-3xl font-bold text-white">
          Analisi Avanzata Match
        </h1>
        <p className="mt-2 text-sm text-red-400">Errore: {error}</p>
        <div className="mt-4">
          <Link
            href={`/dashboard/matches/${matchId}${
              playerId ? `?playerId=${playerId}` : ''
            }`}
            className="text-sm text-neutral-300 hover:text-white"
          >
            ← Torna al dettaglio partita
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">
            Analisi Avanzata Match
          </h1>
          <InfoBanner
            variant="match"
            title={`Analisi della partita #${matchId}`}
            description="I dati e i grafici sottostanti si riferiscono esclusivamente a questo match."
          />
        </div>
        <Link
          href={`/dashboard/matches/${matchId}${
            playerId ? `?playerId=${playerId}` : ''
          }`}
          className="ml-4 rounded-md border border-blue-600/50 bg-blue-950/30 px-4 py-2 text-sm font-semibold text-blue-300 transition-all hover:border-blue-500 hover:bg-blue-950/50 hover:text-blue-200"
        >
          ← Torna al match
        </Link>
      </div>

      {/* Section 1: Lane & Early Game */}
      {laneData && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Lane & Early Game
          </h2>

          {/* KPI Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
              <div className="text-xs text-neutral-400">Winrate in Lane</div>
              <div className="text-2xl font-semibold text-white">
                {laneData.laneWinrate?.toFixed(1) ?? 'N/A'}%
              </div>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
              <div className="text-xs text-neutral-400">CS a 10 min</div>
              <div className="text-2xl font-semibold text-white">
                {laneData.avgCsAt10?.toFixed(1) ?? 'N/A'}
              </div>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
              <div className="text-xs text-neutral-400">XP a 10 min</div>
              <div className="text-2xl font-semibold text-white">
                {laneData.avgXpAt10?.toFixed(0) ?? 'N/A'}
              </div>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
              <div className="text-xs text-neutral-400">First Blood</div>
              <div className="text-2xl font-semibold text-white">N/A</div>
              <div className="text-[10px] text-neutral-500">
                Non disponibile
              </div>
            </div>
          </div>

          {/* CS Timeline Chart */}
          {laneData.csTimeline && laneData.csTimeline.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">
                CS Timeline
              </h3>
              <div className="h-64">
                <LineChart
                  data={laneData.csTimeline.map((d) => ({
                    x: d.date,
                    y: d.csAt10,
                  }))}
                  width={800}
                  height={256}
                  color="#60a5fa"
                  label="CS"
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
              <p className="text-sm text-neutral-400">
                Dati non disponibili per questa metrica nel dataset di test.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Section 2: Farm & Economy */}
      {economyData && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Farm & Economy</h2>

          {/* KPI Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
              <div className="text-xs text-neutral-400">GPM</div>
              <div className="text-2xl font-semibold text-white">
                {economyData.avgGpm?.toFixed(0) ?? 'N/A'}
              </div>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
              <div className="text-xs text-neutral-400">XPM</div>
              <div className="text-2xl font-semibold text-white">
                {economyData.avgXpm?.toFixed(0) ?? 'N/A'}
              </div>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
              <div className="text-xs text-neutral-400">Dead Gold</div>
              <div className="text-2xl font-semibold text-white">
                {economyData.deadGold?.toFixed(0) ?? 'N/A'}
              </div>
            </div>
            <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
              <div className="text-xs text-neutral-400">Item Timing</div>
              <div className="text-2xl font-semibold text-white">N/A</div>
              <div className="text-[10px] text-neutral-500">
                Non disponibile
              </div>
            </div>
          </div>

          {/* GPM Timeline Chart */}
          {economyData.gpmTimeline && economyData.gpmTimeline.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">
                GPM Timeline
              </h3>
              <div className="h-64">
                <MultiLineChart
                  data={economyData.gpmTimeline.map((d) => ({
                    x: d.minute.toString(),
                    y: d.avgGpm,
                  }))}
                  lines={[{ key: 'y', color: '#f59e0b', label: 'GPM' }]}
                  width={800}
                  height={256}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
              <p className="text-sm text-neutral-400">
                Dati non disponibili per questa metrica nel dataset di test.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Section 3: Fights & Damage */}
      {fightsData && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Fights & Damage</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* KPI Cards */}
            <div className="space-y-4">
              <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
                <div className="text-xs text-neutral-400">
                  Kill Participation
                </div>
                <div className="text-2xl font-semibold text-white">
                  {fightsData.killParticipation?.toFixed(1) ?? 'N/A'}%
                </div>
              </div>
              <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
                <div className="text-xs text-neutral-400">Damage Share</div>
                <div className="text-2xl font-semibold text-white">N/A</div>
                <div className="text-[10px] text-neutral-500">
                  Non disponibile
                </div>
              </div>
              <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
                <div className="text-xs text-neutral-400">
                  Teamfight Participation
                </div>
                <div className="text-2xl font-semibold text-white">
                  {fightsData.avgTeamfightsParticipated?.toFixed(1) ?? 'N/A'}
                </div>
              </div>
            </div>

            {/* Teamfight Chart */}
            {fightsData.teamfightImpact &&
            fightsData.teamfightImpact.length > 0 ? (
              <div className="min-h-[220px] rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Teamfight per Fase
                </h3>
                <BarChart
                  data={fightsData.teamfightImpact.map((tfi) => ({
                    label: tfi.phase,
                    value: tfi.participation,
                    color:
                      tfi.phase === 'Early'
                        ? '#22c55e'
                        : tfi.phase === 'Mid'
                          ? '#f59e0b'
                          : '#ef4444',
                  }))}
                  width={600}
                  height={180}
                  showValues={true}
                />
              </div>
            ) : (
              <div className="min-h-[220px] rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
                <p className="text-sm text-neutral-400">
                  Dati non disponibili per questa metrica nel dataset di test.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 4: Vision & Map Control */}
      {visionData && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">
            Vision & Map Control
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* KPI Cards */}
            <div className="space-y-4">
              <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
                <div className="text-xs text-neutral-400">Wards Piazzate</div>
                <div className="text-2xl font-semibold text-white">N/A</div>
                <div className="text-[10px] text-neutral-500">
                  Non disponibile
                </div>
              </div>
              <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
                <div className="text-xs text-neutral-400">Wards Rimosse</div>
                <div className="text-2xl font-semibold text-white">N/A</div>
                <div className="text-[10px] text-neutral-500">
                  Non disponibile
                </div>
              </div>
            </div>

            {/* Heatmap */}
            <div className="min-h-[260px] rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Heatmap Posizioni
              </h3>
              <div className="flex flex-col gap-1">
                {Array.from({ length: 10 }, (_, y) => (
                  <div key={y} className="flex gap-1">
                    {Array.from({ length: 10 }, (_, x) => {
                      const cell = visionData.wardsHeatmap.find(
                        (h: { x: number; y: number; count: number }) =>
                          h.x === x && h.y === y,
                      )
                      const maxCount = Math.max(
                        1,
                        ...visionData.wardsHeatmap.map(
                          (h: { count: number }) => h.count,
                        ),
                      )
                      const opacity = cell ? (cell.count / maxCount) * 0.8 : 0
                      return (
                        <div
                          key={x}
                          className="h-6 w-6 rounded"
                          style={{
                            backgroundColor: `rgba(34, 197, 94, ${opacity})`,
                          }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-neutral-400">
                Heatmap calcolata dalle posizioni delle morti (proxy per
                attività mappa)
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Back button */}
      <div className="flex justify-center pt-4">
        <Link
          href={`/dashboard/matches/${matchId}${
            playerId ? `?playerId=${playerId}` : ''
          }`}
          className="text-sm text-neutral-300 hover:text-white"
        >
          ← Torna al dettaglio partita
        </Link>
      </div>
    </div>
  )
}
