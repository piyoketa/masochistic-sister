import type { Action } from '../../Action'

export interface EnemyActionQueueStateSnapshot {
  pending: Action[]
  actions: Action[]
  metadata?: Record<string, unknown>
}

export abstract class EnemyActionQueue {
  protected actions: Action[] = []
  protected pending: Action[] = []
  protected displayPlan: Action[] = []
  protected rng: () => number = Math.random

  initialize(actions: Action[], rng: () => number): void {
    this.actions = [...actions]
    this.rng = rng
    this.pending = []
    this.displayPlan = []
    this.onInitialize()
  }

  protected onInitialize(): void {
    this.populate()
    this.snapshotDisplayPlan()
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

  clearAll(): void {
    this.pending.length = 0
    this.actions.length = 0
    this.displayPlan.length = 0
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

  snapshotDisplayPlan(): void {
    this.displayPlan = [...this.pending]
  }

  getDisplayPlan(): Action[] {
    return [...this.displayPlan]
  }

  clearDisplayPlan(): void {
    this.displayPlan.length = 0
  }

  serializeState(): EnemyActionQueueStateSnapshot {
    return {
      pending: [...this.pending],
      actions: [...this.actions],
    }
  }

  restoreState(snapshot: EnemyActionQueueStateSnapshot): void {
    this.pending = [...snapshot.pending]
    this.actions = [...snapshot.actions]
    this.snapshotDisplayPlan()
  }
}
