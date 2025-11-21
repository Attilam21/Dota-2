/**
 * Componente BuildMismatch - Mostra differenza % tra build giocatore e meta
 */

interface BuildMismatchProps {
  playerBuild: string[]
  metaBuild: string[]
  divergence: number // 0-100
}

export default function BuildMismatch({
  playerBuild,
  metaBuild,
  divergence,
}: BuildMismatchProps) {
  const getDivergenceColor = (div: number) => {
    if (div < 20) return 'text-green-400'
    if (div < 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getDivergenceLabel = (div: number) => {
    if (div < 20) return 'Allineato al meta'
    if (div < 40) return 'Parzialmente diverso'
    return 'Molto diverso dal meta'
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">
        Build Mismatch Detection
      </h3>
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-neutral-400">Divergenza</span>
          <span className={`font-semibold ${getDivergenceColor(divergence)}`}>
            {divergence.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-900">
          <div
            className={`h-2 rounded-full ${
              divergence < 20
                ? 'bg-green-500'
                : divergence < 40
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${divergence}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-neutral-400">
          {getDivergenceLabel(divergence)}
        </div>
      </div>
      <div className="space-y-2 text-xs">
        <div>
          <div className="mb-1 text-neutral-400">Tua build:</div>
          <div className="text-neutral-300">
            {playerBuild.length > 0
              ? playerBuild.join(', ')
              : 'Nessun dato disponibile'}
          </div>
        </div>
        <div>
          <div className="mb-1 text-neutral-400">Meta build:</div>
          <div className="text-neutral-300">
            {metaBuild.length > 0
              ? metaBuild.join(', ')
              : 'Nessun dato disponibile'}
          </div>
        </div>
      </div>
    </div>
  )
}
