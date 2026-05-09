import LZString from 'lz-string'

export interface ShareDeck {
  v: number
  name: string
  legend: string
  cards: [string, number][]
}

export interface ShareList {
  v: number
  name: string
  cards: [string, number][]
}

const CURRENT_VERSION = 1

// ─── Decks ──────────────────────────────────────

export function encodeDeck(name: string, legendId: string, cardIds: string[]): string {
  const counts = new Map<string, number>()
  cardIds.forEach(id => counts.set(id, (counts.get(id) ?? 0) + 1))
  const deck: ShareDeck = { v: CURRENT_VERSION, name, legend: legendId, cards: Array.from(counts.entries()) }
  const json = JSON.stringify(deck)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeDeck(encoded: string): ShareDeck {
  const json = LZString.decompressFromEncodedURIComponent(encoded)
  if (!json) throw new Error('Could not decompress deck')
  const deck = JSON.parse(json)
  if (!deck.legend) throw new Error('Not a valid deck (missing champion legend)')
  return migrateDeck(deck)
}

export function validateDeck(deck: ShareDeck, allCardIds: Set<string>): string[] {
  const errors: string[] = []
  if (!deck.v || typeof deck.v !== 'number') errors.push('Invalid deck format')
  if (!deck.legend || typeof deck.legend !== 'string') errors.push('Missing Champion Legend')
  if (!Array.isArray(deck.cards) || deck.cards.length === 0) errors.push('The deck has no cards')
  if (deck.cards) {
    let total = 0
    for (const [id, count] of deck.cards) {
      if (!allCardIds.has(id)) errors.push(`Unknown card: ${id}`)
      if (typeof count !== 'number' || count < 1 || count > 3) errors.push(`Invalid quantity para ${id}: ${count}`)
      total += count
    }
    if (total < 40) errors.push(`The deck has ${total}/40 cartas`)
  }
  return errors
}

// ─── Lists ──────────────────────────────────────

export function encodeList(name: string, cardIds: string[]): string {
  const counts = new Map<string, number>()
  cardIds.forEach(id => counts.set(id, (counts.get(id) ?? 0) + 1))
  const list: ShareList = { v: CURRENT_VERSION, name, cards: Array.from(counts.entries()) }
  return LZString.compressToEncodedURIComponent(JSON.stringify(list))
}

export function decodeList(encoded: string): ShareList {
  const json = LZString.decompressFromEncodedURIComponent(encoded)
  if (!json) throw new Error('Could not decompress list')
  const list = JSON.parse(json)
  if (list.legend) throw new Error('Not a valid list (contains deck data)')
  return migrateList(list)
}

export function validateList(list: ShareList, allCardIds: Set<string>): string[] {
  const errors: string[] = []
  if (!list.v || typeof list.v !== 'number') errors.push('Invalid list format')
  if (!Array.isArray(list.cards)) errors.push('The list has no cards')
  if (list.cards) {
    for (const [id, count] of list.cards) {
      if (!allCardIds.has(id)) errors.push(`Unknown card: ${id}`)
      if (typeof count !== 'number' || count < 1) errors.push(`Invalid quantity para ${id}: ${count}`)
    }
  }
  return errors
}

// ─── Migrations ─────────────────────────────────

function migrateDeck(deck: any): ShareDeck {
  if (deck.v === CURRENT_VERSION) return deck as ShareDeck
  throw new Error(`Unsupported deck version: ${deck.v}`)
}

function migrateList(list: any): ShareList {
  if (list.v === CURRENT_VERSION) return list as ShareList
  throw new Error(`Unsupported list version: ${list.v}`)
}

// ─── URL helpers ────────────────────────────────

export function getShareUrl(encoded: string, type: 'deck' | 'list' = 'deck'): string {
  const key = type === 'deck' ? 'd' : 'l'
  const base = window.location.origin + window.location.pathname.replace(/\/$/, '')
  return `${base}?${key}=${encoded}`
}
