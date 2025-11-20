import heroesData from '@/data/dotaHeroes.json'

export type DotaHero = {
  id: number
  localized_name: string
  img?: string | null
  iconUrl?: string | null
}

export const HERO_IMG_BASE_URL = 'https://api.opendota.com'

export const heroes: DotaHero[] = (heroesData as DotaHero[]).map((h) => ({
  ...h,
  iconUrl: h.img ? `${HERO_IMG_BASE_URL}${h.img}` : null,
}))

export function getHeroById(id: number): DotaHero | undefined {
  if (!Number.isFinite(id)) return undefined
  return heroes.find((h) => h.id === id)
}

export function getHeroName(id: number): string {
  const hero = getHeroById(id)
  return hero?.localized_name ?? `Eroe #${id}`
}

export function getHeroIconUrl(id: number): string | null {
  const hero = getHeroById(id)
  if (!hero) return null
  if (hero.iconUrl) return hero.iconUrl
  if (hero.img) return `${HERO_IMG_BASE_URL}${hero.img}`
  return null
}
