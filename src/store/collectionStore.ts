import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CollectionEntry } from '../types'
import { useCardsStore } from './cardsStore'

interface CollectionStore {
  collection: Record<string, CollectionEntry>
  addCard: (cardId: string, quantity?: number) => void
  removeCard: (cardId: string, quantity?: number) => void
  setQuantity: (cardId: string, quantity: number) => void
  getCardCount: (cardId: string) => number
  getTotalCards: () => number
  getCompletion: () => { owned: number; total: number; percentage: number }
  getTotalValue: () => number
  getCardsBySet: (setName: string) => CollectionEntry[]
}

const rarityPrices: Record<string, number> = {
  common: 0.25,
  uncommon: 0.75,
  rare: 2.5,
  legendary: 8,
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      collection: {},

      addCard: (cardId, quantity = 1) =>
        set((state) => {
          const existing = state.collection[cardId]
          return {
            collection: {
              ...state.collection,
              [cardId]: {
                cardId,
                quantity: (existing?.quantity ?? 0) + quantity,
              },
            },
          }
        }),

      removeCard: (cardId, quantity = 1) =>
        set((state) => {
          const existing = state.collection[cardId]
          if (!existing) return state
          const newQty = existing.quantity - quantity
          if (newQty <= 0) {
            const { [cardId]: _, ...rest } = state.collection
            return { collection: rest }
          }
          return {
            collection: {
              ...state.collection,
              [cardId]: { ...existing, quantity: newQty },
            },
          }
        }),

      setQuantity: (cardId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const { [cardId]: _, ...rest } = state.collection
            return { collection: rest }
          }
          return {
            collection: {
              ...state.collection,
              [cardId]: { cardId, quantity },
            },
          }
        }),

      getCardCount: (cardId) => get().collection[cardId]?.quantity ?? 0,

      getTotalCards: () => {
        const store = get()
        return Object.values(store.collection).reduce((sum, e) => sum + e.quantity, 0)
      },

      getCompletion: () => {
        const store = get()
        const owned = Object.keys(store.collection).length
        const total = useCardsStore.getState().cards.length
        return { owned, total, percentage: Math.round((owned / total) * 100) }
      },

      getTotalValue: () => {
        const store = get()
        const allCards = useCardsStore.getState().cards
        return Object.entries(store.collection).reduce((sum, [cardId, entry]) => {
          const card = allCards.find((c) => c.id === cardId)
          if (!card) return sum
          const price = card.cmPrice ?? card.price ?? rarityPrices[card.rarity] ?? 0
          return sum + price * entry.quantity
        }, 0)
      },

      getCardsBySet: (setName) => {
        const store = get()
        const allCards = useCardsStore.getState().cards
        return Object.values(store.collection).filter((e) => {
          const card = allCards.find((c) => c.id === e.cardId)
          return card?.set === setName
        })
      },
    }),
    { name: 'riftbound-collection' }
  )
)
