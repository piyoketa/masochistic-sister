import type { Card } from '../entities/Card'
import type { Action } from '../entities/Action'
import type { State } from '../entities/State'

type ActionConstructor<T extends Action = Action> = abstract new (...args: any[]) => T
type StateConstructor<T extends State = State> = abstract new (...args: any[]) => T

export class Hand {
  private readonly cards: Card[]
  private readonly limit: number

  constructor(initialCards: Card[] = [], limit = 10) {
    this.cards = [...initialCards]
    this.limit = limit
  }

  list(): Card[] {
    return [...this.cards]
  }

  size(): number {
    return this.cards.length
  }

  maxSize(): number {
    return this.limit
  }

  isAtLimit(): boolean {
    return this.cards.length >= this.limit
  }

  add(card: Card): boolean {
    if (this.isAtLimit()) {
      return false
    }

    this.cards.push(card)
    return true
  }

  addMany(cards: Card[]): void {
    for (const card of cards) {
      if (!this.add(card)) {
        break
      }
    }
  }

  remove(card: Card): void {
    const index = this.cards.indexOf(card)
    if (index >= 0) {
      this.cards.splice(index, 1)
    }
  }

  removeOldest(match: (card: Card) => boolean): Card | undefined {
    const index = this.cards.findIndex((card) => match(card))
    if (index === -1) {
      return undefined
    }

    const [removed] = this.cards.splice(index, 1)
    return removed
  }

  find(cardId: number): Card | undefined {
    return this.cards.find((card) => card.id === cardId)
  }

  hasCardOf(actionOrState: ActionConstructor | StateConstructor): boolean {
    return this.cards.some((card) => {
      const action = card.action
      if (action && action instanceof actionOrState) {
        return true
      }

      const state = card.state
      return Boolean(state && state instanceof actionOrState)
    })
  }

  clear(): void {
    this.cards.length = 0
  }
}
