'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'
import DotaOverviewCard from '@/components/dota/analysis/DotaOverviewCard'
import DotaKillDeathDistributionSection from '@/components/dota/analysis/DotaKillDeathDistributionSection'

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

        // Log tracciabilità: caricamento analisi (TIER 1 ONLY)
        console.log(
          '[DOTA-MATCH-ANALYSIS-PAGE] Loading analysis (Tier 1 only)',
          {
            matchId,
            accountId,
          },
        )

        const res = await fetch(
          `/api/dota/matches/${matchId}/players/${accountId}/analysis`,
          { cache: 'no-store' },
        )

        if (!res.ok) {
          const msg = await res.json().catch(() => ({}))
          console.error('[DOTA-MATCH-ANALYSIS-PAGE] API error', {
            status: res.status,
            error: msg?.error,
          })
          throw new Error(msg?.error || `HTTP ${res.status}`)
        }

        const json: DotaPlayerMatchAnalysis = await res.json()

        // Log tracciabilità: analisi caricata (TIER 1 ONLY)
        console.log(
          '[DOTA-MATCH-ANALYSIS-PAGE] Analysis loaded successfully (Tier 1 only)',
          {
            matchId: json.matchId,
            accountId: json.accountId,
            rolePosition: json.rolePosition,
            killDistribution: json.killDistribution,
          },
        )

        if (active) setAnalysis(json)
      } catch (e: any) {
        if (active) setError(e?.message ?? 'Errore sconosciuto')
        console.error('[DOTA-MATCH-ANALYSIS-PAGE] Error loading analysis:', e)
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

      {/* Main content (TIER 1 ONLY) */}
      {!loading && !error && analysis && (
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-semibold">
              Analisi Match Dota 2 (TIER 1 ONLY)
            </h1>
            <p className="text-sm text-neutral-400">
              Match #{analysis.matchId} • Player #{analysis.accountId}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Solo dati garantiti da OpenDota API (kills_log, player.role, etc.)
            </p>
          </div>

          {/* Section 1: Header / Overview */}
          <DotaOverviewCard
            analysis={analysis}
            matchId={Number(matchId)}
            accountId={Number(accountId)}
          />

          {/* Section 2: Kill Distribution per fase (TIER 1 ONLY) */}
          <DotaKillDeathDistributionSection analysis={analysis} />
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
