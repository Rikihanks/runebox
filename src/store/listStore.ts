import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card } from '../types'
import { useCardsStore } from './cardsStore'

export interface CardList {
  id: string
  name: string
  cardIds: string[]
  createdAt: number
  updatedAt: number
}

interface ListStore {
  lists: CardList[]
  createList: (name: string) => string
  deleteList: (id: string) => void
  renameList: (id: string, name: string) => void
  addCard: (listId: string, cardId: string) => void
  removeCard: (listId: string, cardId: string) => void
  getCards: (listId: string) => Card[]
}

export const useListStore = create<ListStore>()(
  persist(
    (set, get) => ({
      lists: [],

      createList: (name) => {
        const id = crypto.randomUUID()
        const list: CardList = { id, name, cardIds: [], createdAt: Date.now(), updatedAt: Date.now() }
        set((s) => ({ lists: [...s.lists, list] }))
        return id
      },

      deleteList: (id) =>
        set((s) => ({ lists: s.lists.filter((l) => l.id !== id) })),

      renameList: (id, name) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === id ? { ...l, name, updatedAt: Date.now() } : l)),
        })),

      addCard: (listId, cardId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId ? { ...l, cardIds: [...l.cardIds, cardId], updatedAt: Date.now() } : l
          ),
        })),

      removeCard: (listId, cardId) =>
        set((s) => ({
          lists: s.lists.map((l) => {
            if (l.id !== listId) return l
            const idx = l.cardIds.lastIndexOf(cardId)
            if (idx === -1) return l
            const newIds = [...l.cardIds]
            newIds.splice(idx, 1)
            return { ...l, cardIds: newIds, updatedAt: Date.now() }
          }),
        })),

      getCards: (listId) => {
        const list = get().lists.find((l) => l.id === listId)
        if (!list) return []
        const allCards = useCardsStore.getState().cards
        return list.cardIds.map((id) => allCards.find((c) => c.id === id)).filter(Boolean) as Card[]
      },
    }),
    { name: 'riftbound-lists' }
  )
)
