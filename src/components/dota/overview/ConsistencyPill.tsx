/**
 * Componente ConsistencyPill - Mostra grado di consistenza del giocatore
 * Badge: Stabile / Moderata / Altalenante
 */

interface ConsistencyPillProps {
  devStandardKDA: number
  devStandardDuration: number
  winrateRecent: number
  winrateGlobal: number
}

export default function ConsistencyPill({
  devStandardKDA,
  devStandardDuration,
  winrateRecent,
  winrateGlobal,
}: ConsistencyPillProps) {
  // Calcola varianza complessiva
  const kdaVariance = devStandardKDA
  const durationVariance = devStandardDuration
  const winrateVariance = Math.abs(winrateRecent - winrateGlobal)

  // Determina livello di consistenza
  const consistencyScore =
    (kdaVariance < 1.0 ? 1 : kdaVariance < 2.0 ? 0.5 : 0) +
    (durationVariance < 10 ? 1 : durationVariance < 20 ? 0.5 : 0) +
    (winrateVariance < 5 ? 1 : winrateVariance < 10 ? 0.5 : 0)

  const consistencyLevel =
    consistencyScore >= 2.5
      ? {
          label: 'Stabile',
          color: 'bg-green-900/40 text-green-300 border-green-800',
        }
      : consistencyScore >= 1.5
        ? {
            label: 'Moderata',
            color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
          }
        : {
            label: 'Altalenante',
            color: 'bg-red-900/40 text-red-300 border-red-800',
          }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">
        Consistenza Prestazioni
      </h3>
      <div className="mb-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${consistencyLevel.color}`}
        >
          {consistencyLevel.label}
        </span>
      </div>
      <div className="space-y-2 text-xs text-neutral-400">
        <div className="flex justify-between">
          <span>Dev. standard KDA:</span>
          <span className="text-neutral-300">{devStandardKDA.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Dev. standard Durata:</span>
          <span className="text-neutral-300">
            {devStandardDuration.toFixed(0)} min
          </span>
        </div>
        <div className="flex justify-between">
          <span>Winrate recente vs globale:</span>
          <span className="text-neutral-300">
            {winrateRecent.toFixed(1)}% vs {winrateGlobal.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}
