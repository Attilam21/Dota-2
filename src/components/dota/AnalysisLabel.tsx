/**
 * Analysis Label Component
 *
 * Displays a clear label indicating whether the analysis is:
 * - GLOBAL (based on last N matches, max 20)
 * - MATCH-SPECIFIC (based on a single match)
 */

interface AnalysisLabelProps {
  type: 'global' | 'match'
  matchId?: number
}

export function AnalysisLabel({ type, matchId }: AnalysisLabelProps) {
  if (type === 'global') {
    return (
      <div className="mb-4 rounded-lg border border-blue-800/30 bg-blue-950/20 px-4 py-2">
        <p className="text-sm text-blue-300">
          📊 Analisi basata sulle ultime N partite (max 20)
        </p>
      </div>
    )
  }

  if (type === 'match' && matchId) {
    return (
      <div className="mb-4 rounded-lg border border-purple-800/30 bg-purple-950/20 px-4 py-2">
        <p className="text-sm text-purple-300">
          🎯 Analisi della partita #{matchId} — dati esclusivamente di questo
          match
        </p>
      </div>
    )
  }

  return null
}
