import { Card } from '../entities/Card'
import type { Deck } from '../battle/Deck'
import type { Hand } from '../battle/Hand'
import type { DiscardPile } from '../battle/DiscardPile'
import type { ExilePile } from '../battle/ExilePile'

export type CardFactory<T extends Card = Card> = () => T

export type CardLocation = 'deck' | 'hand' | 'discardPile' | 'exilePile' | 'unknown'

interface CardRepositoryZones {
  deck: Deck
  hand: Hand
  discardPile: DiscardPile
  exilePile: ExilePile
}

export class CardRepository {
  private readonly cards = new Map<number, Card>()
  private counter = 0
  private zones?: CardRepositoryZones

  create<T extends Card>(factory: CardFactory<T>): T {
    const id = this.generateId()
    const card = factory()
    card.assignId(id)

    this.cards.set(id, card)
    return card
  }

  register(card: Card): void {
    const id = card.id ?? this.generateId()

    if (!Number.isInteger(id) || id < 0) {
      throw new Error(`Card id must be a non-negative integer, received: ${id}`)
    }

    if (this.cards.has(id)) {
      throw new Error(`Card with id ${id} already registered`)
    }

    card.assignId(id)
    this.cards.set(id, card)
  }

  findById<T extends Card = Card>(id: number): T | undefined {
    return this.cards.get(id) as T | undefined
  }

  find<T extends Card = Card>(predicate: (card: Card) => boolean): T | undefined {
    for (const card of this.cards.values()) {
      if (predicate(card)) {
        return card as T
      }
    }

    return undefined
  }

  list(): Card[] {
    return Array.from(this.cards.values())
  }

  bindZones(zones: CardRepositoryZones): void {
    this.zones = zones
  }

  findWithLocation<T extends Card = Card>(id: number): { card: T; location: CardLocation } | undefined {
    const card = this.findById<T>(id)
    if (!card) {
      return undefined
    }

    const zones = this.zones
    if (!zones) {
      return { card, location: 'unknown' }
    }

    if (zones.hand.find(id)) {
      return { card, location: 'hand' }
    }

    if (zones.deck.list().some((candidate) => candidate.id === id)) {
      return { card, location: 'deck' }
    }

    if (zones.discardPile.list().some((candidate) => candidate.id === id)) {
      return { card, location: 'discardPile' }
    }

    if (zones.exilePile.list().some((candidate) => candidate.id === id)) {
      return { card, location: 'exilePile' }
    }

    return { card, location: 'unknown' }
  }

  remove(id: number): void {
    this.cards.delete(id)
  }

  clear(): void {
    this.cards.clear()
    this.counter = 0
  }

  private generateId(): number {
    const id = this.counter
    this.counter += 1
    return id
  }
}
