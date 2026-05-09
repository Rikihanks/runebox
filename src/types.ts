export type CardType = 'champion' | 'unit' | 'spell' | 'gear'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary'
export type SetName = 'Origins' | 'Unleashed' | 'Spiritforged'
export type Domain = 'Demacia' | 'Noxus' | 'Ionia' | 'Shadow Isles' | 'Piltover' | 'Zaun' | 'Freljord' | 'Shurima' | 'Targon' | 'Bandle City' | 'Bilgewater' | 'Void' | 'Ixtal' | 'Icathia'

export interface Card {
  id: string
  name: string
  set: SetName
  type: CardType
  domains: Domain[]
  cost: number
  might?: number
  health?: number
  rarity: Rarity
  text?: string
  isChampionLegend?: boolean
  championName?: string
  imageUrl?: string
  price?: number
  foilPrice?: number
  cmPrice?: number
  cmFoilPrice?: number
  cmUrl?: string
}

export interface CollectionEntry {
  cardId: string
  quantity: number
  isFoil?: boolean
}

export interface Deck {
  id: string
  name: string
  championLegendId: string
  cardIds: string[]
  createdAt: number
  updatedAt: number
  shared?: boolean
}

export interface DeckValidation {
  valid: boolean
  errors: string[]
  totalCards: number
  domainMatch: boolean
}
