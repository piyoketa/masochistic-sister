import type { Card } from '../entities/Card'

export type CardFactory<T extends Card = Card> = () => T

export class CardRepository {
  private readonly cards = new Map<number, Card>()
  private counter = 0

  create<T extends Card>(factory: CardFactory<T>): T {
    const id = this.generateId()
    const card = factory()
    card.assignRepositoryId(id)

    this.cards.set(id, card)
    return card
  }

  register(card: Card): void {
    const id = card.numericId ?? this.generateId()

    if (!Number.isInteger(id) || id < 0) {
      throw new Error(`Card id must be a non-negative integer, received: ${id}`)
    }

    if (this.cards.has(id)) {
      throw new Error(`Card with id ${id} already registered`)
    }

    card.assignRepositoryId(id)
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
