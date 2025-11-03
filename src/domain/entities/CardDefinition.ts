import type { CardTag } from './CardTag'

export type CardType = 'attack' | 'skill' | 'status'

export interface CardDefinition {
  title: string
  type: CardType
  cost: number
  image?: string
  cardTags?: CardTag[]
  operations?: string[]
}
