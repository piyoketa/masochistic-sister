import type { Card } from '../entities/Card'

export class ExilePile {
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
