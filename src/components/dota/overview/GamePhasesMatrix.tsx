/**
 * Componente GamePhasesMatrix - Mostra 9 valori numerici in matrice 3x3
 * Early / Mid / Late game KPI
 */

interface GamePhasesMatrixProps {
  early: { cs10: number; gold10: number; death10: number }
  mid: { tower: number; roshan: number; fight: number }
  late: { survival: number; damage: number; impact: number }
}

export default function GamePhasesMatrix({
  early,
  mid,
  late,
}: GamePhasesMatrixProps) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="mb-4 text-sm font-semibold text-neutral-200">
        KPI per Fase di Gioco
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {/* Early Game */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-400">Early Game</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">CS@10:</span>
              <span className="font-semibold text-neutral-200">
                {early.cs10.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Gold@10:</span>
              <span className="font-semibold text-neutral-200">
                {early.gold10.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Deaths@10:</span>
              <span className="font-semibold text-neutral-200">
                {early.death10.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Mid Game */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-400">Mid Game</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Tower:</span>
              <span className="font-semibold text-neutral-200">
                {mid.tower.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Roshan:</span>
              <span className="font-semibold text-neutral-200">
                {mid.roshan.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Fight:</span>
              <span className="font-semibold text-neutral-200">
                {mid.fight.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Late Game */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-400">Late Game</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Survival:</span>
              <span className="font-semibold text-neutral-200">
                {late.survival.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Damage:</span>
              <span className="font-semibold text-neutral-200">
                {late.damage.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Impact:</span>
              <span className="font-semibold text-neutral-200">
                {late.impact.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
