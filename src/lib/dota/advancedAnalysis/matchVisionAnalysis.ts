/**
 * Single Match Vision & Map Control Analysis
 * Uses: dota_player_death_events (single match)
 *
 * NOTE: This is for SINGLE MATCH analysis, NOT aggregated profile analysis.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { VisionMapAnalysis } from './types'

export async function getMatchVisionAnalysis(
  matchId: number,
  playerId: number,
): Promise<VisionMapAnalysis | null> {
  const supabase = createServerClient(cookies())

  // Sanity check: MATCH MODE
  console.log(
    `[MATCH-VISION-ANALYSIS] MATCH MODE - Analisi solo per match ${matchId}`,
  )

  try {
    // Get SINGLE match data (filtered by matchId)
    const { data: match, error: matchesError } = await supabase
      .from('matches_digest')
      .select('match_id, start_time, duration_seconds')
      .eq('player_account_id', playerId)
      .eq('match_id', matchId)
      .single()

    if (matchesError || !match) {
      console.error(
        '[MATCH-VISION-ANALYSIS] Error fetching match:',
        matchesError,
      )
      return null
    }

    // Wards data: not available in Tier-1
    const avgWardsPlaced = 0
    const avgWardsRemoved = 0

    // Wards by phase: not available
    const wardsByPhase = {
      early: 0,
      mid: 0,
      late: 0,
    }

    // Wards timeline: single match point
    const wardsTimeline = [
      {
        date: new Date(match.start_time).toLocaleDateString('it-IT'),
        wardsPlaced: 0, // Not available
      },
    ]

    // Heatmap from death positions for THIS match
    const gridSize = 10
    const mapSize = 15000
    const cellSize = mapSize / gridSize

    const { data: deathEvents, error: deathError } = await supabase
      .from('dota_player_death_events')
      .select('match_id, pos_x, pos_y, time_seconds, phase')
      .eq('account_id', playerId)
      .eq('match_id', matchId) // SINGLE MATCH FILTER

    const heatmapGrid = new Map<string, number>()

    if (!deathError && deathEvents && deathEvents.length > 0) {
      deathEvents.forEach((event) => {
        if (event.pos_x != null && event.pos_y != null) {
          // Normalize to 0-15000 range (Dota map coordinates)
          const x = Math.max(
            0,
            Math.min(mapSize - 1, Number(event.pos_x) + mapSize / 2),
          )
          const y = Math.max(
            0,
            Math.min(mapSize - 1, Number(event.pos_y) + mapSize / 2),
          )

          const gridX = Math.floor(x / cellSize)
          const gridY = Math.floor(y / cellSize)
          const key = `${gridX},${gridY}`

          heatmapGrid.set(key, (heatmapGrid.get(key) || 0) + 1)
        }
      })
    }

    // Convert to array format
    const wardsHeatmap = Array.from(heatmapGrid.entries()).map(
      ([key, count]) => {
        const [x, y] = key.split(',').map(Number)
        return { x, y, count }
      },
    )

    // If no heatmap data, create empty grid
    if (wardsHeatmap.length === 0) {
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          wardsHeatmap.push({ x, y, count: 0 })
        }
      }
    }

    return {
      avgWardsPlaced,
      avgWardsRemoved,
      wardsByPhase,
      wardsTimeline,
      wardsHeatmap,
    }
  } catch (error) {
    console.error('[MATCH-VISION-ANALYSIS] Error:', error)
    return null
  }
}
