import { useCardsStore } from '../store/cardsStore'
import type { Card } from '../types'

// Cards are loaded on-demand from the API via cardsStore.
// This file maintains backward compatibility for direct imports.

export function getCards(): Card[] {
  return useCardsStore.getState().cards
}

export function getCard(id: string): Card | undefined {
  return useCardsStore.getState().getCard(id)
}
