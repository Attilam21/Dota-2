'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'
import DotaOverviewCard from '@/components/dota/analysis/DotaOverviewCard'
import DotaKillDeathDistributionSection from '@/components/dota/analysis/DotaKillDeathDistributionSection'
import DotaDeathCostSection from '@/components/dota/analysis/DotaDeathCostSection'
import DotaDeathByRoleSection from '@/components/dota/analysis/DotaDeathByRoleSection'
import DotaDeathHeatmapSection from '@/components/dota/analysis/DotaDeathHeatmapSection'

export default function DotaMatchPlayerAnalysisPage() {
  const params = useParams()
  const router = useRouter()

  const matchId = params?.matchId as string
  const accountId = params?.accountId as string

  const [analysis, setAnalysis] = useState<DotaPlayerMatchAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true
    async function load() {
      if (!matchId || !accountId) {
        setError('Parametri mancanti: matchId e accountId sono richiesti')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `/api/dota/matches/${matchId}/players/${accountId}/analysis`,
          { cache: 'no-store' },
        )

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }

        const json: DotaPlayerMatchAnalysis = await res.json()
        if (active) setAnalysis(json)
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Errore sconosciuto')
        console.error('Error loading Dota match analysis:', e)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [matchId, accountId])

  return (
    <div className="space-y-6 text-white">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/matches')}
          className="text-sm text-neutral-300 hover:text-white"
        >
          ← Torna alle partite
        </button>
        {matchId && accountId && (
          <Link
            href={`/dashboard/matches/${matchId}?playerId=${accountId}`}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Dettaglio match standard
          </Link>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-neutral-400">Caricamento analisi partita…</div>
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
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-semibold">Analisi Match Dota 2</h1>
            <p className="text-sm text-neutral-400">
              Match #{analysis.matchId} • Player #{analysis.accountId}
            </p>
          </div>

          {/* Section 1: Header / Overview */}
          <DotaOverviewCard
            analysis={analysis}
            matchId={Number(matchId)}
            accountId={Number(accountId)}
          />

          {/* Section 2: Kill & Death Distribution per fase */}
          <DotaKillDeathDistributionSection analysis={analysis} />

          {/* Section 3: Costo opportunità delle morti */}
          <DotaDeathCostSection analysis={analysis} />

          {/* Section 4: Death by Role */}
          <DotaDeathByRoleSection analysis={analysis} />

          {/* Section 5: Heatmap morti (opzionale) */}
          <DotaDeathHeatmapSection analysis={analysis} />
        </div>
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
