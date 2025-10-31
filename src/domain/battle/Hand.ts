import type { Card } from '../entities/Card'

export class Hand {
  private readonly cards: Card[]

  constructor(initialCards: Card[] = []) {
    this.cards = [...initialCards]
  }

  list(): Card[] {
    return [...this.cards]
  }

  add(card: Card): void {}

  addMany(cards: Card[]): void {}

  remove(cardId: string): void {}

  find(cardId: string): Card | undefined {
    return this.cards.find((card) => card.id === cardId)
  }

  clear(): void {}
}
