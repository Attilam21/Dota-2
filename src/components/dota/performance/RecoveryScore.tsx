/**
 * Componente RecoveryScore - Indicatore 0-100 per capacità di recovery
 * Calcolo lato pagina: (recovery_gpm + recovery_xpm + comeback_kills) / 3
 */

interface RecoveryScoreProps {
  score: number // 0-100
  recoveryGpm?: number
  recoveryXpm?: number
  comebackKills?: number
}

export default function RecoveryScore({
  score,
  recoveryGpm,
  recoveryXpm,
  comebackKills,
}: RecoveryScoreProps) {
  const normalizedScore = Math.max(0, Math.min(100, score))

  const getScoreLabel = (s: number) => {
    if (s >= 70) return { label: 'Eccellente', color: 'text-green-400' }
    if (s >= 50) return { label: 'Buono', color: 'text-blue-400' }
    if (s >= 30) return { label: 'Medio', color: 'text-yellow-400' }
    return { label: 'Da migliorare', color: 'text-red-400' }
  }

  const scoreInfo = getScoreLabel(normalizedScore)

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">
        Recovery Index
      </h3>
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-neutral-400">Score</span>
          <span className={`font-semibold ${scoreInfo.color}`}>
            {normalizedScore.toFixed(0)} / 100
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-neutral-900">
          <div
            className={`h-3 rounded-full ${
              normalizedScore >= 70
                ? 'bg-green-500'
                : normalizedScore >= 50
                  ? 'bg-blue-500'
                  : normalizedScore >= 30
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            }`}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
      </div>
      <div className="mb-2 text-xs font-medium text-neutral-300">
        {scoreInfo.label}
      </div>
      {(recoveryGpm !== undefined ||
        recoveryXpm !== undefined ||
        comebackKills !== undefined) && (
        <div className="mt-3 space-y-1 text-xs text-neutral-400">
          {recoveryGpm !== undefined && (
            <div className="flex justify-between">
              <span>Recovery GPM:</span>
              <span className="text-neutral-300">{recoveryGpm.toFixed(0)}</span>
            </div>
          )}
          {recoveryXpm !== undefined && (
            <div className="flex justify-between">
              <span>Recovery XPM:</span>
              <span className="text-neutral-300">{recoveryXpm.toFixed(0)}</span>
            </div>
          )}
          {comebackKills !== undefined && (
            <div className="flex justify-between">
              <span>Comeback Kills:</span>
              <span className="text-neutral-300">
                {comebackKills.toFixed(0)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
