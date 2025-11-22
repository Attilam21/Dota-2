/**
 * Critical Errors Component
 *
 * Displays critical mistakes and missed opportunities
 */

import type { CriticalErrorsAnalysisData } from '@/lib/dota/analysis/computeCriticalErrors'

interface CriticalErrorsProps {
  data: CriticalErrorsAnalysisData
}

export function CriticalErrors({
  data,
}: CriticalErrorsProps): React.JSX.Element {
  if (data.errors.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-200">
          Critical Errors
        </h2>
        <div className="rounded-lg border border-green-800/50 bg-green-900/20 p-4 text-center">
          <div className="text-sm font-medium text-green-300">
            Nessun errore critico identificato
          </div>
          <div className="mt-2 text-xs text-green-400/80">
            Partita senza errori significativi rilevati.
          </div>
        </div>
      </div>
    )
  }

  const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high':
        return 'text-red-400 border-red-800/50 bg-red-900/20'
      case 'medium':
        return 'text-yellow-400 border-yellow-800/50 bg-yellow-900/20'
      case 'low':
        return 'text-blue-400 border-blue-800/50 bg-blue-900/20'
      default:
        return 'text-neutral-400 border-neutral-800/50 bg-neutral-900/20'
    }
  }

  const getSeverityLabel = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high':
        return 'Alto'
      case 'medium':
        return 'Medio'
      case 'low':
        return 'Basso'
      default:
        return '—'
    }
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Critical Errors
      </h2>
      <div className="space-y-3">
        {data.errors.map((error, idx) => (
          <div
            key={idx}
            className={`rounded-lg border p-4 ${getSeverityColor(
              error.severity,
            )}`}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      error.severity === 'high'
                        ? 'bg-red-900/50 text-red-200'
                        : error.severity === 'medium'
                          ? 'bg-yellow-900/50 text-yellow-200'
                          : 'bg-blue-900/50 text-blue-200'
                    }`}
                  >
                    {getSeverityLabel(error.severity)}
                  </span>
                  <span className="text-sm font-medium">{error.type}</span>
                </div>
                <div className="mb-2 text-sm">{error.description}</div>
              </div>
            </div>
            <div className="border-current/30 bg-current/10 rounded border p-2">
              <div className="text-xs font-semibold opacity-80">
                Suggerimento:
              </div>
              <div className="mt-1 text-xs">{error.suggestion}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
