import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card, Deck, DeckValidation } from '../types'
import { useCardsStore } from './cardsStore'

function getCards() {
  return useCardsStore.getState().cards
}

interface DeckStore {
  decks: Deck[]
  currentDeck: Deck | null
  createDeck: (name: string, championLegendId: string) => string
  deleteDeck: (deckId: string) => void
  renameDeck: (deckId: string, name: string) => void
  setCurrentDeck: (deckId: string | null) => void
  addCardToDeck: (cardId: string) => void
  removeCardFromDeck: (cardId: string) => void
  validateDeck: (deckId: string) => DeckValidation
  getDeckCards: (deckId: string) => Card[]
  getChampionLegend: (deckId: string) => Card | undefined
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      decks: [],
      currentDeck: null,

      createDeck: (name, championLegendId) => {
        const id = crypto.randomUUID()
        const deck: Deck = {
          id,
          name,
          championLegendId,
          cardIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({ decks: [...state.decks, deck], currentDeck: deck }))
        return id
      },

      deleteDeck: (deckId) =>
        set((state) => ({
          decks: state.decks.filter((d) => d.id !== deckId),
          currentDeck: state.currentDeck?.id === deckId ? null : state.currentDeck,
        })),

      renameDeck: (deckId, name) =>
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId ? { ...d, name, updatedAt: Date.now() } : d
          ),
          currentDeck:
            state.currentDeck?.id === deckId
              ? { ...state.currentDeck, name, updatedAt: Date.now() }
              : state.currentDeck,
        })),

      setCurrentDeck: (deckId) =>
        set((state) => ({
          currentDeck: deckId ? state.decks.find((d) => d.id === deckId) ?? null : null,
        })),

      addCardToDeck: (cardId) =>
        set((state) => {
          const deck = state.decks.find((d) => d.id === state.currentDeck?.id)
          if (!deck) return state

          const card = getCards().find((c) => c.id === cardId)
          if (!card) return state

          const count = deck.cardIds.filter((id) => id === cardId).length
          if (count >= 3) return state

          const newDeck = {
            ...deck,
            cardIds: [...deck.cardIds, cardId],
            updatedAt: Date.now(),
          }

          return {
            decks: state.decks.map((d) => (d.id === newDeck.id ? newDeck : d)),
            currentDeck: newDeck,
          }
        }),

      removeCardFromDeck: (cardId) =>
        set((state) => {
          const deck = state.decks.find((d) => d.id === state.currentDeck?.id)
          if (!deck) return state

          const index = deck.cardIds.lastIndexOf(cardId)
          if (index === -1) return state

          const newIds = [...deck.cardIds]
          newIds.splice(index, 1)

          const newDeck = {
            ...deck,
            cardIds: newIds,
            updatedAt: Date.now(),
          }

          return {
            decks: state.decks.map((d) => (d.id === newDeck.id ? newDeck : d)),
            currentDeck: newDeck,
          }
        }),

      validateDeck: (deckId) => {
        const store = get()
        const deck = store.decks.find((d) => d.id === deckId)
        if (!deck) return { valid: false, errors: ['Deck not found'], totalCards: 0, domainMatch: false }

        const allCards = getCards()
        const errors: string[] = []
        const deckCards = deck.cardIds.map((id) => allCards.find((c) => c.id === id)).filter(Boolean) as Card[]
        const championLegend = allCards.find((c) => c.id === deck.championLegendId)

        if (!championLegend) {
          errors.push('No Champion Legend selected')
        }

        if (deckCards.length < 40) {
          errors.push(`Deck too small: ${deckCards.length}/40 cards`)
        }

        const cardCounts = new Map<string, number>()
        deckCards.forEach((c) => cardCounts.set(c.id, (cardCounts.get(c.id) ?? 0) + 1))
        cardCounts.forEach((count, id) => {
          if (count > 3) {
            const card = allCards.find((c) => c.id === id)
            errors.push(`Maximum 3 copies of "${card?.name ?? id}" (you have ${count})`)
          }
        })

        let domainMatch = true
        if (championLegend) {
          const legendDomains = championLegend.domains
          deckCards.forEach((card) => {
            const matches = card.domains.some((d) => legendDomains.includes(d))
            if (!matches) {
              domainMatch = false
            }
          })
          if (!domainMatch) {
            errors.push('Algunas cards no coinciden con los dominios de la Champion Legend')
          }
        }

        return {
          valid: errors.length === 0,
          errors,
          totalCards: deckCards.length,
          domainMatch,
        }
      },

      getDeckCards: (deckId) => {
        const deck = get().decks.find((d) => d.id === deckId)
        if (!deck) return []
        const allCards = getCards()
        return deck.cardIds.map((id) => allCards.find((c) => c.id === id)).filter(Boolean) as Card[]
      },

      getChampionLegend: (deckId) => {
        const deck = get().decks.find((d) => d.id === deckId)
        if (!deck) return undefined
        return getCards().find((c) => c.id === deck.championLegendId)
      },
    }),
    { name: 'riftbound-decks' }
  )
)
