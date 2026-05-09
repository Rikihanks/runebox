import { useCardsStore } from '../store/cardsStore'

export interface SetInfo {
  name: string
  code: string
  releaseDate: string
  totalCards: number
  description: string
}

const SET_META: Record<string, { code: string; releaseDate: string; description: string }> = {
  Origins: {
    code: 'OGN',
    releaseDate: '2025-06-06',
    description: 'The foundational Riftbound set.',
  },
  Unleashed: {
    code: 'UNL',
    releaseDate: '2026-04-10',
    description: 'The second Riftbound set.',
  },
  Spiritforged: {
    code: 'SFD',
    releaseDate: '2026-07-??',
    description: 'The third Riftbound set.',
  },
}

export function getSets(): SetInfo[] {
  const counts = useCardsStore.getState().sets
  const countMap: Record<string, number> = {}
  counts.forEach(s => { countMap[s.name] = s.count })

  return Object.entries(SET_META).map(([name, meta]) => ({
    name,
    ...meta,
    totalCards: countMap[name] ?? 0,
  }))
}
