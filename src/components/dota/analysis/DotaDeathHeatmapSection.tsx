'use client'

import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'

interface DotaDeathHeatmapSectionProps {
  analysis: DotaPlayerMatchAnalysis
}

/**
 * Componente per visualizzare la heatmap delle morti sulla mappa (opzionale)
 * Se i dati posizione non sono disponibili, mostra un messaggio elegante
 */
export default function DotaDeathHeatmapSection({
  analysis,
}: DotaDeathHeatmapSectionProps) {
  // Verifica se ci sono eventi con posizioni
  const eventsWithPosition =
    analysis.deathEvents?.filter(
      (e) => e.posX !== undefined && e.posY !== undefined,
    ) ?? []

  const hasPositionData = eventsWithPosition.length > 0

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-base font-semibold text-neutral-200">
        Heatmap Morti
      </h3>
      <p className="mb-4 text-xs text-neutral-400">
        Visualizzazione delle posizioni delle morti sulla mappa Dota 2
      </p>

      {hasPositionData ? (
        <div>
          {/* Placeholder per la mappa - da implementare con logica di scaling e rendering */}
          <div className="relative mb-4 aspect-square w-full max-w-2xl rounded-lg border border-neutral-800 bg-neutral-950">
            {/* Mappa placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-sm text-neutral-400">
                  Mappa Dota 2
                </div>
                <div className="text-xs text-neutral-500">
                  {eventsWithPosition.length} morti con posizione disponibile
                </div>
              </div>
            </div>

            {/* Punti morti (placeholder - da implementare con coordinate reali) */}
            {eventsWithPosition.map((event, idx) => (
              <div
                key={idx}
                className="absolute h-2 w-2 rounded-full bg-red-500 opacity-70"
                style={{
                  // Placeholder: posizionamento semplificato
                  // In futuro: convertire posX/posY in coordinate SVG/pixel
                  left: `${50 + (event.posX ?? 0) * 0.1}%`,
                  top: `${50 + (event.posY ?? 0) * 0.1}%`,
                }}
                title={`Morte ${idx + 1} - ${event.phase}`}
              />
            ))}
          </div>

          {/* Info aggiuntive */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
            <div className="text-xs text-neutral-400">
              <strong>{eventsWithPosition.length}</strong> morti hanno dati di
              posizione disponibili
            </div>
            <div className="mt-1 text-[10px] text-neutral-500">
              Nota: Il rendering della mappa completa richiederà l&apos;immagine
              della mappa Dota 2 e la logica di scaling delle coordinate.
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-6 text-center">
          <div className="mb-2 text-sm text-neutral-400">
            Heatmap non disponibile per questo match
          </div>
          <div className="text-xs text-neutral-500">
            I dati di posizione (posX, posY) non sono disponibili da OpenDota
            per questo match. La heatmap sarà disponibile quando i dati di
            posizione saranno integrati nell&apos;API.
          </div>
        </div>
      )}

      {/* Statistiche alternative se non ci sono posizioni */}
      {!hasPositionData &&
        analysis.deathEvents &&
        analysis.deathEvents.length > 0 && (
          <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
            <div className="mb-2 text-xs font-medium text-neutral-300">
              Statistiche Alternative
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-neutral-400">Morti Early</div>
                <div className="text-sm font-semibold text-red-300">
                  {
                    analysis.deathEvents.filter((e) => e.phase === 'early')
                      .length
                  }
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Morti Mid</div>
                <div className="text-sm font-semibold text-orange-300">
                  {analysis.deathEvents.filter((e) => e.phase === 'mid').length}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Morti Late</div>
                <div className="text-sm font-semibold text-green-300">
                  {
                    analysis.deathEvents.filter((e) => e.phase === 'late')
                      .length
                  }
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
