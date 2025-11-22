/**
 * Vision & Map Control Analysis
 * Uses: dota_vision (if exists), dota_player_death_events for position data
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@/utils/supabase'
import type { VisionMapAnalysis } from './types'

export async function getVisionMapAnalysis(
  playerId: number,
): Promise<VisionMapAnalysis | null> {
  const supabase = createServerClient(cookies())

  try {
    // Get recent matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches_digest')
      .select('match_id, start_time, duration_seconds')
      .eq('player_account_id', playerId)
      .order('start_time', { ascending: false })
      .limit(50)

    if (matchesError) {
      console.error('[VISION-ANALYSIS] Error fetching matches:', matchesError)
      return null
    }

    if (!matches || matches.length === 0) {
      return null
    }

    // Try to get vision data from dota_vision table (if exists)
    // For now, we'll use death events positions as proxy for map activity
    const { data: deathEvents, error: deathError } = await supabase
      .from('dota_player_death_events')
      .select('match_id, pos_x, pos_y, time_seconds, phase')
      .eq('account_id', playerId)
      .in(
        'match_id',
        matches.map((m) => m.match_id),
      )

    // Wards data (placeholder - would need dota_vision table)
    const avgWardsPlaced = 0 // TODO: Calculate from dota_vision if available
    const avgWardsRemoved = 0 // TODO: Calculate from dota_vision if available

    // Wards by phase (placeholder)
    const wardsByPhase = {
      early: 0,
      mid: 0,
      late: 0,
    }

    // Wards timeline (placeholder)
    const wardsTimeline = matches.map((m) => ({
      date: new Date(m.start_time).toLocaleDateString('it-IT'),
      wardsPlaced: 0, // Placeholder
    }))

    // Heatmap from death positions (if available)
    // Create 10x10 grid (Dota map is roughly 15000x15000 units)
    const gridSize = 10
    const mapSize = 15000
    const cellSize = mapSize / gridSize

    const heatmapGrid = new Map<string, number>()

    if (!deathError && deathEvents) {
      deathEvents.forEach((event) => {
        if (event.pos_x != null && event.pos_y != null) {
          // Normalize to 0-15000 range (Dota map coordinates)
          const x = Math.max(0, Math.min(mapSize - 1, Number(event.pos_x)))
          const y = Math.max(0, Math.min(mapSize - 1, Number(event.pos_y)))

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
