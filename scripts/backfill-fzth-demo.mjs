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
  {
    const { data: existingStats } = await sb.from('player_stats_agg').select('player_id').eq('player_id', playerId).limit(1)
    if (!(existingStats && existingStats.length > 0)) {
      const { error: errIns } = await sb.from('player_stats_agg').insert([{ player_id: playerId }])
      if (errIns) console.error('INSERT player_stats_agg ERROR', errIns)
    }
  }
  // 3b) Basic progression (level/xp) derived from performance
  const perfScore = Math.round(((winrate / 100) * 0.6 + Math.max(0, Math.min(1, kdaAvg / 10)) * 0.4) * 100)
  const logBonus = Math.log10(Math.max(1, total) + 1) * 15
  const estLevel = Math.min(100, Math.floor(perfScore * 0.7 + logBonus))
  const totalXp = estLevel * 100
  {
    const { data: existingProg } = await sb.from('player_progression').select('player_id').eq('player_id', playerId).limit(1)
    if (!(existingProg && existingProg.length > 0)) {
      const { error: errIns } = await sb.from('player_progression').insert([{ player_id: playerId, current_level: estLevel }])
      if (errIns) console.error('INSERT player_progression ERROR', errIns)
    }
  }
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
    })
  }
  if (heroRows.length > 0) {
    // try insert, if unique constraint exists, ignore conflicts by inserting sequentially
    for (const row of heroRows) {
      const { error: errIns } = await sb.from('player_hero_stats').insert([row])
      if (errIns && !String(errIns.message || '').includes('duplicate')) {
        console.error('INSERT player_hero_stats ERROR', errIns)
        break
      }
    }
  }
  // 5) Basic achievements (unlocked only)
  let streak = 0
  let maxStreak = 0
  for (const m of matches) {
    if (m.result === 'win') {
      streak += 1
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 0
    }
  }
  const anyClutch = matches.some((m) => ((m.kills ?? 0) + (m.assists ?? 0)) / Math.max(1, m.deaths ?? 0) >= 10 && m.result === 'win')
  const anyZeroDeath = matches.some((m) => (m.deaths ?? 0) === 0)
  const lastN = matches.slice(-20)
  const distinctHeroes = new Set(lastN.map((m) => m.hero_id)).size
  const unlocked = [
    { code: 'clutch', cond: anyClutch },
    { code: 'iron_wall', cond: anyZeroDeath },
    { code: 'versatile', cond: distinctHeroes >= 6 },
    { code: 'streaker', cond: maxStreak >= 3 },
  ].filter((a) => a.cond)
  if (unlocked.length > 0) {
    const nowIso = new Date().toISOString()
    // Try variant A: achievement_code + unlocked_at
    let errAchFinal = null
    {
      const rowsA = unlocked.map((u) => ({
        player_id: playerId,
        achievement_code: u.code,
        unlocked_at: nowIso,
      }))
      const { error: errA } = await sb.from('player_achievements').upsert(rowsA, { onConflict: 'player_id,achievement_code' })
      if (!errA) {
        errAchFinal = null
      } else {
        errAchFinal = errA
        // Try variant B: code + unlocked_at
        const rowsB = unlocked.map((u) => ({
          player_id: playerId,
          code: u.code,
          unlocked_at: nowIso,
        }))
        const { error: errB } = await sb.from('player_achievements').upsert(rowsB, { onConflict: 'player_id,code' })
        if (!errB) {
          errAchFinal = null
        } else {
          errAchFinal = errB
          // Try variant C: achievement_code + unlocked boolean
          const rowsC = unlocked.map((u) => ({
            player_id: playerId,
            achievement_code: u.code,
            unlocked: true,
          }))
          const { error: errC } = await sb.from('player_achievements').upsert(rowsC, { onConflict: 'player_id,achievement_code' })
          if (!errC) {
            errAchFinal = null
          } else {
            errAchFinal = errC
          }
        }
      }
    }
    if (errAchFinal) console.error('UPSERT player_achievements ERROR', errAchFinal)
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
        estimatedLevel: estLevel,
        achievementsInserted: unlocked?.length ?? 0,
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


