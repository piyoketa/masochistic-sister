import type { Card } from '../entities/Card'

export class DiscardPile {
  private readonly cards: Card[]

  constructor(initialCards: Card[] = []) {
    this.cards = [...initialCards]
  }

  list(): Card[] {
    return [...this.cards]
  }

  add(card: Card): void {}

  addMany(cards: Card[]): void {}

  clear(): void {}
}
