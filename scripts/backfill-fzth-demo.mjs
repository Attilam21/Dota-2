// Backfill FZTH aggregates for DEMO player from matches_digest
// Run: pnpm backfill:fzth-demo
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

function kda(k, d, a) {
  return (k + a) / Math.max(1, d)
}

async function main() {
  const sb = getAdmin()
  // 1) Read matches for the player
  const { data: matches, error } = await sb
    .from('matches_digest')
    .select('*')
    .eq('player_account_id', DEMO_DOTA_ACCOUNT_ID)
    .order('start_time', { ascending: true })
  if (error) throw error
  if (!matches || matches.length === 0) {
    console.log('No matches for player', DEMO_DOTA_ACCOUNT_ID)
    return
  }
  // 2) Ensure fzth_players record
  const nickname = `TestPlayer${DEMO_DOTA_ACCOUNT_ID}`
  const { data: upPlayers, error: upErr } = await sb
    .from('fzth_players')
    .upsert([{ dota_account_id: DEMO_DOTA_ACCOUNT_ID, nickname }], { onConflict: 'dota_account_id' })
    .select('id, dota_account_id')
  if (upErr) throw upErr
  const playerId = upPlayers?.[0]?.id
  if (!playerId) throw new Error('Unable to resolve fzth_players.id')
  // 3) Aggregate player stats
  const total = matches.length
  const wins = matches.filter((m) => m.result === 'win').length
  const winrate = Math.round((wins / Math.max(1, total)) * 100)
  const sumK = matches.reduce((a, m) => a + (m.kills ?? 0), 0)
  const sumD = matches.reduce((a, m) => a + (m.deaths ?? 0), 0)
  const sumA = matches.reduce((a, m) => a + (m.assists ?? 0), 0)
  const kdaAvg = Number(((sumK + sumA) / Math.max(1, sumD)).toFixed(2))
  const avgDurMin = Math.round(matches.reduce((a, m) => a + (m.duration_seconds ?? 0), 0) / Math.max(1, total) / 60)
  await sb.from('player_stats_agg').upsert(
    [
      {
        player_id: playerId,
        total_matches: total,
        winrate,
        kda_avg: kdaAvg,
        avg_duration_minutes: avgDurMin,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'player_id' },
  )
  // 4) Per-hero stats
  const perHero = new Map()
  for (const m of matches) {
    const cur = perHero.get(m.hero_id) || { matches: 0, wins: 0, sumK: 0, sumD: 0, sumA: 0, sumDur: 0 }
    cur.matches++
    if (m.result === 'win') cur.wins++
    cur.sumK += m.kills ?? 0
    cur.sumD += m.deaths ?? 0
    cur.sumA += m.assists ?? 0
    cur.sumDur += m.duration_seconds ?? 0
    perHero.set(m.hero_id, cur)
  }
  const heroRows = []
  for (const [heroId, v] of perHero.entries()) {
    heroRows.push({
      player_id: playerId,
      hero_id: heroId,
      matches: v.matches,
      wins: v.wins,
      winrate: Math.round((v.wins / Math.max(1, v.matches)) * 100),
      kda_avg: Number(((v.sumK + v.sumA) / Math.max(1, v.sumD)).toFixed(2)),
      avg_duration_minutes: Math.round(v.sumDur / Math.max(1, v.matches) / 60),
      updated_at: new Date().toISOString(),
    })
  }
  if (heroRows.length > 0) {
    await sb.from('player_hero_stats').upsert(heroRows, { onConflict: 'player_id,hero_id' })
  }
  console.log(
    JSON.stringify(
      {
        player: DEMO_DOTA_ACCOUNT_ID,
        matches: total,
        wins,
        winrate,
        kdaAvg,
        avgDurMin,
        heroes: heroRows.length,
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


