/**
 * Performance Style Trend Chart Component
 *
 * Displays a multi-line chart showing the evolution of 3 indices:
 * - Aggressiveness (0-100)
 * - Farm Efficiency (0-100)
 * - Macro Gameplay (0-100)
 */

import MultiLineChart from '@/components/charts/MultiLineChart'
import type { StyleTrendPoint } from '@/types/playerPerformance'

interface PerformanceStyleTrendProps {
  trend: StyleTrendPoint[]
}

export default function PerformanceStyleTrend({
  trend,
}: PerformanceStyleTrendProps): React.JSX.Element {
  // HARDENED: Handle null/undefined/empty trend gracefully
  if (!trend || !Array.isArray(trend) || trend.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <h2 className="mb-3 text-lg font-semibold text-neutral-200">
          Trend di Stile
        </h2>
        <div className="text-sm text-neutral-500">
          Dati insufficienti per visualizzare il trend di stile.
        </div>
      </div>
    )
  }

  // Prepare data for MultiLineChart
  const chartData = trend.map((point) => ({
    x: point.index,
    aggressiveness: point.aggressiveness ?? undefined,
    farmEfficiency: point.farmEfficiency ?? undefined,
    macroGameplay: point.macroGameplay ?? undefined,
  }))

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-lg font-semibold text-neutral-200">
        Trend di Stile
      </h2>
      <div className="h-[280px]">
        <MultiLineChart
          data={chartData}
          lines={[
            {
              key: 'aggressiveness',
              color: '#f59e0b', // Yellow/Orange for Aggressiveness
              label: 'Aggressività',
            },
            {
              key: 'farmEfficiency',
              color: '#22c55e', // Green for Farm
              label: 'Farm Efficiency',
            },
            {
              key: 'macroGameplay',
              color: '#60a5fa', // Blue for Macro
              label: 'Macro Gameplay',
            },
          ]}
          width={800}
          height={280}
        />
      </div>
      <div className="mt-3 text-xs text-neutral-400">
        Evoluzione degli indici di stile di gioco nelle ultime {trend.length}{' '}
        partite
      </div>
    </div>
  )
}
