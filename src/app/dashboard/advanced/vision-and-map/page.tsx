'use client'

import { useEffect, useState } from 'react'
import { useActivePlayer } from '@/hooks/useActivePlayer'
import LineChart from '@/components/charts/LineChart'
import ExplanationCard from '@/components/charts/ExplanationCard'
import type { VisionMapAnalysis } from '@/lib/dota/advancedAnalysis/types'

export default function VisionAndMapPage() {
  const { activePlayer, loading: playerLoading } = useActivePlayer()
  const [data, setData] = useState<VisionMapAnalysis | null>(null)
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
          `/api/dota/advanced/vision?playerId=${
            activePlayer?.dotaAccountId || 0
          }`,
        )
        if (!res.ok) throw new Error('Failed to load vision analysis')
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
        <div className="text-neutral-400">Caricamento analisi vision...</div>
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
  const wardsTimelineData = data.wardsTimeline.map((d, i) => ({
    x: i,
    y: d.wardsPlaced,
    label: d.date,
  }))

  // Heatmap grid (10x10)
  const gridSize = 10
  const maxCount = Math.max(1, ...data.wardsHeatmap.map((h) => h.count))

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Vision & Map Control
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Analisi del controllo mappa e visione: wards piazzate/rimosse, heatmap
          posizioni.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">
            Wards Piazzate (medio/match)
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">N/A</div>
          <div className="mt-1 text-[10px] text-neutral-500">
            Non disponibile in Tier-1
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">
            Wards Rimosse (medio/match)
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">N/A</div>
          <div className="mt-1 text-[10px] text-neutral-500">
            Non disponibile in Tier-1
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">Wards Early</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.wardsByPhase.early}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-xs text-neutral-500">Wards Late</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {data.wardsByPhase.late}
          </div>
        </div>
      </div>

      {/* Wards Timeline Chart */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Wards Piazzate nel Tempo
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Nota: Dati wards non disponibili in OpenDota Tier-1 (richiede tabella
          dota_vision)
        </p>
        <div className="text-sm text-neutral-400">
          Grafico non disponibile - dati wards richiedono parsing avanzato dei
          match
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Heatmap Posizioni Morti (Grid 10x10)
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Nota: Heatmap calcolata dalle posizioni delle morti (proxy per
          attività mappa)
        </p>
        <div className="flex flex-col gap-1">
          {Array.from({ length: gridSize }, (_, y) => (
            <div key={y} className="flex gap-1">
              {Array.from({ length: gridSize }, (_, x) => {
                const cell = data.wardsHeatmap.find(
                  (h) => h.x === x && h.y === y,
                )
                const count = cell?.count || 0
                const intensity = maxCount > 0 ? count / maxCount : 0
                const opacity = Math.max(0.1, intensity)
                const color =
                  intensity > 0.5
                    ? '#22c55e'
                    : intensity > 0.2
                      ? '#f59e0b'
                      : '#ef4444'

                return (
                  <div
                    key={`${x}-${y}`}
                    className="h-8 w-8 rounded border border-neutral-700"
                    style={{
                      backgroundColor: color,
                      opacity,
                    }}
                    title={`X: ${x}, Y: ${y}, Count: ${count}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-neutral-500">
          Intensità: Verde (alta) → Giallo (media) → Rosso (bassa)
        </div>
      </div>

      {/* Interpretation */}
      <ExplanationCard
        title="Come interpretare questi dati"
        description="Analisi del controllo mappa e visione"
        interpretation="Wards Piazzate: Numero medio di ward piazzate per match. Target: Pos4/5: >8 wards/match, Pos1/2/3: >2 wards/match. Wards Rimosse: Numero medio di ward nemiche rimosse. Target: >2 wards rimosse/match per support. Wards per Fase: Early importante per sicurezza lane, Mid per controllo obiettivi, Late critico per teamfight. Heatmap: Zone verdi = zone frequentemente coperte, zone rosse = zone poco coperte. Pattern ideale: copertura equilibrata tra zone aggressive e difensive."
      />
    </div>
  )
}
