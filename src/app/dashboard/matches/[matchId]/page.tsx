/**
 * Match Analysis PRO Page
 *
 * Enterprise-grade match analysis using Tier 1 data only
 * Structured in vertical blocks with centralized calculation logic
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { MatchAnalysis } from '@/types/matchAnalysis'
import SkeletonLoader, {
  SkeletonGrid,
  SkeletonChart,
} from '@/components/ui/SkeletonLoader'
import { MatchHeaderBlock } from '@/components/dota/matchAnalysis/MatchHeaderBlock'
import { KillDistributionBlock } from '@/components/dota/matchAnalysis/KillDistributionBlock'
import { LaningBlock } from '@/components/dota/matchAnalysis/LaningBlock'
import { FarmScalingBlock } from '@/components/dota/matchAnalysis/FarmScalingBlock'
import { BuildBlock } from '@/components/dota/matchAnalysis/BuildBlock'
import { CombatBlock } from '@/components/dota/matchAnalysis/CombatBlock'
import { VisionBlock } from '@/components/dota/matchAnalysis/VisionBlock'
import { ObjectivesBlock } from '@/components/dota/matchAnalysis/ObjectivesBlock'
import { ActionsBlock } from '@/components/dota/matchAnalysis/ActionsBlock'

export default function MatchDetailPage() {
  const params = useParams()
  const search = useSearchParams()
  const router = useRouter()

  const matchId = params?.matchId as string
  const playerId = search.get('playerId') || ''

  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
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

        const res = await fetch(
          `/api/matches/analysis?matchId=${matchId}&playerId=${playerId}`,
          { cache: 'no-store' },
        )

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }

        const json: MatchAnalysis = await res.json()
        if (active) setAnalysis(json)
      } catch (e: any) {
        console.error('[MATCH-ANALYSIS-PRO] Error loading analysis:', e)
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

  return (
    <div className="space-y-6">
      {/* Back button */}
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

      {/* Loading state */}
      {loading && (
        <div className="space-y-6 duration-300 animate-in fade-in">
          <SkeletonLoader variant="text" className="mb-2 w-1/3" />
          <SkeletonGrid cols={4} />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-400">
          <div className="font-semibold">Errore nel caricamento</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Main content */}
      {!loading && !error && analysis && (
        <section className="mx-auto max-w-6xl space-y-6">
          {/* Block 1: Match Header */}
          <MatchHeaderBlock data={analysis.header} />

          {/* Block 2: Kill Distribution */}
          <KillDistributionBlock data={analysis.killDistribution} />

          {/* Block 3: Laning */}
          {analysis.laning.status === 'available' && (
            <LaningBlock data={analysis.laning} />
          )}

          {/* Block 4: Farm & Scaling */}
          {analysis.farmScaling.status === 'available' && (
            <FarmScalingBlock data={analysis.farmScaling} />
          )}

          {/* Block 5: Build */}
          {analysis.build.status === 'available' && (
            <BuildBlock data={analysis.build} />
          )}

          {/* Block 6: Combat & Teamfights */}
          {analysis.combat.status === 'available' && (
            <CombatBlock data={analysis.combat} />
          )}

          {/* Block 7: Vision */}
          {analysis.vision.status === 'available' && (
            <VisionBlock data={analysis.vision} />
          )}

          {/* Block 8: Objectives */}
          {analysis.objectives.status === 'available' && (
            <ObjectivesBlock data={analysis.objectives} />
          )}

          {/* Block 9: Actions */}
          {analysis.actions.status === 'available' && (
            <ActionsBlock data={analysis.actions} />
          )}

          {/* Link to complete analysis */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-200">
                  Analisi Completa FZTH
                </h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Per un&apos;analisi ancora più approfondita, visita la pagina
                  di analisi completa.
                </p>
              </div>
              <Link
                href={`/dota/matches/${matchId}/players/${playerId}`}
                className="rounded-md border border-blue-600/50 bg-blue-950/30 px-4 py-2 text-sm font-medium text-blue-300 transition-all hover:border-blue-500 hover:bg-blue-950/50 hover:text-blue-200"
              >
                Analisi completa →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && !error && !analysis && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 text-center">
          <div className="text-neutral-400">
            Nessun dato disponibile per questa analisi
          </div>
        </div>
      )}
    </div>
  )
}
