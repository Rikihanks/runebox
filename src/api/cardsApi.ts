import type { Card, Domain } from '../types'

// In dev (Vite proxy): /api/cards
// In production: use CORS proxy or direct URL
const API_URL = import.meta.env.DEV
  ? '/api/cards'
  : 'https://api.dotgg.gg/cgfw/getcards?game=riftbound&mode=indexed'

// Some CORS proxies if direct access fails
const CORS_PROXIES = [
  'https://corsproxy.io/?url=',
  'https://api.allorigins.win/raw?url=',
]

const REGION_TAGS = new Set([
  'Demacia', 'Noxus', 'Ionia', 'Shadow Isles', 'Piltover', 'Zaun',
  'Freljord', 'Shurima', 'Targon', 'Bandle City', 'Bilgewater',
  'The Void', 'Icathia', 'Ixtal', 'Mount Targon',
])

const CHAMPION_REGIONS: Record<string, string> = {
  Ahri: 'Ionia', Akali: 'Ionia', Akshan: 'Shurima', Annie: 'Noxus',
  Aphelios: 'Targon', Ashe: 'Freljord', Azir: 'Shurima',
  Blitzcrank: 'Zaun', Bard: 'Targon',
  Caitlyn: 'Piltover', Camille: 'Piltover', "Cho'Gath": 'Void',
  Darius: 'Noxus', Diana: 'Targon', Draven: 'Noxus',
  Ekko: 'Zaun', Ezreal: 'Piltover',
  Fiora: 'Demacia', Fizz: 'Bilgewater',
  Gangplank: 'Bilgewater', Garen: 'Demacia', Gnar: 'Freljord', Gragas: 'Freljord',
  Hecarim: 'Shadow Isles', Heimerdinger: 'Piltover',
  Illaoi: 'Bilgewater', Irelia: 'Ionia',
  Janna: 'Zaun', Jarvan: 'Demacia', Jax: 'Icathia', Jayce: 'Piltover', Jhin: 'Ionia', Jinx: 'Zaun',
  "Kai'Sa": 'Void', Karma: 'Ionia', Karthus: 'Shadow Isles', Kassadin: 'Void',
  Katarina: 'Noxus', Kayle: 'Targon', Kayn: 'Ionia', Kennen: 'Ionia', "Kha'Zix": 'Void',
  Kindred: 'Shadow Isles', Kled: 'Noxus', "Kog'Maw": 'Void',
  LeBlanc: 'Noxus', 'Lee Sin': 'Ionia', Leona: 'Targon', Lillia: 'Ixtal',
  Lissandra: 'Freljord', Lucian: 'Demacia', Lulu: 'Bandle City', Lux: 'Demacia',
  Malphite: 'Ixtal', Malzahar: 'Void', Maokai: 'Shadow Isles', 'Master Yi': 'Ionia',
  Mordekaiser: 'Noxus', Morgana: 'Demacia',
  Nami: 'Bilgewater', Nasus: 'Shurima', Nautilus: 'Bilgewater', Nidalee: 'Ixtal',
  Nocturne: 'Shadow Isles', Nunu: 'Freljord',
  Olaf: 'Freljord', Orianna: 'Piltover', Ornn: 'Freljord',
  Pantheon: 'Targon', Poppy: 'Demacia', Pyke: 'Bilgewater',
  Qiyana: 'Ixtal', Quinn: 'Demacia',
  Rakan: 'Ionia', Rammus: 'Shurima', "Rek'Sai": 'Void', Renekton: 'Shurima',
  Rengar: 'Ixtal', Riven: 'Noxus', Rumble: 'Bandle City', Ryze: 'Freljord',
  Samira: 'Noxus', Sejuani: 'Freljord', Senna: 'Shadow Isles', Sett: 'Ionia',
  Shaco: 'Shadow Isles', Shen: 'Ionia', Shyvana: 'Demacia', Singed: 'Zaun', Sion: 'Noxus',
  Sivir: 'Shurima', Skarner: 'Ixtal', Sona: 'Demacia', Soraka: 'Targon',
  Swain: 'Noxus', Sylas: 'Demacia', Syndra: 'Ionia',
  'Tahm Kench': 'Bilgewater', Taliyah: 'Shurima', Talon: 'Noxus',
  Teemo: 'Bandle City', Thresh: 'Shadow Isles', Tristana: 'Bandle City',
  Trundle: 'Freljord', Tryndamere: 'Freljord', 'Twisted Fate': 'Bilgewater', Twitch: 'Zaun',
  Udyr: 'Freljord', Urgot: 'Zaun',
  Varus: 'Ionia', Vayne: 'Demacia', Veigar: 'Bandle City', "Vel'Koz": 'Void',
  Vi: 'Piltover', Viego: 'Shadow Isles', Viktor: 'Zaun', Volibear: 'Freljord',
  Warwick: 'Zaun',
  Xerath: 'Shurima', 'Xin Zhao': 'Demacia',
  Yasuo: 'Ionia', Yone: 'Ionia', Yuumi: 'Bandle City',
  Zilean: 'Icathia',
}

const COLOR_REGIONS: Record<string, string[]> = {
  Fury: ['Noxus', 'Freljord', 'Bilgewater', 'Void'],
  Order: ['Demacia', 'Piltover', 'Shurima', 'Targon'],
  Calm: ['Ionia', 'Targon', 'Bandle City'],
  Mind: ['Piltover', 'Zaun', 'Ixtal', 'Shurima'],
  Body: ['Freljord', 'Noxus', 'Ionia'],
  Chaos: ['Shadow Isles', 'Bilgewater', 'Ionia', 'Zaun', 'Void'],
  Colorless: [],
}

const CHAMPION_NAMES = new Set(Object.keys(CHAMPION_REGIONS))

export interface CardData {
  cards: Card[]
  sets: { name: string; count: number }[]
}

function extractDomains(color: unknown, tags: unknown): Domain[] {
  const domains = new Set<string>()

  if (Array.isArray(tags)) {
    for (const tag of tags) {
      if (typeof tag === 'string') {
        if (REGION_TAGS.has(tag)) {
          const mapped = tag === 'The Void' || tag === 'Icathia' ? 'Void'
            : tag === 'Mount Targon' ? 'Targon'
            : tag
          domains.add(mapped)
        }
        if (CHAMPION_REGIONS[tag]) {
          domains.add(CHAMPION_REGIONS[tag])
        }
      }
    }
  }

  if (Array.isArray(color) && domains.size === 0) {
    for (const c of color) {
      const regions = COLOR_REGIONS[c]
      if (regions) regions.forEach(r => domains.add(r))
    }
  }

  return Array.from(domains) as Domain[]
}

function mapRarity(raw: string): string {
  const r = raw?.toLowerCase() ?? 'common'
  if (r === 'epic') return 'rare'
  if (r === 'showcase') return 'legendary'
  return r
}

function cleanText(text: string): string {
  if (!text || text === 'null') return ''
  return text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/:rb_[a-z_0-9]+:/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function findChampion(tags: unknown): string | undefined {
  if (!Array.isArray(tags)) return undefined
  return tags.find(t => typeof t === 'string' && CHAMPION_NAMES.has(t))
}

export async function fetchCards(): Promise<CardData> {
  const encodedUrl = encodeURIComponent('https://api.dotgg.gg/cgfw/getcards?game=riftbound&mode=indexed')

  const urlsToTry = [API_URL]
  if (!import.meta.env.DEV) {
    for (const proxy of CORS_PROXIES) {
      urlsToTry.push(proxy + encodedUrl)
    }
  }

  let lastError: Error | null = null
  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) continue
      const text = await res.text()
      const json = JSON.parse(text)
      const names: string[] = json.names
      const data: any[][] = json.data
      const n = Object.fromEntries(names.map((v, i) => [v, i]))

      const cards: Card[] = []
      const setCounts: Record<string, number> = {}

      for (const row of data) {
        const id = row[n['id']]
    const name = row[n['name']]
    const type = row[n['type']]
    const color = row[n['color']]
    const costStr = row[n['cost']]
    const mightStr = row[n['might']]
    const set_name = row[n['set_name']] || ''
    const rarity = row[n['rarity']]
    const image = row[n['image']]
    const effect = row[n['effect']] || ''
    const flavor = row[n['flavor']] || ''
    const errata = row[n['errata']] || ''
    const tags = row[n['tags']]
    const priceRaw = row[n['price']]
    const foilPriceRaw = row[n['foilPrice']]
    const cmPriceRaw = row[n['cmPrice']]
    const cmFoilPriceRaw = row[n['cmFoilPrice']]
    const cmUrlRaw = row[n['cmurl']]

    const rawType = type?.toLowerCase() ?? ''
    let cardType: string
    if (rawType === 'unit') cardType = 'unit'
    else if (rawType === 'spell') cardType = 'spell'
    else if (rawType === 'gear') cardType = 'gear'
    else if (rawType === 'legend') cardType = 'champion'
    else continue

    if (!id || !name) continue

    // Map set
    const sn = set_name.toLowerCase()
    let set: string
    if (sn.includes('origins') || sn.includes('proving') || sn.includes('arcane')) set = 'Origins'
    else if (sn.includes('unleashed')) set = 'Unleashed'
    else if (sn.includes('spiritforged')) set = 'Spiritforged'
    else continue

    const domains = extractDomains(color, tags)
    if (domains.length === 0) {
      // Fallback: try champion name for Legends without region tags
      const champ = findChampion(tags)
      if (champ && CHAMPION_REGIONS[champ]) {
        domains.push(CHAMPION_REGIONS[champ] as Domain)
      }
    }
    if (domains.length === 0) continue

    const cost = costStr != null ? parseInt(costStr) || 0 : 0
    const might = mightStr != null && cardType !== 'spell' && cardType !== 'gear' ? parseInt(mightStr) || undefined : undefined
    const isChampionLegend = type === 'Legend'

    const textParts: string[] = []
    const ec = cleanText(effect)
    if (ec) textParts.push(ec)
    const erc = cleanText(errata)
    if (erc) textParts.push(`[Errata] ${erc}`)
    const fc = cleanText(flavor)
    if (fc && fc !== ec) textParts.push(fc)
    const text = textParts.join(' ') || undefined

    cards.push({
      id,
      name: name.replace(/\n/g, ' ').trim(),
      set: set as any,
      type: cardType as any,
      domains,
      cost,
      ...(might !== undefined && { might }),
      rarity: mapRarity(rarity) as any,
      ...(isChampionLegend && { isChampionLegend: true }),
      ...(text && { text }),
      ...(image && { imageUrl: image }),
      ...(priceRaw != null && { price: parseFloat(priceRaw) }),
      ...(foilPriceRaw != null && { foilPrice: parseFloat(foilPriceRaw) }),
      ...(cmPriceRaw != null && { cmPrice: parseFloat(cmPriceRaw) }),
      ...(cmFoilPriceRaw != null && { cmFoilPrice: parseFloat(cmFoilPriceRaw) }),
      ...(cmUrlRaw && { cmUrl: cmUrlRaw }),
    })

    setCounts[set] = (setCounts[set] ?? 0) + 1
  }

  const sets = Object.entries(setCounts).map(([name, count]) => ({ name, count }))

  return { cards, sets }
    } catch (e: any) {
      lastError = e
    }
  }

  throw lastError || new Error('Failed to fetch cards')
}
