'use client'

import { useEffect, useState } from 'react'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { LaneAnalysis } from '@/lib/dota/advancedAnalysis/types'

export default function LaneAndEarlyPage() {
  const { activePlayer, loading: playerLoading } = useActivePlayer()
  const [data, setData] = useState<LaneAnalysis | null>(null)
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
          `/api/dota/advanced/lane?playerId=${
            activePlayer?.dotaAccountId || 0
          }`,
        )
        if (!res.ok) throw new Error('Failed to load lane analysis')
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
        <div className="text-neutral-400">Caricamento analisi lane...</div>
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
  const csChartData = data.csTimeline.map((d, i) => ({
    x: i,
    y: d.csAt10,
    label: d.date,
  }))

  const laneResultsChart = data.laneResults.map((lr) => ({
    label: `${lr.lane} (${lr.result})`,
    value: lr.count,
    color:
      lr.result === 'win'
        ? '#22c55e'
        : lr.result === 'even'
          ? '#f59e0b'
          : '#ef4444',
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Lane & Early Game</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Analisi della fase di lane e early game: CS, XP, lane winrate.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs text-neutral-400">Lane Winrate</div>
          <div className="text-2xl font-semibold text-white">
            {data.laneWinrate.toFixed(1)}%
          </div>
        </div>
        <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs text-neutral-400">CS medio a 10 min</div>
          <div className="text-2xl font-semibold text-white">
            {data.avgCsAt10.toFixed(1)}
          </div>
        </div>
        <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs text-neutral-400">XP medio a 10 min</div>
          <div className="text-2xl font-semibold text-white">
            {data.avgXpAt10.toFixed(0)}
          </div>
        </div>
        <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs text-neutral-400">
            First Blood Involvement
          </div>
          <div className="text-2xl font-semibold text-white">N/A</div>
          <div className="text-[10px] text-neutral-500">Non disponibile</div>
        </div>
      </div>

      {/* CS Timeline Chart */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">
          CS Timeline (ultimi match)
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Nota: CS totale come proxy per CS@10 (OpenDota Tier-1 non fornisce
          dati per minuto)
        </p>
        {csChartData.length > 0 ? (
          <div className="h-64">
            <LineChart
              data={csChartData}
              width={800}
              height={256}
              color="#60a5fa"
              label="CS totale"
            />
          </div>
        ) : (
          <div className="text-sm text-neutral-400">
            Dati non disponibili per questa metrica nel dataset di test.
          </div>
        )}
      </div>

      {/* Lane Results Chart */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Risultati Lane per Posizione
        </h2>
        {laneResultsChart.length > 0 ? (
          <div className="h-64">
            <BarChart
              data={laneResultsChart}
              width={800}
              height={256}
              showValues={true}
            />
          </div>
        ) : (
          <div className="text-sm text-neutral-400">
            Dati non disponibili per questa metrica nel dataset di test.
          </div>
        )}
      </div>

      {/* Interpretation */}
      <ExplanationCard
        title="Come interpretare questi dati"
        description="Analisi della fase di lane e early game"
        interpretation="Lane Winrate: Percentuale di partite in cui hai 'vinto' la lane. Soglia target: >55% per core, >50% per support. CS a 10 minuti: Last hits accumulati. Soglie: Pos1/2: >60, Pos3: >50, Pos4/5: >20. CS basso indica problemi di last-hitting. XP a 10 minuti: Un XP basso rispetto al CS indica perdita di esperienza (morte, assenza dalla lane). First Blood Involvement: Percentuale di match con partecipazione al first blood. Valore alto indica aggressività early game."
      />
    </div>
  )
}
