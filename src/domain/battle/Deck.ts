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

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = this.cards[i]!
      this.cards[i] = this.cards[j]!
      this.cards[j] = temp
    }
  }

  draw(count: number, target: Hand): void {
    for (let i = 0; i < count; i += 1) {
      this.drawOne(target)
    }
  }

  drawOne(target: Hand): Card | undefined {
    const card = this.cards.shift()
    if (card) {
      if (!target.add(card)) {
        this.cards.unshift(card)
        return undefined
      }
    }
    return card
  }
  addToTop(card: Card): void {
    this.cards.unshift(card)
  }

  addToBottom(card: Card): void {
    this.cards.push(card)
  }

  remove(cardId: number): void {
    const index = this.cards.findIndex((card) => card.id === cardId)
    if (index >= 0) {
      this.cards.splice(index, 1)
    }
  }

  size(): number {
    return this.cards.length
  }

  isEmpty(): boolean {
    return this.cards.length === 0
  }

  addManyToBottom(cards: Card[]): void {
    this.cards.push(...cards)
  }
}
