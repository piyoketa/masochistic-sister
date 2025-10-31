import type { Card } from '../entities/Card'

export class Hand {
  private readonly cards: Card[]

  constructor(initialCards: Card[] = []) {
    this.cards = [...initialCards]
  }

  list(): Card[] {
    return [...this.cards]
  }

  add(card: Card): void {
    this.cards.push(card)
  }

  addMany(cards: Card[]): void {
    this.cards.push(...cards)
  }

  remove(cardId: string): void {
    const index = this.cards.findIndex((card) => card.id === cardId)
    if (index >= 0) {
      this.cards.splice(index, 1)
    }
  }

  find(cardId: string): Card | undefined {
    return this.cards.find((card) => card.id === cardId)
  }

  clear(): void {
    this.cards.length = 0
  }
}
