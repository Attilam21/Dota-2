/**
 * Componente HeroMetaReference - Mostra dati meta per un eroe
 */

interface HeroMetaReferenceProps {
  hero: string
  metaWinrate: number
  metaPickrate: number
  metaBuild: string[]
}

export default function HeroMetaReference({
  hero,
  metaWinrate,
  metaPickrate,
  metaBuild,
}: HeroMetaReferenceProps) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">
        Meta Reference - {hero}
      </h3>
      <div className="space-y-3 text-xs">
        <div className="flex justify-between">
          <span className="text-neutral-400">Meta Winrate:</span>
          <span
            className={`font-semibold ${
              metaWinrate >= 50 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {metaWinrate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Meta Pickrate:</span>
          <span className="font-semibold text-neutral-300">
            {metaPickrate.toFixed(1)}%
          </span>
        </div>
        {metaBuild.length > 0 && (
          <div>
            <div className="mb-1 text-neutral-400">Meta Build:</div>
            <div className="text-neutral-300">{metaBuild.join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  )
}
