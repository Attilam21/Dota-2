// Test read access with ANON key (RLS enforced) for FZTH tables
import { createClient } from '@supabase/supabase-js'

const DOTA_ID = 86745912

function getAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('Missing ANON envs')
  return createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function main() {
  const sb = getAnon()
  const out = {}
  // fzth_players
  {
    const { data, error, status } = await sb
      .from('fzth_players')
      .select('id')
      .eq('dota_account_id', DOTA_ID)
      .limit(1)
    out.fzth_players = { status, error: error?.message ?? null, rows: (data ?? []).length }
    out.player_id = data?.[0]?.id ?? null
  }
  const pid = out.player_id
  // player_progression
  {
    const { data, error, status } = await sb
      .from('player_progression')
      .select('*')
      .eq('player_id', pid)
      .limit(1)
    out.player_progression = { status, error: error?.message ?? null, rows: (data ?? []).length }
  }
  // player_stats_agg
  {
    const { data, error, status } = await sb
      .from('player_stats_agg')
      .select('*')
      .eq('player_id', pid)
      .limit(1)
    out.player_stats_agg = { status, error: error?.message ?? null, rows: (data ?? []).length }
  }
  // player_hero_stats
  {
    const { data, error, status } = await sb
      .from('player_hero_stats')
      .select('hero_id, matches')
      .eq('player_id', pid)
    out.player_hero_stats = { status, error: error?.message ?? null, rows: (data ?? []).length }
  }
  // player_achievements
  {
    const { data, error, status } = await sb
      .from('player_achievements')
      .select('achievement_id, unlocked_at')
      .eq('player_id', pid)
    out.player_achievements = { status, error: error?.message ?? null, rows: (data ?? []).length }
  }
  // achievement_catalog
  {
    const { data, error, status } = await sb
      .from('achievement_catalog')
      .select('id, name')
      .limit(5)
    out.achievement_catalog = { status, error: error?.message ?? null, rows: (data ?? []).length }
  }
  // ai_insights
  {
    const { data, error, status } = await sb
      .from('ai_insights')
      .select('id, insight_type, content')
      .eq('player_id', pid)
    out.ai_insights = { status, error: error?.message ?? null, rows: (data ?? []).length }
  }
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


