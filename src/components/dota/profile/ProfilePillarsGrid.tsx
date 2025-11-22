/**
 * Profile Pillars Grid Component
 *
 * Displays 5 pillars in a grid layout
 */

import type { ProfilePillar } from '@/lib/dota/profile/types'

interface ProfilePillarsGridProps {
  pillars: ProfilePillar[]
}

export function ProfilePillarsGrid({
  pillars,
}: ProfilePillarsGridProps): React.JSX.Element {
  const getTrendIcon = (trend: 'up' | 'flat' | 'down') => {
    switch (trend) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return '→'
    }
  }

  const getTrendColor = (trend: 'up' | 'flat' | 'down') => {
    switch (trend) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-neutral-400'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Pilastri di Competenza
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.id}
            className="min-h-[140px] rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-200">
                {pillar.label}
              </h3>
              <span
                className={`text-lg font-bold ${getTrendColor(pillar.trend)}`}
                title={
                  pillar.trend === 'up'
                    ? 'In miglioramento'
                    : pillar.trend === 'down'
                      ? 'In calo'
                      : 'Stabile'
                }
              >
                {getTrendIcon(pillar.trend)}
              </span>
            </div>
            <div className="mb-2">
              <div className="mb-1 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold ${getScoreColor(
                    pillar.score,
                  )}`}
                >
                  {pillar.score}
                </span>
                <span className="text-sm text-neutral-500">/100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    pillar.score >= 80
                      ? 'bg-green-600'
                      : pillar.score >= 60
                        ? 'bg-yellow-600'
                        : pillar.score >= 40
                          ? 'bg-orange-600'
                          : 'bg-red-600'
                  }`}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>
            </div>
            <p className="mb-2 text-xs text-neutral-500">
              {pillar.description}
            </p>
            <p className="text-xs text-neutral-400">{pillar.insight}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
