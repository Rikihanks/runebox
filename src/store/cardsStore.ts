import { create } from 'zustand'
import type { Card } from '../types'
import { fetchCards } from '../api/cardsApi'

const CACHE_KEY = 'riftbound-cards-cache'

interface CardsStore {
  cards: Card[]
  sets: { name: string; count: number }[]
  loading: boolean
  error: string | null
  loaded: boolean
  load: () => Promise<void>
  getCard: (id: string) => Card | undefined
  getChampionLegends: () => Card[]
}

function loadCache(): { cards: Card[]; sets: { name: string; count: number }[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.cards?.length) return null
    return { cards: parsed.cards, sets: parsed.sets || [] }
  } catch {
    return null
  }
}

function saveCache(cards: Card[], sets: { name: string; count: number }[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ cards, sets, timestamp: Date.now() }))
  } catch {}
}

export const useCardsStore = create<CardsStore>((set, get) => ({
  cards: [],
  sets: [],
  loading: false,
  error: null,
  loaded: false,

  load: async () => {
    if (get().loading) return

    // Try cache first
    const cached = loadCache()
    if (cached) {
      set({ cards: cached.cards, sets: cached.sets, loaded: true, loading: false, error: null })
    }

    // Always fetch fresh data in background (no loading spinner if we have cache)
    const hadCache = cached != null
    if (!hadCache) set({ loading: true, error: null })

    try {
      const data = await fetchCards()
      set({ cards: data.cards, sets: data.sets, loaded: true, loading: false })
      saveCache(data.cards, data.sets)
    } catch (err: any) {
      if (!hadCache) {
        // Try cache as last resort
        const fallback = loadCache()
        if (fallback) {
          set({ cards: fallback.cards, sets: fallback.sets, loaded: true, loading: false })
          return
        }
        set({ loading: false, error: err.message || 'Error loading cards' })
      }
      // If we had cache, silently keep it
    }
  },

  getCard: (id) => get().cards.find(c => c.id === id),
  getChampionLegends: () => get().cards.filter(c => c.isChampionLegend),
}))
