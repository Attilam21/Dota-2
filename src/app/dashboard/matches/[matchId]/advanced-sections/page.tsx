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
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import Link from 'next/link'
import { SkeletonChart } from '@/components/ui/SkeletonLoader'
import MultiLineChart from '@/components/charts/MultiLineChart'
import BarChart from '@/components/charts/BarChart'
import LineChart from '@/components/charts/LineChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type {
  LaneAnalysis,
  FarmEconomyAnalysis,
  FightsDamageAnalysis,
  VisionMapAnalysis,
} from '@/lib/dota/advancedAnalysis/types'

export default function MatchAdvancedSectionsPage() {
  const params = useParams()
  const search = useSearchParams()
  const router = useRouter()
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
      <div className="space-y-6 p-6">
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
      <div className="space-y-6 p-6">
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Analisi Avanzata Match
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Analisi dettagliata per il match #{matchId}
          </p>
        </div>
        <Link
          href={`/dashboard/matches/${matchId}${
            playerId ? `?playerId=${playerId}` : ''
          }`}
          className="rounded-md border border-blue-600/50 bg-blue-950/30 px-4 py-2 text-sm font-semibold text-blue-300 transition-all hover:border-blue-500 hover:bg-blue-950/50 hover:text-blue-200"
        >
          ← Torna al match
        </Link>
      </div>

      {/* Section 1: Lane & Early Game */}
      {laneData && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            Lane & Early Game
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="mb-3 text-xl font-semibold text-white">
                KPI Chiave
              </h3>
              <div className="space-y-2 text-neutral-300">
                <p>
                  Winrate in Lane:{' '}
                  <span className="font-medium text-blue-400">
                    {laneData.laneWinrate?.toFixed(1) ?? 'N/A'}%
                  </span>
                </p>
                <p>
                  CS a 10 min:{' '}
                  <span className="font-medium text-blue-400">
                    {laneData.avgCsAt10?.toFixed(1) ?? 'N/A'}
                  </span>
                </p>
                <p>
                  XP a 10 min:{' '}
                  <span className="font-medium text-blue-400">
                    {laneData.avgXpAt10?.toFixed(0) ?? 'N/A'}
                  </span>
                </p>
              </div>
            </div>
            {laneData.csTimeline && laneData.csTimeline.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <h3 className="mb-3 text-xl font-semibold text-white">
                  CS Timeline
                </h3>
                <LineChart
                  data={laneData.csTimeline.map((d) => ({
                    x: d.date,
                    y: d.csAt10,
                  }))}
                  width={560}
                  height={200}
                  color="#60a5fa"
                  label="CS"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 2: Farm & Economy */}
      {economyData && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Farm & Economy</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="mb-3 text-xl font-semibold text-white">
                KPI Chiave
              </h3>
              <div className="space-y-2 text-neutral-300">
                <p>
                  GPM:{' '}
                  <span className="font-medium text-blue-400">
                    {economyData.avgGpm?.toFixed(0) ?? 'N/A'}
                  </span>
                </p>
                <p>
                  XPM:{' '}
                  <span className="font-medium text-blue-400">
                    {economyData.avgXpm?.toFixed(0) ?? 'N/A'}
                  </span>
                </p>
                <p>
                  Dead Gold:{' '}
                  <span className="font-medium text-blue-400">
                    {economyData.deadGold?.toFixed(0) ?? 'N/A'}
                  </span>
                </p>
              </div>
            </div>
            {economyData.gpmTimeline && economyData.gpmTimeline.length > 0 && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                <h3 className="mb-3 text-xl font-semibold text-white">
                  GPM Timeline
                </h3>
                <MultiLineChart
                  data={economyData.gpmTimeline.map((d) => ({
                    x: d.minute.toString(),
                    y: d.avgGpm,
                  }))}
                  lines={[{ key: 'y', color: '#f59e0b', label: 'GPM' }]}
                  width={560}
                  height={200}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 3: Fights & Damage */}
      {fightsData && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Fights & Damage</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="mb-3 text-xl font-semibold text-white">
                KPI Chiave
              </h3>
              <div className="space-y-2 text-neutral-300">
                <p>
                  Kill Participation:{' '}
                  <span className="font-medium text-blue-400">
                    {fightsData.killParticipation?.toFixed(1) ?? 'N/A'}%
                  </span>
                </p>
                <p>
                  Damage Share:{' '}
                  <span className="font-medium text-blue-400">N/A</span>
                </p>
                <p>
                  Teamfight Participation:{' '}
                  <span className="font-medium text-blue-400">
                    {fightsData.avgTeamfightsParticipated?.toFixed(1) ?? 'N/A'}
                  </span>
                </p>
              </div>
            </div>
            {fightsData.teamfightImpact &&
              fightsData.teamfightImpact.length > 0 && (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                  <h3 className="mb-3 text-xl font-semibold text-white">
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
                    width={560}
                    height={200}
                    showValues={true}
                  />
                </div>
              )}
          </div>
        </div>
      )}

      {/* Section 4: Vision & Map Control */}
      {visionData && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            Vision & Map Control
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="mb-3 text-xl font-semibold text-white">
                KPI Chiave
              </h3>
              <div className="space-y-2 text-neutral-300">
                <p>
                  Wards Piazzate:{' '}
                  <span className="font-medium text-blue-400">N/A</span>
                </p>
                <p>
                  Wards Rimosse:{' '}
                  <span className="font-medium text-blue-400">N/A</span>
                </p>
              </div>
            </div>
            {/* Heatmap */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
              <h3 className="mb-3 text-xl font-semibold text-white">
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
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-center">
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
