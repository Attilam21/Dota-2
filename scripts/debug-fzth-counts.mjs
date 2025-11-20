// Debug counts across FZTH pipeline for dota_account_id = 86745912
import { createClient } from '@supabase/supabase-js'

const DOTA_ID = 86745912

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_TOKEN
  if (!url || !key) throw new Error('Missing SUPABASE service credentials')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function main() {
  const sb = getAdmin()
  // resolve fzth player_id (uuid)
  const { data: players, error: pErr } = await sb
    .from('fzth_players')
    .select('id')
    .eq('dota_account_id', DOTA_ID)
    .limit(1)
  if (pErr) throw pErr
  const playerId = players?.[0]?.id || null
  const results = {}
  // counts
  const { count: matches } = await sb
    .from('matches_digest')
    .select('match_id', { count: 'exact', head: true })
    .eq('player_account_id', DOTA_ID)
  const { count: fzthPlayers } = await sb
    .from('fzth_players')
    .select('id', { count: 'exact', head: true })
    .eq('dota_account_id', DOTA_ID)
  results.matches_digest = matches ?? 0
  results.fzth_players = fzthPlayers ?? 0
  if (playerId) {
    const [{ count: stats }, { count: hero }, { count: prog }, { count: ach }, { count: insights }] =
      await Promise.all([
        sb.from('player_stats_agg').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
        sb.from('player_hero_stats').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
        sb.from('player_progression').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
        sb.from('player_achievements').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
        sb.from('ai_insights').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
      ])
    results.player_stats_agg = stats ?? 0
    results.player_hero_stats = hero ?? 0
    results.player_progression = prog ?? 0
    results.player_achievements = ach ?? 0
    results.ai_insights = insights ?? 0
  } else {
    results.player_stats_agg = 0
    results.player_hero_stats = 0
    results.player_progression = 0
    results.player_achievements = 0
    results.ai_insights = 0
  }
  console.log(JSON.stringify({ dotaId: DOTA_ID, playerId, counts: results }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


