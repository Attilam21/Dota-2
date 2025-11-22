/**
 * Performance Phase KPI Component
 *
 * Displays KPI for each game phase (Early/Mid/Late) in 3 columns.
 */

import type { PhaseKPI } from '@/types/playerPerformance'

interface PerformancePhaseKPIProps {
  phaseKPI: PhaseKPI
}

export default function PerformancePhaseKPI({
  phaseKPI,
}: PerformancePhaseKPIProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">
        KPI per Fase di Gioco
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Early Game */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
          <h3 className="mb-2 text-sm font-semibold text-neutral-200">
            Early (0-10 min)
          </h3>
          {phaseKPI.early.avgKills !== null ? (
            <>
              <div className="mb-1 text-xs text-neutral-400">Avg Kills</div>
              <div className="text-lg font-semibold text-white">
                {phaseKPI.early.avgKills !== null
                  ? phaseKPI.early.avgKills.toFixed(1)
                  : '—'}
              </div>
              {phaseKPI.early.avgDeaths !== null && (
                <>
                  <div className="mt-2 text-xs text-neutral-400">
                    Avg Deaths
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {phaseKPI.early.avgDeaths.toFixed(1)}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-xs text-neutral-500">
              Dati insufficienti per questa fase
            </div>
          )}
        </div>

        {/* Mid Game */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
          <h3 className="mb-2 text-sm font-semibold text-neutral-200">
            Mid (10-30 min)
          </h3>
          {phaseKPI.mid.avgKills !== null ? (
            <>
              <div className="mb-1 text-xs text-neutral-400">Avg Kills</div>
              <div className="text-lg font-semibold text-white">
                {phaseKPI.mid.avgKills !== null
                  ? phaseKPI.mid.avgKills.toFixed(1)
                  : '—'}
              </div>
              {phaseKPI.mid.avgDeaths !== null && (
                <>
                  <div className="mt-2 text-xs text-neutral-400">
                    Avg Deaths
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {phaseKPI.mid.avgDeaths.toFixed(1)}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-xs text-neutral-500">
              Dati insufficienti per questa fase
            </div>
          )}
        </div>

        {/* Late Game */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
          <h3 className="mb-2 text-sm font-semibold text-neutral-200">
            Late (30+ min)
          </h3>
          {phaseKPI.late.avgKills !== null ? (
            <>
              <div className="mb-1 text-xs text-neutral-400">Avg Kills</div>
              <div className="text-lg font-semibold text-white">
                {phaseKPI.late.avgKills !== null
                  ? phaseKPI.late.avgKills.toFixed(1)
                  : '—'}
              </div>
              {phaseKPI.late.avgDeaths !== null && (
                <>
                  <div className="mt-2 text-xs text-neutral-400">
                    Avg Deaths
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {phaseKPI.late.avgDeaths.toFixed(1)}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-xs text-neutral-500">
              Dati insufficienti per questa fase
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
