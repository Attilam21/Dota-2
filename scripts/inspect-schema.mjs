// Introspect columns for target tables via information_schema
import { createClient } from '@supabase/supabase-js'

const TARGET_TABLES = [
  'player_stats_agg',
  'player_hero_stats',
  'player_lane_role_stats',
  'player_progression',
  'player_achievements',
  'ai_insights',
]

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_TOKEN
  if (!url || !key) throw new Error('Missing SUPABASE service credentials')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function fetchColumns(sb, table) {
  // Try information_schema.columns
  const { data, error } = await sb
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', table)
    .order('column_name', { ascending: true })
  if (!error && data) return data
  return []
}

async function main() {
  const sb = getAdmin()
  const result = {}
  for (const t of TARGET_TABLES) {
    try {
      const cols = await fetchColumns(sb, t)
      result[t] = cols
    } catch (e) {
      result[t] = { error: String(e?.message || e) }
    }
  }
  console.log(JSON.stringify(result, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


