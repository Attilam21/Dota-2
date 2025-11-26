import { PlayerDigest, MatchDigest } from '@/lib/types/opendota';
import type { SupabaseClient } from '@supabase/supabase-js';

interface MatchMetrics {
  aggressiveness_score: number;
  farm_efficiency_score: number;
  macro_score: number;
  survivability_score: number;
  early_kda: number;
  early_gpm: number;
  early_xpm: number;
  mid_kda: number;
  mid_gpm: number;
  mid_xpm: number;
  late_kda: number;
  late_gpm: number;
  late_xpm: number;
}

/**
 * Calcola le metriche avanzate per un player in un match
 */
export function calculatePlayerMetrics(
  player: PlayerDigest,
  match: MatchDigest
): MatchMetrics {
  // Aggressiveness: basato su kill participation e damage
  const killParticipation = player.kill_participation || 0;
  const heroDamage = player.hero_damage || 0;
  const damagePerMin = match.duration > 0 ? heroDamage / (match.duration / 60) : 0;
  const aggressiveness_score = Math.min(100, (killParticipation * 50) + (damagePerMin / 10));

  // Farm Efficiency: basato su GPM, last hits, denies
  const gpm = player.gold_per_min || 0;
  const lastHits = player.last_hits || 0;
  const denies = player.denies || 0;
  const farm_efficiency_score = Math.min(100, (gpm / 6) + (lastHits / 2) + (denies * 2));

  // Macro: basato su tower damage, net worth, item timing
  const towerDamage = player.tower_damage || 0;
  const netWorth = player.net_worth || 0;
  const macro_score = Math.min(100, (towerDamage / 1000) + (netWorth / 10000));

  // Survivability: basato su deaths, damage taken
  const deaths = player.deaths || 0;
  const damageTaken = player.damage_taken || 0;
  const avgDeathsPerMin = match.duration > 0 ? deaths / (match.duration / 60) : 0;
  const survivability_score = Math.max(0, 100 - (avgDeathsPerMin * 20) - (damageTaken / 10000));

  // Fase Early (0-10 min) - approssimazione
  const early_kda = (player.kills || 0) + (player.assists || 0) / 2;
  const early_gpm = (player.gold_per_min || 0) * 0.8; // Stima early
  const early_xpm = (player.xp_per_min || 0) * 0.8;

  // Fase Mid (10-30 min)
  const mid_kda = (player.kills || 0) + (player.assists || 0) / 2;
  const mid_gpm = player.gold_per_min || 0;
  const mid_xpm = player.xp_per_min || 0;

  // Fase Late (30+ min)
  const late_kda = (player.kills || 0) + (player.assists || 0) / 2;
  const late_gpm = (player.gold_per_min || 0) * 1.2; // Stima late
  const late_xpm = (player.xp_per_min || 0) * 1.2;

  return {
    aggressiveness_score: Math.max(0, Math.min(100, aggressiveness_score)),
    farm_efficiency_score: Math.max(0, Math.min(100, farm_efficiency_score)),
    macro_score: Math.max(0, Math.min(100, macro_score)),
    survivability_score: Math.max(0, Math.min(100, survivability_score)),
    early_kda,
    early_gpm,
    early_xpm,
    mid_kda,
    mid_gpm,
    mid_xpm,
    late_kda,
    late_gpm,
    late_xpm,
  };
}

/**
 * Aggiorna le statistiche aggregate dell'utente
 */
export async function updateUserStatistics(userId: string, supabase: SupabaseClient) {
  // Fetch ultime 20 partite incluse
  const { data: matches } = await supabase
    .from('matches_digest')
    .select('match_id, duration, radiant_win, match_date')
    .eq('user_id', userId)
    .eq('included_in_coaching', true)
    .order('match_date', { ascending: false, nullsFirst: false })
    .limit(20);

  if (!matches || matches.length === 0) {
    return;
  }

  const matchIds = matches.map((m: { match_id: number }) => m.match_id);

  // Fetch players per questi match
  const { data: players } = await supabase
    .from('players_digest')
    .select('*')
    .eq('user_id', userId)
    .in('match_id', matchIds);

  if (!players || players.length === 0) {
    return;
  }

  // Calcola statistiche aggregate
  const wins = matches.filter((m: { match_id: number; radiant_win: boolean }) => {
    const player = players.find((p: { match_id: number; player_slot: number }) => p.match_id === m.match_id);
    if (!player) return false;
    return m.radiant_win === (player.player_slot < 128);
  }).length;

  const winrate = (wins / matches.length) * 100;

  const avgKda = players.reduce((sum: number, p: { kda: number | null }) => {
    const kda = p.kda || 0;
    return sum + kda;
  }, 0) / players.length;

  const avgGpm = players.reduce((sum: number, p: { gold_per_min: number | null }) => sum + (p.gold_per_min || 0), 0) / players.length;
  const avgXpm = players.reduce((sum: number, p: { xp_per_min: number | null }) => sum + (p.xp_per_min || 0), 0) / players.length;

  // Fetch metriche avanzate
  const { data: metrics } = await supabase
    .from('player_match_metrics')
    .select('aggressiveness_score, farm_efficiency_score, macro_score, survivability_score')
    .eq('user_id', userId)
    .in('match_id', matchIds);

  const avgAggressiveness = metrics && metrics.length > 0
    ? metrics.reduce((sum: number, m: { aggressiveness_score: number | null }) => sum + (m.aggressiveness_score || 0), 0) / metrics.length
    : 0;
  const avgFarmEfficiency = metrics && metrics.length > 0
    ? metrics.reduce((sum: number, m: { farm_efficiency_score: number | null }) => sum + (m.farm_efficiency_score || 0), 0) / metrics.length
    : 0;
  const avgMacro = metrics && metrics.length > 0
    ? metrics.reduce((sum: number, m: { macro_score: number | null }) => sum + (m.macro_score || 0), 0) / metrics.length
    : 0;
  const avgSurvivability = metrics && metrics.length > 0
    ? metrics.reduce((sum: number, m: { survivability_score: number | null }) => sum + (m.survivability_score || 0), 0) / metrics.length
    : 0;

  // Fetch task attivi
  const { data: activeTasks } = await supabase
    .from('coaching_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active');

  // Upsert user_statistics
  await supabase
    .from('user_statistics')
    .upsert({
      user_id: userId,
      total_matches: matches.length,
      matches_included: matches.length,
      winrate,
      avg_kda: avgKda,
      avg_gpm: avgGpm,
      avg_xpm: avgXpm,
      avg_aggressiveness: avgAggressiveness,
      avg_farm_efficiency: avgFarmEfficiency,
      avg_macro: avgMacro,
      avg_survivability: avgSurvivability,
      active_tasks_count: activeTasks?.length || 0,
      last_calculated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

