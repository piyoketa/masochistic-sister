import type { Card } from '../entities/Card'
import type { Hand } from './Hand'

export class Deck {
  private readonly cards: Card[]

  constructor(initialCards: Card[] = []) {
    this.cards = [...initialCards]
  }

  list(): Card[] {
    return [...this.cards]
  }

  shuffle(): void {}

  draw(count: number, target: Hand): void {}

  drawOne(target: Hand): void {}

  addToTop(card: Card): void {}

  addToBottom(card: Card): void {}

  remove(cardId: string): void {}

  size(): number {
    return this.cards.length
  }
}
