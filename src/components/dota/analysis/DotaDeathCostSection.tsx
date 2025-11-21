'use client'

import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'

interface DotaDeathCostSectionProps {
  analysis: DotaPlayerMatchAnalysis
}

/**
 * Componente per visualizzare il costo opportunità delle morti (gold/xp/cs persi)
 */
export default function DotaDeathCostSection({
  analysis,
}: DotaDeathCostSectionProps) {
  const { totalGoldLost, totalXpLost, totalCsLost } = analysis.deathCostSummary

  const formatNumber = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toFixed(0)
  }

  // Calcola il costo totale stimato (gold equivalente)
  // Stima: 1 XP ≈ 1 gold, 1 CS ≈ 50 gold
  const estimatedTotalCost = totalGoldLost + totalXpLost + totalCsLost * 50

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-base font-semibold text-neutral-200">
        Costo Opportunità delle Morti
      </h3>
      <p className="mb-4 text-xs text-neutral-400">
        Risorse perse durante i tempi di respawn causati dalle morti
      </p>

      {/* Metriche principali */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-red-800/50 bg-red-900/20 p-4">
          <div className="mb-1 text-xs text-red-300">Gold Perso</div>
          <div className="text-2xl font-bold text-red-200">
            {formatNumber(totalGoldLost)}
          </div>
          <div className="mt-1 text-xs text-red-400/80">
            Durante tutti i respawn
          </div>
        </div>

        <div className="rounded-lg border border-yellow-800/50 bg-yellow-900/20 p-4">
          <div className="mb-1 text-xs text-yellow-300">XP Perso</div>
          <div className="text-2xl font-bold text-yellow-200">
            {formatNumber(totalXpLost)}
          </div>
          <div className="mt-1 text-xs text-yellow-400/80">
            Esperienza non guadagnata
          </div>
        </div>

        <div className="rounded-lg border border-orange-800/50 bg-orange-900/20 p-4">
          <div className="mb-1 text-xs text-orange-300">CS Perso</div>
          <div className="text-2xl font-bold text-orange-200">
            {formatNumber(totalCsLost)}
          </div>
          <div className="mt-1 text-xs text-orange-400/80">
            Last hits mancati
          </div>
        </div>
      </div>

      {/* Costo totale stimato */}
      <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
        <div className="text-xs text-neutral-400">Costo totale stimato</div>
        <div className="text-lg font-semibold text-neutral-200">
          ~{formatNumber(estimatedTotalCost)} gold equivalenti
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          (Gold + XP + CS persi convertiti in gold)
        </div>
      </div>

      {/* Tabella eventi dettagliati (se disponibili) */}
      {analysis.deathEvents && analysis.deathEvents.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-neutral-300">
            Dettaglio Eventi di Morte
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-2 py-2 text-left text-neutral-400">
                    Tempo
                  </th>
                  <th className="px-2 py-2 text-left text-neutral-400">Fase</th>
                  <th className="px-2 py-2 text-right text-neutral-400">
                    Gold Perso
                  </th>
                  <th className="px-2 py-2 text-right text-neutral-400">
                    XP Perso
                  </th>
                  <th className="px-2 py-2 text-right text-neutral-400">
                    CS Perso
                  </th>
                  <th className="px-2 py-2 text-right text-neutral-400">
                    Respawn
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysis.deathEvents.map((event, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-neutral-800/50 hover:bg-neutral-900/50"
                  >
                    <td className="px-2 py-2 text-neutral-300">
                      {Math.floor(event.timeSeconds / 60)}:
                      {String(event.timeSeconds % 60).padStart(2, '0')}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          event.phase === 'early'
                            ? 'bg-red-900/30 text-red-300'
                            : event.phase === 'mid'
                              ? 'bg-orange-900/30 text-orange-300'
                              : 'bg-green-900/30 text-green-300'
                        }`}
                      >
                        {event.phase.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right text-red-300">
                      {formatNumber(event.goldLost)}
                    </td>
                    <td className="px-2 py-2 text-right text-yellow-300">
                      {formatNumber(event.xpLost)}
                    </td>
                    <td className="px-2 py-2 text-right text-orange-300">
                      {formatNumber(event.csLost)}
                    </td>
                    <td className="px-2 py-2 text-right text-neutral-400">
                      {event.downtimeSeconds}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insight */}
      <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/70 p-3">
        <div className="text-xs font-medium text-neutral-300">💡 Insight</div>
        <div className="mt-1 text-xs text-neutral-400">
          {totalGoldLost > 5000
            ? 'Costo molto alto: valuta di migliorare la sopravvivenza per ridurre le risorse perse.'
            : totalGoldLost > 2000
              ? 'Costo moderato: alcune morti evitabili potrebbero ridurre ulteriormente le perdite.'
              : 'Costo contenuto: buona gestione della sopravvivenza.'}
        </div>
      </div>
    </div>
  )
}
