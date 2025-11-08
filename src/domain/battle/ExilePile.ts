import type { Card } from '../entities/Card'

export class ExilePile {
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

  clear(): void {
    this.cards.length = 0
  }

  replace(cards: Card[]): void {
    this.cards.length = 0
    this.cards.push(...cards)
  }
}
