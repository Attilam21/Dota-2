import { SupabaseClient } from '@supabase/supabase-js'

export type RecomputedKpi = {
  playerUuid: string
  totalMatches: number
  totalWins: number
  totalLosses: number
  winrate: number
  avgKda: number
  avgDurationSec: number
}

/**
 * Recompute player_stats_agg for a given dota_account_id using matches_digest.
 * Returns computed KPI and ensures an upsert/update/insert on player_stats_agg.
 */
export async function recomputePlayerStatsAgg(
  sb: SupabaseClient,
  dotaAccountId: number,
): Promise<RecomputedKpi> {
  // Resolve internal UUID
  const { data: players, error: pErr } = await sb
    .from('fzth_players')
    .select('id')
    .eq('dota_account_id', dotaAccountId)
    .limit(1)
  if (pErr) throw pErr
  const playerUuid = players?.[0]?.id as string | undefined
  if (!playerUuid) {
    throw new Error('Player not found in fzth_players')
  }
  // Read all matches for this dota id
  const { data: mdRows, error: mdErr } = await sb
    .from('matches_digest')
    .select('match_id, result, kills, deaths, assists, duration_seconds')
    .eq('player_account_id', dotaAccountId)
  if (mdErr) throw mdErr
  const matches = mdRows ?? []
  const totalMatches = matches.length
  const totalWins = matches.filter((m: any) => m.result === 'win').length
  const totalLosses = matches.filter((m: any) => m.result === 'lose').length
  const winrate =
    totalMatches > 0
      ? Math.round((totalWins / Math.max(1, totalMatches)) * 100)
      : 0
  const sumK = matches.reduce((a: number, m: any) => a + (m.kills ?? 0), 0)
  const sumD = matches.reduce((a: number, m: any) => a + (m.deaths ?? 0), 0)
  const sumA = matches.reduce((a: number, m: any) => a + (m.assists ?? 0), 0)
  const sumDur = matches.reduce(
    (a: number, m: any) => a + (m.duration_seconds ?? 0),
    0,
  )
  const avgKda =
    totalMatches > 0
      ? Number(((sumK + sumA) / Math.max(1, sumD)).toFixed(2))
      : 0
  const avgDurationSec =
    totalMatches > 0 ? Math.round(sumDur / totalMatches) : 0

  const payload = {
    player_id: playerUuid,
    total_matches: totalMatches,
    total_wins: totalWins,
    total_losses: totalLosses,
    winrate,
    avg_kda: avgKda,
    avg_duration_sec: avgDurationSec,
  }
  // Upsert then fallback to update/insert
  const { error: upAggErr } = await sb
    .from('player_stats_agg')
    .upsert([payload], { onConflict: 'player_id' })
  if (upAggErr) {
    // eslint-disable-next-line no-console
    console.warn('RECOMPUTE_STATS: upsert failed', {
      playerId: playerUuid,
      error: upAggErr?.message ?? String(upAggErr),
    })
    const { data: exists } = await sb
      .from('player_stats_agg')
      .select('player_id')
      .eq('player_id', playerUuid)
      .limit(1)
    if (exists && exists.length > 0) {
      const { error: updErr } = await sb
        .from('player_stats_agg')
        .update(payload)
        .eq('player_id', playerUuid)
      if (updErr) {
        // eslint-disable-next-line no-console
        console.error('RECOMPUTE_STATS: update failed', {
          playerId: playerUuid,
          error: updErr?.message ?? String(updErr),
        })
      }
    } else {
      const { error: insErr } = await sb
        .from('player_stats_agg')
        .insert([payload])
      if (insErr) {
        // eslint-disable-next-line no-console
        console.error('RECOMPUTE_STATS: insert failed', {
          playerId: playerUuid,
          error: insErr?.message ?? String(insErr),
        })
      }
    }
  }
  return {
    playerUuid,
    totalMatches,
    totalWins,
    totalLosses,
    winrate,
    avgKda,
    avgDurationSec,
  }
}
