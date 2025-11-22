/**
 * Advanced Match Analysis Page
 *
 * Enterprise-grade advanced match analysis with 10 detailed blocks
 * Using Tier 1 data only from OpenDota/Supabase
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import Link from 'next/link'
import { getHeroName, getHeroIconUrl } from '@/lib/dotaHeroes'
import { getRolePositionLabel } from '@/types/dotaAnalysis'
import SkeletonLoader, {
  SkeletonGrid,
  SkeletonChart,
} from '@/components/ui/SkeletonLoader'
import { Overview } from '@/components/dota/advanced/Overview'
import { KillDistribution } from '@/components/dota/advanced/KillDistribution'
import { LaningEfficiency } from '@/components/dota/advanced/LaningEfficiency'
import { CombatAnalysis } from '@/components/dota/advanced/CombatAnalysis'
import { FarmScaling } from '@/components/dota/advanced/FarmScaling'
import { ItemProgression } from '@/components/dota/advanced/ItemProgression'
import { Objectives } from '@/components/dota/advanced/Objectives'
import { Teamfights } from '@/components/dota/advanced/Teamfights'
import { CriticalErrors } from '@/components/dota/advanced/CriticalErrors'
import { formatDuration } from '@/lib/dota/analysis/utils'
import { getAdvancedAnalysis } from '@/lib/dota/matchAnalysis/getAdvancedAnalysis'
import type { KillDistribution as KillDistributionType } from '@/types/matchAnalysis'
import type { OverviewAnalysisData } from '@/lib/dota/analysis/computeOverview'
import type { LaningEfficiencyAnalysisData } from '@/lib/dota/analysis/computeLaning'
import type { CombatAnalysisData } from '@/lib/dota/analysis/computeCombat'
import type { FarmScalingAnalysisData } from '@/lib/dota/analysis/computeFarmScaling'
import type { ItemProgressionAnalysisData } from '@/lib/dota/analysis/computeItemProgression'
import type { ObjectivesAnalysisData } from '@/lib/dota/analysis/computeObjectives'
import type { TeamfightsAnalysisData } from '@/lib/dota/analysis/computeTeamfights'
import type { CriticalErrorsAnalysisData } from '@/lib/dota/analysis/computeCriticalErrors'

interface AdvancedAnalysisResponse {
  match: {
    matchId: number
    durationSeconds: number
    startTime: string
    radiantWin: boolean
  }
  player: {
    accountId: number
    heroId: number
    role: number | null
  }
  overview: OverviewAnalysisData
  laning: LaningEfficiencyAnalysisData
  combat: CombatAnalysisData
  farmScaling: FarmScalingAnalysisData
  itemProgression: ItemProgressionAnalysisData
  objectives: ObjectivesAnalysisData
  teamfights: TeamfightsAnalysisData
  criticalErrors: CriticalErrorsAnalysisData
}

export default function AdvancedMatchAnalysisPage() {
  const params = useParams()
  const search = useSearchParams()
  const router = useRouter()

  const matchId = params?.matchId as string
  const { activePlayer } = useActivePlayer()
  const playerId =
    activePlayer?.dotaAccountId?.toString() || search.get('playerId') || ''

  const [analysis, setAnalysis] = useState<AdvancedAnalysisResponse | null>(
    null,
  )
  const [killDistribution, setKillDistribution] =
    useState<KillDistributionType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true
    async function load() {
      if (!matchId || !playerId) {
        setError('Parametri mancanti: matchId e playerId sono richiesti')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Load advanced analysis
        const res = await fetch(
          `/api/match/${matchId}/advanced?playerId=${playerId}`,
          { cache: 'no-store' },
        )

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }

        const json: AdvancedAnalysisResponse = await res.json()
        if (active) setAnalysis(json)

        // Load kill distribution separately
        try {
          const advancedAnalysis = await getAdvancedAnalysis(
            Number(matchId),
            Number(playerId),
          )
          if (advancedAnalysis) {
            setKillDistribution({
              early: advancedAnalysis.killDistribution.early,
              mid: advancedAnalysis.killDistribution.mid,
              late: advancedAnalysis.killDistribution.late,
              total:
                advancedAnalysis.killDistribution.early +
                advancedAnalysis.killDistribution.mid +
                advancedAnalysis.killDistribution.late,
              percentages: advancedAnalysis.killPercentageDistribution,
              insight: null,
            })
          }
        } catch (e) {
          console.warn(
            '[ADVANCED-ANALYSIS] Kill distribution not available:',
            e,
          )
        }
      } catch (e: any) {
        console.error('[ADVANCED-ANALYSIS] Error loading analysis:', e)
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

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <SkeletonLoader variant="text" className="mb-2 w-1/3" />
        <SkeletonGrid cols={4} />
        <SkeletonChart />
        <SkeletonChart />
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
          <div className="font-semibold">Errore nel caricamento</div>
          <div className="text-sm">{error || 'Dati non disponibili'}</div>
          <div className="mt-4">
            <button
              onClick={() =>
                router.push(
                  `/dashboard/matches/${matchId}${
                    playerId ? `?playerId=${playerId}` : ''
                  }`,
                )
              }
              className="text-sm text-neutral-300 hover:text-white"
            >
              ← Torna al dettaglio partita
            </button>
          </div>
        </div>
      </div>
    )
  }

  const heroId = analysis.player.heroId
  const heroName = getHeroName(heroId)
  const heroIcon = getHeroIconUrl(heroId)
  const isRadiant = analysis.player.accountId < 128
  const result: 'win' | 'lose' =
    isRadiant === analysis.match.radiantWin ? 'win' : 'lose'
  const roleLabel =
    analysis.player.role !== null
      ? getRolePositionLabel(analysis.player.role as any)
      : null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                result === 'win'
                  ? 'bg-green-900/60 text-green-300'
                  : 'bg-red-900/60 text-red-300'
              }`}
            >
              {result === 'win' ? 'Victory' : 'Defeat'}
            </span>
            <h1 className="text-2xl font-semibold text-neutral-100">
              Analisi Match Dota 2 (TIER 1 ONLY)
            </h1>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm text-neutral-400">
              Match #{analysis.match.matchId}
            </span>
            {heroIcon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroIcon}
                alt={heroName}
                width={32}
                height={32}
                className="h-8 w-8 rounded"
                loading="lazy"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            )}
            <span className="text-lg font-medium text-neutral-200">
              {heroName}
            </span>
            {roleLabel && (
              <>
                <span className="text-xs text-neutral-500">•</span>
                <span className="text-sm text-neutral-400">{roleLabel}</span>
              </>
            )}
          </div>
          <div className="space-y-1 text-sm text-neutral-400">
            <div>Durata: {formatDuration(analysis.match.durationSeconds)}</div>
            <div>
              Data:{' '}
              {new Date(analysis.match.startTime).toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/matches/${matchId}${
              playerId ? `?playerId=${playerId}` : ''
            }`}
            className="rounded-md border border-blue-600/50 bg-blue-950/30 px-4 py-2 text-sm font-semibold text-blue-300 transition-all hover:border-blue-500 hover:bg-blue-950/50 hover:text-blue-200"
          >
            Torna al match →
          </Link>
        </div>
      </div>

      {/* Analysis Blocks */}
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 1. Overview */}
        <Overview data={analysis.overview} />

        {/* 2. Kill Distribution */}
        {killDistribution && <KillDistribution data={killDistribution} />}

        {/* 3. Laning Efficiency */}
        <LaningEfficiency data={analysis.laning} />

        {/* 4. Combat Analysis */}
        <CombatAnalysis data={analysis.combat} />

        {/* 5. Farm & Scaling */}
        <FarmScaling data={analysis.farmScaling} />

        {/* 6. Item Progression */}
        <ItemProgression data={analysis.itemProgression} />

        {/* 7. Objective Contribution */}
        <Objectives data={analysis.objectives} />

        {/* 8. Teamfights Analysis */}
        <Teamfights data={analysis.teamfights} />

        {/* 9. Critical Errors */}
        <CriticalErrors data={analysis.criticalErrors} />
      </div>

      {/* Back button */}
      <div className="flex justify-center">
        <button
          onClick={() =>
            router.push(
              `/dashboard/matches/${matchId}${
                playerId ? `?playerId=${playerId}` : ''
              }`,
            )
          }
          className="text-sm text-neutral-300 hover:text-white"
        >
          ← Torna al dettaglio partita
        </button>
      </div>
    </div>
  )
}
