/**
 * Componente TelemetryPills - Mostra 4 pillole sintetiche con telemetria giocatore
 * Componente puramente visual, logica di calcolo nella pagina parent
 */

interface TelemetryPillsProps {
  lane: string
  powerPhase: 'early' | 'mid' | 'late'
  playstyle: 'aggressive' | 'balanced' | 'passive'
  heroPoolSummary: {
    comfort: number
    good: number
    situational: number
  }
}

export default function TelemetryPills({
  lane,
  powerPhase,
  playstyle,
  heroPoolSummary,
}: TelemetryPillsProps) {
  const powerPhaseLabels = {
    early: 'Early Game',
    mid: 'Mid Game',
    late: 'Late Game',
  }

  const playstyleLabels = {
    aggressive: 'Aggressivo',
    balanced: 'Bilanciato',
    passive: 'Passivo',
  }

  const playstyleColors = {
    aggressive: 'bg-red-900/30 border-red-800 text-red-300',
    balanced: 'bg-blue-900/30 border-blue-800 text-blue-300',
    passive: 'bg-green-900/30 border-green-800 text-green-300',
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {/* Lane predominante */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
        <div className="mb-1 text-xs text-neutral-400">Lane predominante</div>
        <div className="text-sm font-semibold text-neutral-200">{lane}</div>
      </div>

      {/* Fase di forza */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
        <div className="mb-1 text-xs text-neutral-400">Fase di forza</div>
        <div className="text-sm font-semibold text-neutral-200">
          {powerPhaseLabels[powerPhase]}
        </div>
      </div>

      {/* Stile di gioco */}
      <div className={`rounded-lg border p-3 ${playstyleColors[playstyle]}`}>
        <div className="mb-1 text-xs opacity-80">Stile di gioco</div>
        <div className="text-sm font-semibold">
          {playstyleLabels[playstyle]}
        </div>
      </div>

      {/* Hero Pool Summary */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
        <div className="mb-1 text-xs text-neutral-400">Hero Pool</div>
        <div className="text-sm font-semibold text-neutral-200">
          {heroPoolSummary.comfort} comfort · {heroPoolSummary.good} buoni ·{' '}
          {heroPoolSummary.situational} situazionali
        </div>
      </div>
    </div>
  )
}
