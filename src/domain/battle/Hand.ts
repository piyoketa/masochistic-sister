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

  remove(card: Card): void {
    const index = this.cards.indexOf(card)
    if (index >= 0) {
      this.cards.splice(index, 1)
    }
  }

  find(cardId: number): Card | undefined {
    return this.cards.find((card) => card.numericId === cardId)
  }

  clear(): void {
    this.cards.length = 0
  }
}
