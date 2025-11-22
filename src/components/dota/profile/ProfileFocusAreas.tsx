/**
 * Profile Focus Areas Component
 *
 * Displays priority areas for improvement
 */

import type { FocusArea } from '@/lib/dota/profile/types'
import Link from 'next/link'

interface ProfileFocusAreasProps {
  areas: FocusArea[]
}

export function ProfileFocusAreas({
  areas,
}: ProfileFocusAreasProps): React.JSX.Element {
  if (areas.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-200">
          Aree di Miglioramento
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-center text-sm text-neutral-500">
          Nessuna area critica identificata. Continua a lavorare sui tuoi punti
          di forza.
        </div>
      </div>
    )
  }

  const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high':
        return 'border-red-800/50 bg-red-900/20 text-red-300'
      case 'medium':
        return 'border-yellow-800/50 bg-yellow-900/20 text-yellow-300'
      case 'low':
        return 'border-blue-800/50 bg-blue-900/20 text-blue-300'
      default:
        return 'border-neutral-800/50 bg-neutral-900/20 text-neutral-300'
    }
  }

  const getSeverityLabel = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high':
        return 'Alta Priorità'
      case 'medium':
        return 'Media Priorità'
      case 'low':
        return 'Bassa Priorità'
      default:
        return '—'
    }
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        Aree di Miglioramento Prioritarie
      </h2>
      <div className="space-y-3">
        {areas.map((area, idx) => (
          <div
            key={idx}
            className={`rounded-lg border p-4 ${getSeverityColor(
              area.severity,
            )}`}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      area.severity === 'high'
                        ? 'bg-red-900/50 text-red-200'
                        : area.severity === 'medium'
                          ? 'bg-yellow-900/50 text-yellow-200'
                          : 'bg-blue-900/50 text-blue-200'
                    }`}
                  >
                    {getSeverityLabel(area.severity)}
                  </span>
                  <h3 className="text-sm font-semibold">{area.title}</h3>
                </div>
                <p className="mt-2 text-xs opacity-90">{area.rationale}</p>
              </div>
            </div>
            <div className="mt-3">
              <Link
                href={area.suggestedActionHref}
                className="border-current/30 bg-current/10 hover:bg-current/20 inline-block rounded-md border px-3 py-1.5 text-xs font-medium transition-all"
              >
                {area.suggestedActionLabel} →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
