/**
 * Performance Profile Cards Component
 *
 * Displays 4 cards: Aggressiveness, Farm Efficiency, Macro Gameplay, Consistency
 * Each card shows an index (0-100) and a descriptive subtitle.
 */

import type { PerformanceIndex } from '@/types/playerPerformance'
import { formatNumberOrNA } from '@/utils/dotaFormatting'

interface PerformanceProfileCardsProps {
  indices: PerformanceIndex
}

export default function PerformanceProfileCards({
  indices,
}: PerformanceProfileCardsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Aggressività */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            Aggressività
          </h3>
          <span className="text-xs text-neutral-500">Coinvolgimento fight</span>
        </div>
        <div className="mb-2 text-2xl font-bold text-white">
          {formatNumberOrNA(indices.aggressiveness)}/100
        </div>
        <div className="text-xs text-neutral-400">
          {getAggressivenessLabel(indices.aggressiveness)}
        </div>
      </div>

      {/* Card 2: Efficienza Farm */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            Efficienza Farm
          </h3>
          <span className="text-xs text-neutral-500">Gestione risorse</span>
        </div>
        <div className="mb-2 text-2xl font-bold text-white">
          {formatNumberOrNA(indices.farmEfficiency)}/100
        </div>
        <div className="text-xs text-neutral-400">
          {getFarmEfficiencyLabel(indices.farmEfficiency)}
        </div>
      </div>

      {/* Card 3: Macro Gameplay */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            Macro Gameplay
          </h3>
          <span className="text-xs text-neutral-500">Impatto mid/late</span>
        </div>
        <div className="mb-2 text-2xl font-bold text-white">
          {formatNumberOrNA(indices.macroGameplay)}/100
        </div>
        <div className="text-xs text-neutral-400">
          {getMacroGameplayLabel(indices.macroGameplay)}
        </div>
      </div>

      {/* Card 4: Stabilità */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">Stabilità</h3>
          <span className="text-xs text-neutral-500">Consistenza</span>
        </div>
        <div className="mb-2 text-2xl font-bold text-white">
          {formatNumberOrNA(indices.consistency)}/100
        </div>
        <div className="text-xs text-neutral-400">
          {getConsistencyLabel(indices.consistency)}
        </div>
      </div>
    </div>
  )
}

function getAggressivenessLabel(index: number): string {
  if (index < 40) return 'Stile tendenzialmente passivo'
  if (index <= 70) return 'Stile equilibrato'
  return 'Stile molto aggressivo'
}

function getFarmEfficiencyLabel(index: number): string {
  if (index < 40) return 'Farm sotto la media delle tue partite'
  if (index <= 70) return 'Farm nella media'
  return 'Farm sopra la tua media abituale'
}

function getMacroGameplayLabel(index: number): string {
  if (index < 40) return 'Macro da migliorare (impatto concentrato early)'
  if (index <= 70) return 'Macro nella media'
  return 'Buon impatto mid/late game'
}

function getConsistencyLabel(index: number): string {
  if (index < 40) return 'Prestazioni molto altalenanti'
  if (index <= 70) return 'Stabilità discreta'
  return 'Stile di gioco consistente'
}
