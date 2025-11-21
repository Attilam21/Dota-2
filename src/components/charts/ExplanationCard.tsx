/**
 * Card esplicativa da mostrare sotto i grafici
 * Fornisce spiegazioni semplici e chiare in italiano
 */

interface ExplanationCardProps {
  title: string
  description: string
  interpretation?: string
  timeRange?: string
}

export default function ExplanationCard({
  title,
  description,
  interpretation,
  timeRange,
}: ExplanationCardProps) {
  return (
    <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <div className="mb-2 text-sm font-medium text-neutral-200">{title}</div>
      <div className="text-xs text-neutral-400">{description}</div>
      {timeRange && (
        <div className="mt-2 text-[10px] text-neutral-500">
          Periodo: {timeRange}
        </div>
      )}
      {interpretation && (
        <div className="mt-2 text-xs italic text-neutral-300">
          {interpretation}
        </div>
      )}
    </div>
  )
}
