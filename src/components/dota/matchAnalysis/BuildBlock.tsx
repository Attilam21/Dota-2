/**
 * Build Block Component
 *
 * Displays item build analysis
 */

import type { BuildAnalysis } from '@/types/matchAnalysis'

interface BuildBlockProps {
  data: BuildAnalysis
}

export function BuildBlock({ data }: BuildBlockProps): React.JSX.Element {
  if (data.status === 'unavailable') {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">Build</h2>
        <div className="text-sm text-neutral-500">
          Dati build non disponibili. Richiedono timeline acquisti item che non
          sono ancora disponibili da OpenDota.
        </div>
      </div>
    )
  }

  if (data.coreItems.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
        <h2 className="mb-2 text-lg font-semibold text-neutral-200">Build</h2>
        <div className="text-sm text-neutral-500">
          Nessun item core identificato per questa partita.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur-sm md:p-5">
      <h2 className="mb-4 text-lg font-semibold text-neutral-200">Build</h2>

      {/* Item Timeline - placeholder for future implementation */}
      <div className="mb-4 h-[200px]">
        <div className="flex h-full items-center justify-center text-sm text-neutral-500">
          Timeline acquisti item (in sviluppo)
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900/60 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Item</th>
              <th className="px-3 py-2 text-left font-medium">Minuto</th>
              <th className="px-3 py-2 text-left font-medium">Meta</th>
              <th className="px-3 py-2 text-left font-medium">Differenza</th>
            </tr>
          </thead>
          <tbody>
            {data.coreItems.map((item, idx) => (
              <tr
                key={idx}
                className="border-t border-neutral-800 hover:bg-neutral-900/40"
              >
                <td className="px-3 py-2">{item.itemName}</td>
                <td className="px-3 py-2">{item.purchaseMinute} min</td>
                <td className="px-3 py-2">
                  {item.metaMinute !== null ? `${item.metaMinute} min` : '—'}
                </td>
                <td className="px-3 py-2">
                  {item.differenceMinutes !== null ? (
                    <span
                      className={
                        item.differenceMinutes > 0
                          ? 'text-red-400'
                          : item.differenceMinutes < 0
                            ? 'text-green-400'
                            : 'text-neutral-400'
                      }
                    >
                      {item.differenceMinutes > 0 ? '+' : ''}
                      {item.differenceMinutes} min
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insight */}
      {data.insight && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="mb-1 text-xs font-semibold text-neutral-300">
            Insight Build
          </div>
          <div className="text-sm text-neutral-400">{data.insight}</div>
        </div>
      )}
    </div>
  )
}
