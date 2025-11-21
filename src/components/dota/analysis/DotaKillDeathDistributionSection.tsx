'use client'

import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'
import { formatPercentageOrNA } from '@/utils/dotaFormatting'

interface DotaKillDeathDistributionSectionProps {
  analysis: DotaPlayerMatchAnalysis
}

/**
 * Componente per visualizzare la distribuzione di kill per fase (Early/Mid/Late) - TIER 1 ONLY
 *
 * Dati letti da: dota_player_match_analysis.kills_early/mid/late, kill_pct_early/mid/late
 * Mapping: analysis.killDistribution.{early, mid, late}, analysis.killPercentageDistribution.{early, mid, late}
 *
 * IMPORTANTE: I valori sono sempre presenti (default 0 dal DB), ma usiamo formatPercentageOrNA per sicurezza.
 *
 * [REMOVED - TIER 2/3] Death distribution has been removed as it depends on deaths_log which is not guaranteed by OpenDota API.
 */
export default function DotaKillDeathDistributionSection({
  analysis,
}: DotaKillDeathDistributionSectionProps) {
  // Log tracciabilità dati (solo Tier 1)
  console.log('[DOTA-KILL-DIST] Rendering kill distribution (Tier 1 only)', {
    kills: analysis.killDistribution,
    killPct: analysis.killPercentageDistribution,
  })

  // Dati per grafico kill distribution (TIER 1 - kills_log garantito)
  const killData = [
    {
      label: 'Early',
      value: analysis.killDistribution.early,
      color: '#22c55e', // Green
    },
    {
      label: 'Mid',
      value: analysis.killDistribution.mid,
      color: '#f59e0b', // Orange
    },
    {
      label: 'Late',
      value: analysis.killDistribution.late,
      color: '#ef4444', // Red
    },
  ]

  // Insight placeholder (da migliorare con logica più sofisticata)
  const getKillInsight = (): string => {
    const { early, mid, late } = analysis.killPercentageDistribution
    if (late > 50) {
      return 'Ottima distribuzione: la maggior parte delle kill in late game, ideale per un carry.'
    } else if (mid > 50) {
      return 'Kill concentrate in mid game. Valuta se anticipare o posticipare il timing.'
    } else if (early > 50) {
      return 'Molte kill in early game. Assicurati di mantenere il vantaggio in mid/late.'
    }
    return 'Distribuzione bilanciata delle kill tra le fasi.'
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-base font-semibold text-neutral-200">
        Kill Distribution per Fase (TIER 1)
      </h3>
      <p className="mb-4 text-xs text-neutral-400">
        Distribuzione delle kill nelle tre fasi di gioco (Early: 0-10min, Mid:
        10-30min, Late: 30+min). Dati garantiti da OpenDota API tramite
        kills_log.
      </p>

      <div className="mb-4 h-[200px]">
        <BarChart data={killData} width={560} height={200} />
      </div>

      {/* Percentuali */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
          <div className="text-xs text-neutral-400">Early</div>
          <div className="text-sm font-semibold text-green-400">
            {formatPercentageOrNA(analysis.killPercentageDistribution.early, 1)}
          </div>
          <div className="text-xs text-neutral-500">
            {analysis.killDistribution.early} kill
          </div>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
          <div className="text-xs text-neutral-400">Mid</div>
          <div className="text-sm font-semibold text-orange-400">
            {formatPercentageOrNA(analysis.killPercentageDistribution.mid, 1)}
          </div>
          <div className="text-xs text-neutral-500">
            {analysis.killDistribution.mid} kill
          </div>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
          <div className="text-xs text-neutral-400">Late</div>
          <div className="text-sm font-semibold text-red-400">
            {formatPercentageOrNA(analysis.killPercentageDistribution.late, 1)}
          </div>
          <div className="text-xs text-neutral-500">
            {analysis.killDistribution.late} kill
          </div>
        </div>
      </div>

      <ExplanationCard
        title="Insight Kill Distribution"
        description={getKillInsight()}
      />
    </div>
  )
}
