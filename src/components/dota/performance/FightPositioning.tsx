/**
 * Componente FightPositioning - Indicatori qualitativi per posizionamento nei fight
 * Stati: "Troppo avanti" / "Posizione ideale" / "Troppo arretrato"
 */

interface FightPositioningProps {
  averageDistanceAllies: number
  averageDistanceEnemies: number
  deathsInFight: number
  fightDuration: number
}

export default function FightPositioning({
  averageDistanceAllies,
  averageDistanceEnemies,
  deathsInFight,
  fightDuration,
}: FightPositioningProps) {
  // Logica qualitativa per determinare posizionamento
  const getPositioning = () => {
    const distanceRatio =
      averageDistanceEnemies / Math.max(1, averageDistanceAllies)
    const deathRate = deathsInFight / Math.max(1, fightDuration)

    if (distanceRatio < 0.7 && deathRate > 0.3) {
      return {
        status: 'Troppo avanti',
        color: 'bg-red-900/40 text-red-300 border-red-800',
        description: 'Sei troppo vicino ai nemici e muori spesso nei fight',
      }
    }
    if (distanceRatio > 1.5 && deathRate < 0.1) {
      return {
        status: 'Troppo arretrato',
        color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
        description:
          'Sei troppo lontano dai fight, potresti partecipare di più',
      }
    }
    return {
      status: 'Posizione ideale',
      color: 'bg-green-900/40 text-green-300 border-green-800',
      description: 'Il tuo posizionamento nei fight è bilanciato',
    }
  }

  const positioning = getPositioning()

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">
        Fight Positioning
      </h3>
      <div className="mb-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${positioning.color}`}
        >
          {positioning.status}
        </span>
      </div>
      <p className="mb-3 text-xs text-neutral-300">{positioning.description}</p>
      <div className="space-y-2 text-xs text-neutral-400">
        <div className="flex justify-between">
          <span>Distanza media alleati:</span>
          <span className="text-neutral-300">
            {averageDistanceAllies.toFixed(0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Distanza media nemici:</span>
          <span className="text-neutral-300">
            {averageDistanceEnemies.toFixed(0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Morti nei fight:</span>
          <span className="text-neutral-300">{deathsInFight.toFixed(1)}</span>
        </div>
      </div>
    </div>
  )
}
