/**
 * Profile Summary Component
 *
 * Displays executive summary with 3 bullet points
 */

import type { PlayerProfileAggregate } from '@/lib/dota/profile/types'

interface ProfileSummaryProps {
  data: PlayerProfileAggregate
}

export function ProfileSummary({
  data,
}: ProfileSummaryProps): React.JSX.Element {
  // Find main strength (highest pillar score)
  const mainStrength = data.pillars.reduce((best, current) =>
    current.score > best.score ? current : best,
  )

  // Find improving area (pillar with upward trend)
  const improvingArea = data.pillars.find((p) => p.trend === 'up')

  // Find focus area (from focusAreas, highest severity)
  const focusArea =
    data.focusAreas.find((a) => a.severity === 'high') || data.focusAreas[0]

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Executive Summary
      </h2>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-lg text-green-400">✓</span>
          <div>
            <div className="text-sm font-semibold text-neutral-200">
              Punto di forza principale
            </div>
            <div className="text-sm text-neutral-400">
              {mainStrength.label} con score {mainStrength.score}/100.{' '}
              {mainStrength.insight}
            </div>
          </div>
        </div>
        {improvingArea && (
          <div className="flex items-start gap-3">
            <span className="text-lg text-blue-400">↑</span>
            <div>
              <div className="text-sm font-semibold text-neutral-200">
                Area in miglioramento
              </div>
              <div className="text-sm text-neutral-400">
                {improvingArea.label} sta migliorando (
                {improvingArea.trend === 'up' ? 'trend positivo' : 'stabile'}).{' '}
                Continua a lavorare su questo pilastro.
              </div>
            </div>
          </div>
        )}
        {focusArea && (
          <div className="flex items-start gap-3">
            <span className="text-lg text-orange-400">🎯</span>
            <div>
              <div className="text-sm font-semibold text-neutral-200">
                Focus per le prossime 10 partite
              </div>
              <div className="text-sm text-neutral-400">
                {focusArea.title}: {focusArea.rationale}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
