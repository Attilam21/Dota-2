export const OPEN_DOTA_BASE_URL = 'https://api.opendota.com/api'
export const OPEN_DOTA_API_KEY = process.env.OPENDOTA_API_KEY

export function buildUrl(path: string): string {
  const url = new URL(OPEN_DOTA_BASE_URL + path)
  if (OPEN_DOTA_API_KEY) {
    url.searchParams.set('api_key', OPEN_DOTA_API_KEY)
  }
  return url.toString()
}

export async function fetchFromOpenDota<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path), {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(
      `OpenDota API error: ${res.status} ${res.statusText ?? 'Unknown'}`
    )
  }
  return res.json() as Promise<T>
}

export interface RecentMatch {
  match_id: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  duration: number
  start_time: number
  player_slot: number
  radiant_win: boolean
  lane?: number // 1=safe, 2=mid, 3=offlane, 4=jungle
  lane_role?: number // 1=core, 2=support
  role?: string // es. 'Carry', 'Support'
}
