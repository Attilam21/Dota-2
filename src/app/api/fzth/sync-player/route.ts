import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { recomputePlayerStatsAgg } from '../../../../lib/fzth/recomputeStats'

type OpenDotaMatchLite = {
  match_id: number
  player_slot: number
  radiant_win: boolean
  hero_id: number
  kills: number
  deaths: number
  assists: number
  duration: number
  start_time: number
  party_size?: number | null
  // Optional fields that may appear in some endpoints
  player_slot_parsed?: number
}

async function fetchJson<T>(url: string, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = {}
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  const res = await fetch(url, { headers, next: { revalidate: 0 } })
  if (!res.ok) {
    throw new Error(`OpenDota HTTP ${res.status} for ${url}`)
  }
  return (await res.json()) as T
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const playerIdParam = searchParams.get('playerId')
  const dotaAccountId = Number(playerIdParam)

  // 1. Validation
  if (!playerIdParam || !Number.isFinite(dotaAccountId)) {
    return NextResponse.json(
      { status: 'error', message: 'playerId mancante o non valido' },
      { status: 400 },
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { status: 'error', message: 'Missing Supabase env' },
      { status: 500 },
    )
  }

  try {
    const sb = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Resolve internal player UUID (fzth_players.id)
    let { data: players, error: pErr } = await sb
      .from('fzth_players')
      .select('id')
      .eq('dota_account_id', dotaAccountId)
      .limit(1)
    if (pErr) throw pErr
    let playerUuid = players?.[0]?.id as string | undefined
    if (!playerUuid) {
      // Register new player idempotently: fetch nickname from OpenDota profile
      const apiKeyForProfile = process.env.OPENDOTA_API_KEY
      const baseForProfile = 'https://api.opendota.com/api'
      let nickname = `Player_${dotaAccountId}`
      try {
        const profRes = await fetch(
          `${baseForProfile}/players/${dotaAccountId}${apiKeyForProfile ? `?api_key=${apiKeyForProfile}` : ''
          }`,
          { next: { revalidate: 0 } },
        )
        if (profRes.ok) {
          const prof = await profRes.json()
          const maybe = prof?.profile?.personaname
          if (typeof maybe === 'string' && maybe.trim().length > 0) {
            nickname = String(maybe).trim()
          }
        }
      } catch {
        // ignore, keep default nickname
      }
      const { data: up, error: upErr } = await sb
        .from('fzth_players')
        .upsert([{ dota_account_id: dotaAccountId, nickname }], {
          onConflict: 'dota_account_id',
        })
        .select('id')
        .limit(1)
      if (upErr) throw upErr
      playerUuid = up?.[0]?.id as string | undefined
      if (!playerUuid) {
        throw new Error('Unable to create/resolve fzth player')
      }
    }

    const apiKey = process.env.OPENDOTA_API_KEY
    const base = 'https://api.opendota.com/api'

    // 1) Try full matches
    let matches: OpenDotaMatchLite[] = []
    try {
      matches =
        (await fetchJson<OpenDotaMatchLite[]>(
          `${base}/players/${dotaAccountId}/matches?limit=5000${apiKey ? `&api_key=${apiKey}` : ''
          }`,
          apiKey,
        )) ?? []
    } catch {
      matches = []
    }

    // 2) Fallback to recent + per match details
    if (!matches || matches.length === 0) {
      let recent: Array<{ match_id: number }> = []
      try {
        recent =
          (await fetchJson<Array<{ match_id: number }>>(
            `${base}/players/${dotaAccountId}/recentMatches${apiKey ? `?api_key=${apiKey}` : ''
            }`,
            apiKey,
          )) ?? []
      } catch {
        recent = []
      }
      const limited = recent.slice(0, 50) // limit to avoid rate limits
      const detailed: OpenDotaMatchLite[] = []
      for (const r of limited) {
        try {
          const md: any = await fetchJson<any>(
            `${base}/matches/${r.match_id}${apiKey ? `?api_key=${apiKey}` : ''
            }`,
            apiKey,
          )
          if (!md || !Array.isArray(md.players)) continue
          const p = md.players.find(
            (pl: any) => Number(pl.account_id) === dotaAccountId,
          )
          if (!p) continue
          detailed.push({
            match_id: Number(md.match_id),
            player_slot: Number(p.player_slot),
            radiant_win: Boolean(md.radiant_win),
            hero_id: Number(p.hero_id),
            kills: Number(p.kills ?? 0),
            deaths: Number(p.deaths ?? 0),
            assists: Number(p.assists ?? 0),
            duration: Number(md.duration ?? 0),
            start_time: Number(md.start_time ?? 0),
            party_size: p.party_size != null ? Number(p.party_size) : null,
          })
        } catch {
          // ignore individual match fetch errors
        }
      }
      matches = detailed
    }

    // Normalize and deduplicate by match_id
    const seen = new Set<number>()
    const rows = matches
      .map((m) => {
        if (!m || !Number.isFinite(m.match_id)) return null
        if (seen.has(m.match_id)) return null
        seen.add(m.match_id)
        return {
          player_id: playerUuid,
          match_id: Number(m.match_id),
          player_slot: Number(m.player_slot ?? 0),
          radiant_win: Boolean(m.radiant_win),
          hero_id: Number(m.hero_id ?? 0),
          kills: Number(m.kills ?? 0),
          deaths: Number(m.deaths ?? 0),
          assists: Number(m.assists ?? 0),
          duration_seconds: Number(m.duration ?? 0),
          start_time:
            Number.isFinite(m.start_time) && m.start_time > 0
              ? new Date(m.start_time * 1000).toISOString()
              : new Date(0).toISOString(),
          party_size: m.party_size != null ? Number(m.party_size) : null,
        }
      })
      .filter(Boolean) as Array<{
        player_id: string
        match_id: number
        player_slot: number
        radiant_win: boolean
        hero_id: number
        kills: number
        deaths: number
        assists: number
        duration_seconds: number
        start_time: string
        party_size: number | null
      }>

    // Also upsert into matches_digest (authoritative store)
    let importedDigest = 0
    if (rows.length > 0) {
      const digestRows = rows.map((r) => {
        const isRadiant = (r.player_slot & 0x80) === 0
        const result =
          (r.radiant_win && isRadiant) || (!r.radiant_win && !isRadiant)
            ? 'win'
            : 'lose'
        return {
          match_id: r.match_id,
          player_account_id: Number(dotaAccountId),
          hero_id: r.hero_id,
          kills: r.kills,
          deaths: r.deaths,
          assists: r.assists,
          duration_seconds: r.duration_seconds,
          start_time: r.start_time,
          radiant_win: r.radiant_win,
          party_size: r.party_size,
          result,
        }
      })
      const { error: digErr } = await sb
        .from('matches_digest')
        .upsert(digestRows, { onConflict: 'player_account_id,match_id' })
      if (digErr) {
        console.warn(
          'SYNC_PLAYER: matches_digest upsert failed, fallback row-by-row',
          {
            playerId: dotaAccountId,
            error: digErr?.message ?? String(digErr),
          },
        )
        for (const d of digestRows) {
          const { data: ex } = await sb
            .from('matches_digest')
            .select('match_id')
            .eq('player_account_id', d.player_account_id)
            .eq('match_id', d.match_id)
            .limit(1)
          if (ex && ex.length > 0) {
            await sb
              .from('matches_digest')
              .update(d)
              .eq('player_account_id', d.player_account_id)
              .eq('match_id', d.match_id)
          } else {
            const { error: insErr } = await sb
              .from('matches_digest')
              .insert([d])
            if (!insErr) importedDigest += 1
          }
        }
      } else {
        importedDigest = digestRows.length
      }
    }

    let imported = 0
    let updated = 0
    if (rows.length > 0) {
      // Upsert into player_matches (unique key on match_id + player_id)
      const { error: upErr } = await sb
        .from('player_matches')
        .upsert(rows, { onConflict: 'match_id,player_id' })
      if (upErr) {
        console.warn(
          'SYNC_PLAYER: player_matches upsert failed, fallback to row-by-row',
          {
            playerId: playerUuid,
            error: upErr?.message ?? String(upErr),
          },
        )
        // If onConflict key name differs on DB, try insert/update per-row to preserve idempotency
        for (const row of rows) {
          const { data: exists, error: exErr } = await sb
            .from('player_matches')
            .select('match_id')
            .eq('player_id', row.player_id)
            .eq('match_id', row.match_id)
            .limit(1)
          if (!exErr && exists && exists.length > 0) {
            const { error: updErr } = await sb
              .from('player_matches')
              .update(row)
              .eq('player_id', row.player_id)
              .eq('match_id', row.match_id)
            if (!updErr) updated += 1
          } else {
            const { error: insErr } = await sb
              .from('player_matches')
              .insert([row])
            if (!insErr) imported += 1
          }
        }
      } else {
        // Heuristic: count as imported
        imported = rows.length
      }
    }

    // Recompute KPIs from player_matches
    // Prefer KPIs from player_matches; if not available, fallback to matches_digest
    let lst: any[] = []
    let selErr: any = null
    {
      const { data, error } = await sb
        .from('player_matches')
        .select(
          'match_id, radiant_win, kills, deaths, assists, duration_seconds, hero_id',
        )
        .eq('player_id', playerUuid)
      if (!error && data) {
        lst = data
      } else {
        selErr = error
      }
    }
    if (!lst || lst.length === 0) {
      // Fallback to matches_digest (by dota account id)
      const { data: mdRows, error: mdErr } = await sb
        .from('matches_digest')
        .select(
          'match_id, result, kills, deaths, assists, duration_seconds, hero_id',
        )
        .eq('player_account_id', dotaAccountId)
      if (mdErr) {
        console.warn('SYNC_PLAYER: fallback to matches_digest failed', {
          playerId: playerUuid,
          error: mdErr?.message ?? String(mdErr),
        })
      } else {
        lst =
          (mdRows ?? []).map((r: any) => ({
            match_id: r.match_id,
            radiant_win: r.result === 'win',
            kills: r.kills ?? 0,
            deaths: r.deaths ?? 0,
            assists: r.assists ?? 0,
            duration_seconds: r.duration_seconds ?? 0,
            hero_id: r.hero_id ?? 0,
          })) ?? []
      }
    }
    const total = lst.length
    const wins = lst.filter((m: any) => !!m.radiant_win).length
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0
    const sumK = lst.reduce((a: number, m: any) => a + (m.kills ?? 0), 0)
    const sumD = lst.reduce((a: number, m: any) => a + (m.deaths ?? 0), 0)
    const sumA = lst.reduce((a: number, m: any) => a + (m.assists ?? 0), 0)
    const sumDur = lst.reduce(
      (a: number, m: any) => a + (m.duration_seconds ?? 0),
      0,
    )
    const avgKda =
      total > 0 ? Number(((sumK + sumA) / Math.max(1, sumD)).toFixed(2)) : 0
    const avgDurationSec = total > 0 ? Math.round(sumDur / total) : 0
    console.log('SYNC_PLAYER: KPI computed', {
      playerId: playerUuid,
      total,
      winrate,
      avgKda,
      avgDurationSec,
    })

    // Upsert player_stats_agg robust
    {
      const payload = {
        player_id: playerUuid,
        total_matches: total,
        winrate,
        avg_kda: avgKda,
        avg_duration_sec: avgDurationSec,
      }
      const { error: upAggErr } = await sb
        .from('player_stats_agg')
        .upsert([payload], { onConflict: 'player_id' })
      if (upAggErr) {
        console.warn('SYNC_PLAYER: player_stats_agg upsert failed', {
          playerId: playerUuid,
          error: upAggErr?.message ?? String(upAggErr),
        })
        const { data: exists, error: exErr } = await sb
          .from('player_stats_agg')
          .select('player_id')
          .eq('player_id', playerUuid)
          .limit(1)
        if (!exErr && exists && exists.length > 0) {
          const { error: updErr } = await sb
            .from('player_stats_agg')
            .update(payload)
            .eq('player_id', playerUuid)
          if (updErr) {
            console.error(
              'SYNC_PLAYER: CRITICAL - player_stats_agg not updated',
              {
                playerId: playerUuid,
                total,
                error: updErr?.message ?? String(updErr),
              },
            )
          }
        } else {
          const { error: insErr } = await sb
            .from('player_stats_agg')
            .insert([payload])
          if (insErr) {
            console.error(
              'SYNC_PLAYER: CRITICAL - player_stats_agg not inserted',
              {
                playerId: playerUuid,
                total,
                error: insErr?.message ?? String(insErr),
              },
            )
          }
        }
      }
    }

    // Upsert player_hero_stats
    {
      const perHero = new Map<
        number,
        {
          matches: number
          wins: number
          sumK: number
          sumD: number
          sumA: number
          sumDur: number
        }
      >()
      for (const m of lst) {
        const heroId = Number(m.hero_id ?? 0)
        if (!Number.isFinite(heroId) || heroId <= 0) continue
        const cur = perHero.get(heroId) ?? {
          matches: 0,
          wins: 0,
          sumK: 0,
          sumD: 0,
          sumA: 0,
          sumDur: 0,
        }
        cur.matches += 1
        if (m.radiant_win) cur.wins += 1
        cur.sumK += m.kills ?? 0
        cur.sumD += m.deaths ?? 0
        cur.sumA += m.assists ?? 0
        cur.sumDur += m.duration_seconds ?? 0
        perHero.set(heroId, cur)
      }
      const heroRows = Array.from(perHero.entries()).map(([heroId, v]) => ({
        player_id: playerUuid,
        hero_id: heroId,
        matches: v.matches,
        wins: v.wins,
        kda_avg: Number(((v.sumK + v.sumA) / Math.max(1, v.sumD)).toFixed(2)),
        avg_duration_sec: v.matches > 0 ? Math.round(v.sumDur / v.matches) : 0,
        winrate: v.matches > 0 ? Math.round((v.wins / v.matches) * 100) : 0,
      }))
      if (heroRows.length > 0) {
        const { error: herr } = await sb
          .from('player_hero_stats')
          .upsert(heroRows, { onConflict: 'player_id,hero_id' })
        if (herr) {
          // fall back to per-row insert/update
          for (const hr of heroRows) {
            const { data: exists } = await sb
              .from('player_hero_stats')
              .select('player_id')
              .eq('player_id', hr.player_id)
              .eq('hero_id', hr.hero_id)
              .limit(1)
            if (exists && exists.length > 0) {
              await sb
                .from('player_hero_stats')
                .update(hr)
                .eq('player_id', hr.player_id)
                .eq('hero_id', hr.hero_id)
            } else {
              await sb.from('player_hero_stats').insert([hr])
            }
          }
        }
      }
    }

    // Recompute aggregates from matches_digest (authoritative)
    const agg = await recomputePlayerStatsAgg(sb, dotaAccountId)

    console.log(
      'FZTH sync-player completed for',
      dotaAccountId,
      'imported:',
      imported,
    )
    return NextResponse.json({
      status: 'ok',
      playerId: dotaAccountId,
      matchesInserted: imported,
      playerUpserted: true,
      kpi: {
        totalMatches: agg.totalMatches,
        winrate: agg.winrate,
        avgKda: agg.avgKda,
        avgDurationSec: agg.avgDurationSec,
      },
    })
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('FZTH_SYNC_PLAYER_ERROR', e)
    return NextResponse.json(
      { status: 'error', message: String(e?.message ?? 'FZTH sync error') },
      { status: 500 },
    )
  }
}
