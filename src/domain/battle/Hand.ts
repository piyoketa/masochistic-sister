import type { Card } from '../entities/Card'
import type { Action } from '../entities/Action'
import type { State } from '../entities/State'

type ActionConstructor<T extends Action = Action> = abstract new (...args: any[]) => T
type StateConstructor<T extends State = State> = abstract new (...args: any[]) => T

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
