'use client'

import { useEffect, useState } from 'react'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { FightsDamageAnalysis } from '@/lib/dota/advancedAnalysis/types'

export default function FightsAndDamagePage() {
  const { activePlayer, loading: playerLoading } = useActivePlayer()
  const [data, setData] = useState<FightsDamageAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (playerLoading || !activePlayer?.dotaAccountId) {
      if (!playerLoading && !activePlayer) setLoading(false)
      return
    }

    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(
          `/api/dota/advanced/fights?playerId=${
            activePlayer?.dotaAccountId || 0
          }`,
        )
        if (!res.ok) throw new Error('Failed to load fights analysis')
        const json = await res.json()
        setData(json.data)
      } catch (e: any) {
        setError(e?.message || 'Errore nel caricamento dati')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [activePlayer, playerLoading])

  if (loading || playerLoading) {
    return (
      <div className="p-6">
        <div className="text-neutral-400">Caricamento analisi fight...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-400">Errore: {error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-neutral-400">Nessun dato disponibile</div>
      </div>
    )
  }

  // Prepare chart data
  const teamfightImpactChart = data.teamfightImpact.map((tfi) => ({
    label: tfi.phase,
    value: tfi.participation,
    color:
      tfi.phase === 'Early'
        ? '#22c55e'
        : tfi.phase === 'Mid'
          ? '#f59e0b'
          : '#ef4444',
  }))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Fights & Damage</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Analisi del contributo ai fight e damage output: kill participation,
          damage share, teamfight impact.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">Kill Participation</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.killParticipation.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">Damage Share</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.damageShare.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">Tower Damage (medio)</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.avgTowerDamage.toFixed(0)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">Teamfight Partecipati</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.avgTeamfightsParticipated.toFixed(1)}/match
          </div>
        </div>
      </div>

      {/* Teamfight Impact Chart */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Partecipazione ai Teamfight per Fase
        </h2>
        {teamfightImpactChart.length > 0 ? (
          <BarChart
            data={teamfightImpactChart}
            width={800}
            height={200}
            showValues={true}
          />
        ) : (
          <div className="text-sm text-neutral-500">Dati non disponibili</div>
        )}
      </div>

      {/* Damage Profile */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Profilo Damage
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs text-neutral-500">Damage Done</div>
            <div className="mt-1 text-xl font-semibold text-white">
              {data.damageProfile.damageDone.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Damage Taken</div>
            <div className="mt-1 text-xl font-semibold text-white">
              {data.damageProfile.damageTaken.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <ExplanationCard
        title="Come interpretare questi dati"
        description="Analisi del contributo ai fight e damage output"
        interpretation="Kill Participation: Percentuale di kill del team. Soglie: Pos1/2: >60%, Pos3: >55%, Pos4/5: >50%. Damage Share: Percentuale del damage totale del team. Pattern: Alta KP + Alta Damage = carry/core efficiente. Bassa KP + Alta Damage = farm ma poco impatto. Tower Damage: Danno alle torri. Core target: >2000/match. Teamfight Participation: Numero medio teamfight/match. Target: >8 per core, >10 per support. Damage Profile: Ratio alto (done/taken) = aggressività controllata."
      />
    </div>
  )
}
