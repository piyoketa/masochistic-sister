import type { Action } from '../../Action'

export abstract class EnemyActionQueue {
  protected actions: Action[] = []
  protected pending: Action[] = []
  protected rng: () => number = Math.random

  initialize(actions: Action[], rng: () => number): void {
    this.actions = [...actions]
    this.rng = rng
    this.pending = []
    this.onInitialize()
  }

  protected onInitialize(): void {
    this.populate()
  }

  next(): Action | undefined {
    this.populate()
    const action = this.pending.shift()
    if (!action) {
      return undefined
    }
    this.onActionDequeued(action)
    this.populate()
    return action
  }

  prepend(action: Action): void {
    this.pending.unshift(action)
  }

  append(action: Action): void {
    this.pending.push(action)
  }

  discardNext(): Action | undefined {
    this.populate()
    const action = this.pending.shift()
    if (!action) {
      return undefined
    }
    this.onActionDiscarded(action)
    this.populate()
    return action
  }

  peek(): Action[] {
    this.populate()
    return [...this.pending]
  }

  resetTurn(): void {}

  protected onActionDequeued(_action: Action): void {}

  protected onActionDiscarded(_action: Action): void {}

  protected abstract populate(): void
}
