'use client'

import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { DotaPlayerMatchAnalysis } from '@/types/dotaAnalysis'

interface DotaDeathByRoleSectionProps {
  analysis: DotaPlayerMatchAnalysis
}

/**
 * Componente per visualizzare la distribuzione delle morti per ruolo avversario (Pos1-5)
 */
export default function DotaDeathByRoleSection({
  analysis,
}: DotaDeathByRoleSectionProps) {
  const roleLabels: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: 'Pos1 (Carry)',
    2: 'Pos2 (Mid)',
    3: 'Pos3 (Offlane)',
    4: 'Pos4 (Soft Support)',
    5: 'Pos5 (Hard Support)',
  }

  const roleDescriptions: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: 'Safe Lane Carry',
    2: 'Mid',
    3: 'Offlane',
    4: 'Soft Support / Roamer',
    5: 'Hard Support',
  }

  // Dati per grafico
  const deathByRoleData = [
    {
      label: 'Pos1',
      value: analysis.deathByRole.pos1,
      color: '#ef4444', // Red
    },
    {
      label: 'Pos2',
      value: analysis.deathByRole.pos2,
      color: '#f59e0b', // Orange
    },
    {
      label: 'Pos3',
      value: analysis.deathByRole.pos3,
      color: '#eab308', // Yellow
    },
    {
      label: 'Pos4',
      value: analysis.deathByRole.pos4,
      color: '#3b82f6', // Blue
    },
    {
      label: 'Pos5',
      value: analysis.deathByRole.pos5,
      color: '#8b5cf6', // Purple
    },
  ]

  // Trova il ruolo che causa più morti
  const maxRole = deathByRoleData.reduce((max, role) =>
    role.value > max.value ? role : max,
  )

  // Insight placeholder
  const getInsight = (): string => {
    if (maxRole.value > 40) {
      return `Attenzione: ${maxRole.label} causa ${maxRole.value.toFixed(
        1,
      )}% delle tue morti. Valuta il posizionamento contro questo ruolo.`
    } else if (maxRole.value > 25) {
      return `${maxRole.label} è il ruolo che ti uccide più spesso. Considera di migliorare la mappa awareness contro questo ruolo.`
    }
    return 'Distribuzione delle morti bilanciata tra i ruoli avversari.'
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-base font-semibold text-neutral-200">
        Death by Role
      </h3>
      <p className="mb-4 text-xs text-neutral-400">
        Percentuale di morti causate da ciascun ruolo avversario (Pos1-5)
      </p>

      {/* Grafico */}
      <div className="mb-6 h-[200px]">
        <BarChart data={deathByRoleData} width={560} height={200} />
      </div>

      {/* Legenda con percentuali */}
      <div className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
        {([1, 2, 3, 4, 5] as const).map((pos) => {
          const value = analysis.deathByRole[
            `pos${pos}` as keyof typeof analysis.deathByRole
          ] as number
          return (
            <div
              key={pos}
              className={`rounded-lg border p-3 ${
                value === maxRole.value
                  ? 'border-yellow-600 bg-yellow-900/20'
                  : 'border-neutral-800 bg-neutral-900/70'
              }`}
            >
              <div className="mb-1 text-xs font-medium text-neutral-300">
                {roleLabels[pos]}
              </div>
              <div
                className={`text-lg font-bold ${
                  value === maxRole.value
                    ? 'text-yellow-300'
                    : 'text-neutral-200'
                }`}
              >
                {value.toFixed(1)}%
              </div>
              <div className="mt-1 text-[10px] text-neutral-500">
                {roleDescriptions[pos]}
              </div>
            </div>
          )
        })}
      </div>

      <ExplanationCard
        title="Insight Death by Role"
        description={getInsight()}
      />
    </div>
  )
}
