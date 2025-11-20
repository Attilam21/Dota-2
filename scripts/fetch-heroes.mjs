// Fetch heroes from OpenDota and write a compact JSON used at runtime.
// Run with: node scripts/fetch-heroes.mjs
import fs from 'node:fs'
import path from 'node:path'

const OUT_PATH = path.join(process.cwd(), 'src', 'data', 'dotaHeroes.json')
const OPEN_DOTA_HEROES = 'https://api.opendota.com/api/heroes'

function toImgPath(heroName) {
  // heroName example: "npc_dota_hero_antimage" -> "antimage_full.png"
  if (typeof heroName !== 'string') return null
  const short = heroName.replace(/^npc_dota_hero_/, '')
  if (!short) return null
  return `/apps/dota2/images/heroes/${short}_full.png`
}

async function main() {
  const res = await fetch(OPEN_DOTA_HEROES)
  if (!res.ok) {
    throw new Error(`OpenDota heroes HTTP ${res.status}`)
  }
  const list = await res.json()
  const compact = list.map((h) => ({
    id: Number(h.id),
    localized_name: String(h.localized_name ?? ''),
    img: toImgPath(h.name) || null,
  }))
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(compact, null, 2), 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Wrote ${compact.length} heroes → ${OUT_PATH}`)
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})


