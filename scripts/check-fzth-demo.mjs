// Alias checker for demo player to verify FZTH aggregates and insights
import { createClient } from '@supabase/supabase-js'

const DEMO_DOTA_ACCOUNT_ID = 86745912

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
  const { data: players } = await sb
    .from('fzth_players')
    .select('id')
    .eq('dota_account_id', DEMO_DOTA_ACCOUNT_ID)
    .limit(1)
  const playerId = players?.[0]?.id || null
  const [{ count: stats }, { count: hero }, { count: prog }, { count: ach }, { count: insights }] = await Promise.all([
    sb.from('player_stats_agg').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
    sb.from('player_hero_stats').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
    sb.from('player_progression').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
    sb.from('player_achievements').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
    sb.from('ai_insights').select('player_id', { count: 'exact', head: true }).eq('player_id', playerId),
  ])
  console.log(
    JSON.stringify(
      {
        playerId,
        counts: {
          player_stats_agg: stats ?? 0,
          player_hero_stats: hero ?? 0,
          player_progression: prog ?? 0,
          player_achievements: ach ?? 0,
          ai_insights: insights ?? 0,
        },
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


