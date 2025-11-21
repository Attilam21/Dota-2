/**
 * Componente WowInsights - Mostra 4 insights generati da logiche fisse
 * Componente puramente visual, logica di calcolo nella pagina parent
 */

interface WowInsightsProps {
  insights: {
    fastWinrate: string
    earlyDeathPunish: string
    level6Impact: string
    buildMismatch: string
  }
}

export default function WowInsights({ insights }: WowInsightsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Match Duration Insight */}
      <div className="rounded-lg border border-blue-800 bg-blue-900/20 p-4">
        <div className="mb-2 text-xs font-medium text-blue-300">
          ⚡ Match Duration
        </div>
        <p className="text-sm text-neutral-300">{insights.fastWinrate}</p>
      </div>

      {/* Early Death Insight */}
      <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
        <div className="mb-2 text-xs font-medium text-red-300">
          ⚠️ Early Death Impact
        </div>
        <p className="text-sm text-neutral-300">{insights.earlyDeathPunish}</p>
      </div>

      {/* Level 6 Timing Insight */}
      <div className="rounded-lg border border-green-800 bg-green-900/20 p-4">
        <div className="mb-2 text-xs font-medium text-green-300">
          🎯 Level 6 Timing
        </div>
        <p className="text-sm text-neutral-300">{insights.level6Impact}</p>
      </div>

      {/* Build Insight */}
      <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
        <div className="mb-2 text-xs font-medium text-yellow-300">
          🔧 Build Mismatch
        </div>
        <p className="text-sm text-neutral-300">{insights.buildMismatch}</p>
      </div>
    </div>
  )
}
