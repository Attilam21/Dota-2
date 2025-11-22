/**
 * Vision & Map Control Analysis
 * Uses: dota_player_death_events (for position heatmap)
 *
 * NOTE: Wards data requires dota_vision table which doesn't exist in Tier-1 OpenDota.
 * We return 0 for wards metrics with appropriate handling in UI.
 * Heatmap is calculated from death positions as proxy for map activity.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { VisionMapAnalysis } from './types'
import { getLastMatches } from '@/lib/dota/matches/getLastMatches'

export async function getVisionMapAnalysis(
  playerId: number,
): Promise<VisionMapAnalysis | null> {
  const supabase = createServerClient(cookies())

  // Sanity check: GLOBAL MODE
  console.log(
    '[VISION-ANALYSIS] GLOBAL MODE - Analisi basata su ultime 20 partite',
  )

  try {
    // Get last 20 matches using centralized function
    const matchIds = await getLastMatches(playerId, 20)
    if (matchIds.length === 0) {
      return null
    }

    // Get recent matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches_digest')
      .select('match_id, start_time, duration_seconds')
      .eq('player_account_id', playerId)
      .in('match_id', matchIds)
      .order('start_time', { ascending: false })

    if (matchesError) {
      console.error('[VISION-ANALYSIS] Error fetching matches:', matchesError)
      return null
    }

    if (!matches || matches.length === 0) {
      return null
    }

    // Wards data: not available in Tier-1 OpenDota data (requires dota_vision table)
    // Return 0 with note that it's not available
    const avgWardsPlaced = 0
    const avgWardsRemoved = 0

    // Wards by phase: not available
    const wardsByPhase = {
      early: 0,
      mid: 0,
      late: 0,
    }

    // Wards timeline: placeholder (all zeros)
    const wardsTimeline = matches.map((m) => ({
      date: new Date(m.start_time).toLocaleDateString('it-IT'),
      wardsPlaced: 0,
    }))

    // Heatmap from death positions (if available)
    // Create 10x10 grid (Dota map is roughly 15000x15000 units)
    const gridSize = 10
    const mapSize = 15000
    const cellSize = mapSize / gridSize

    const deathMatchIds = matches.map((m) => m.match_id)
    const { data: deathEvents, error: deathError } = await supabase
      .from('dota_player_death_events')
      .select('match_id, pos_x, pos_y, time_seconds, phase')
      .eq('account_id', playerId)
      .in('match_id', deathMatchIds)

    const heatmapGrid = new Map<string, number>()

    if (!deathError && deathEvents && deathEvents.length > 0) {
      deathEvents.forEach((event) => {
        if (event.pos_x != null && event.pos_y != null) {
          // Normalize to 0-15000 range (Dota map coordinates)
          // OpenDota coordinates are typically in range -8000 to 8000, centered at 0
          // We shift to 0-15000 range
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
      wardsTimeline: wardsTimeline.slice(0, 20),
      wardsHeatmap,
    }
  } catch (error) {
    console.error('[VISION-ANALYSIS] Error:', error)
    return null
  }
}
