'use client'

import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'

interface DotaKillDeathDistributionSectionProps {
  analysis: DotaPlayerMatchAnalysis
}

/**
 * Componente per visualizzare la distribuzione di kill e morti per fase (Early/Mid/Late)
 */
export default function DotaKillDeathDistributionSection({
  analysis,
}: DotaKillDeathDistributionSectionProps) {
  // Dati per grafico kill distribution
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

  // Dati per grafico death distribution
  const deathData = [
    {
      label: 'Early',
      value: analysis.deathDistribution.early,
      color: '#ef4444', // Red
    },
    {
      label: 'Mid',
      value: analysis.deathDistribution.mid,
      color: '#f59e0b', // Orange
    },
    {
      label: 'Late',
      value: analysis.deathDistribution.late,
      color: '#22c55e', // Green
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

  const getDeathInsight = (): string => {
    const { early, mid, late } = analysis.deathPercentageDistribution
    if (early > 50) {
      return 'Attenzione: troppe morti in early game. Migliora il posizionamento e la mappa awareness.'
    } else if (mid > 50) {
      return 'Morti concentrate in mid game. Valuta il timing dei fight e la visione.'
    } else if (late > 50) {
      return 'Morti principalmente in late game. Focalizzati sulla sopravvivenza e buyback management.'
    }
    return 'Distribuzione delle morti bilanciata tra le fasi.'
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Kill Distribution Card */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h3 className="mb-3 text-base font-semibold text-neutral-200">
          Kill Distribution per Fase
        </h3>
        <p className="mb-4 text-xs text-neutral-400">
          Distribuzione delle kill nelle tre fasi di gioco (Early: 0-10min, Mid:
          10-30min, Late: 30+min)
        </p>

        <div className="mb-4 h-[200px]">
          <BarChart data={killData} width={560} height={200} />
        </div>

        {/* Percentuali */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
            <div className="text-xs text-neutral-400">Early</div>
            <div className="text-sm font-semibold text-green-400">
              {analysis.killPercentageDistribution.early.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500">
              {analysis.killDistribution.early} kill
            </div>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
            <div className="text-xs text-neutral-400">Mid</div>
            <div className="text-sm font-semibold text-orange-400">
              {analysis.killPercentageDistribution.mid.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500">
              {analysis.killDistribution.mid} kill
            </div>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
            <div className="text-xs text-neutral-400">Late</div>
            <div className="text-sm font-semibold text-red-400">
              {analysis.killPercentageDistribution.late.toFixed(1)}%
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

      {/* Death Distribution Card */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h3 className="mb-3 text-base font-semibold text-neutral-200">
          Death Distribution per Fase
        </h3>
        <p className="mb-4 text-xs text-neutral-400">
          Distribuzione delle morti nelle tre fasi di gioco (Early: 0-10min,
          Mid: 10-30min, Late: 30+min)
        </p>

        <div className="mb-4 h-[200px]">
          <BarChart data={deathData} width={560} height={200} />
        </div>

        {/* Percentuali */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
            <div className="text-xs text-neutral-400">Early</div>
            <div className="text-sm font-semibold text-red-400">
              {analysis.deathPercentageDistribution.early.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500">
              {analysis.deathDistribution.early} morti
            </div>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
            <div className="text-xs text-neutral-400">Mid</div>
            <div className="text-sm font-semibold text-orange-400">
              {analysis.deathPercentageDistribution.mid.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500">
              {analysis.deathDistribution.mid} morti
            </div>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900/70 p-2">
            <div className="text-xs text-neutral-400">Late</div>
            <div className="text-sm font-semibold text-green-400">
              {analysis.deathPercentageDistribution.late.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500">
              {analysis.deathDistribution.late} morti
            </div>
          </div>
        </div>

        <ExplanationCard
          title="Insight Death Distribution"
          description={getDeathInsight()}
        />
      </div>
    </div>
  )
}
