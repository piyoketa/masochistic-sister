import type { CardTag } from './CardTag'

export type CardType = 'attack' | 'skill' | 'status'

export interface CardDefinition {
  title: string
  type: CardType
  cost: number
  description: string
  image?: string
  notes?: string[]
  cardTags?: CardTag[]
}

export interface CardDefinitionBase extends Omit<CardDefinition, 'description'> {
  description?: string
}
