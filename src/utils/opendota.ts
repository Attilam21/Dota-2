const BASE_URL = 'https://api.opendota.com/api'

export type RecentMatch = {
	match_id: number
	hero_id: number
	kills: number
	deaths: number
	assists: number
	duration: number // seconds
	start_time: number // unix seconds
	player_slot: number
	radiant_win: boolean
}

export async function getRecentMatches(dotaAccountId: number, limit = 10): Promise<RecentMatch[]> {
	const url = `${BASE_URL}/players/${dotaAccountId}/recentMatches?limit=${limit}`
	const res = await fetch(url, { cache: 'no-store' })
	if (!res.ok) {
		throw new Error(`OpenDota recentMatches error: ${res.status} ${res.statusText}`)
	}
	return (await res.json()) as RecentMatch[]
}

export type PlayerSummary = {
	account_id: number
	personaname?: string
	avatarfull?: string
	mmr_estimate?: { estimate?: number }
	plus?: boolean
}

export async function getPlayerSummary(dotaAccountId: number): Promise<PlayerSummary> {
	const url = `${BASE_URL}/players/${dotaAccountId}`
	const res = await fetch(url, { cache: 'no-store' })
	if (!res.ok) {
		throw new Error(`OpenDota player summary error: ${res.status} ${res.statusText}`)
	}
	return (await res.json()) as PlayerSummary
}

export function formatUnixSecondsToLocaleString(unixSeconds: number, locale = 'it-IT'): string {
	return new Date(unixSeconds * 1000).toLocaleString(locale)
}


