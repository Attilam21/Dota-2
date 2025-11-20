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
  // 5) Basic achievements (unlocked only) → use achievement_id (uuid) from achievement_catalog
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
  // Choose achievement_catalog ids deterministically by conditions (no schema change; columns unknown except id)
  {
    let insertedAchCount = 0
    const picks = []
    if (anyClutch) picks.push(0)
    if (anyZeroDeath) picks.push(1)
    if (distinctHeroes >= 6) picks.push(2)
    if (maxStreak >= 3) picks.push(3)
    if (picks.length > 0) {
      const { data: catRows } = await sb.from('achievement_catalog').select('id').limit(8)
      const ids = []
      const seen = new Set()
      for (const idx of picks) {
        const row = catRows?.[idx]
        if (row?.id && !seen.has(row.id)) {
          ids.push(row.id)
          seen.add(row.id)
        }
      }
      const nowIso = new Date().toISOString()
      const targetRows = ids.map((aid) => ({
        player_id: playerId,
        achievement_id: aid,
        unlocked_at: nowIso,
      }))
    if (targetRows.length > 0) {
      // Try UPSERT with onConflict (player_id,achievement_id)
      const { error: upErr } = await sb
        .from('player_achievements')
        .upsert(targetRows, { onConflict: 'player_id,achievement_id' })
      if (upErr && String(upErr.code) === '42P10') {
        // Fallback: manual idempotency - update if exists else insert
        for (const row of targetRows) {
          const { data: exists } = await sb
            .from('player_achievements')
            .select('id, unlocked_at')
            .eq('player_id', row.player_id)
            .eq('achievement_id', row.achievement_id)
            .limit(1)
          if (exists && exists.length > 0) {
            await sb
              .from('player_achievements')
              .update({ unlocked_at: row.unlocked_at })
              .eq('id', exists[0].id)
          } else {
            await sb.from('player_achievements').insert([row])
            insertedAchCount += 1
          }
        }
      } else if (upErr) {
        console.error('UPSERT player_achievements ERROR', upErr)
      } else {
        insertedAchCount = targetRows.length
      }
    }
    }
    // attach to logging scope
    globalThis.__achievementsInserted = globalThis.__achievementsInserted ?? 0
    globalThis.__achievementsInserted += insertedAchCount
  }
  // 6) AI insights (deterministic, 2-3 rows) → use insight_type and content
  {
    const insights = []
    const deathsPerGame = sumD / Math.max(1, total)
    if (deathsPerGame >= 8) {
      insights.push({
        insight_type: 'weakness',
        content: `Morte media alta (${deathsPerGame.toFixed(1)}). Migliora posizionamento e visione.`,
      })
    } else {
      insights.push({
        insight_type: 'strength',
        content: `Morte media contenuta (${deathsPerGame.toFixed(1)}). Mantieni il ritmo.`,
      })
    }
    // trend winrate last 10 vs overall
    const last10 = matches.slice(-10)
    const last10Wins = last10.filter((m) => m.result === 'win').length
    const last10Wr = Math.round((last10Wins / Math.max(1, last10.length)) * 100)
    if (last10Wr < winrate - 5) {
      insights.push({
        insight_type: 'momentum',
        content: `Trend negativo: WR recente ${last10Wr}% sotto la media (${winrate}%). Valuta rotazioni/eroi diversi.`,
      })
    } else if (last10Wr > winrate + 5) {
      insights.push({
        insight_type: 'momentum',
        content: `Trend positivo: WR recente ${last10Wr}% sopra la media (${winrate}%). Continua così.`,
      })
    } else {
      insights.push({
        insight_type: 'momentum',
        content: `Trend stabile: WR recente in linea con la media (${last10Wr}% vs ${winrate}%).`,
      })
    }
    const poolSize = new Set(matches.map((m) => m.hero_id)).size
    insights.push({
      insight_type: 'breadth',
      content: `Hero pool: ${poolSize} eroi distinti. Bilancia specializzazione e versatilità.`,
    })
    // Idempotenza: non inserire insight identici già presenti
    const { data: existing } = await sb
      .from('ai_insights')
      .select('content')
      .eq('player_id', playerId)
    const have = new Set((existing ?? []).map((r) => r.content))
    const rows = insights
      .filter((i) => !have.has(i.content))
      .map((i) => ({
        player_id: playerId,
        insight_type: i.insight_type,
        content: i.content,
      }))
    if (rows.length > 0) {
      const { error: insErr } = await sb.from('ai_insights').insert(rows)
      if (insErr) console.error('INSERT ai_insights ERROR', insErr)
    }
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
        achievementsInserted: globalThis.__achievementsInserted ?? 0,
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


