import type { Action } from '../../Action'
import { EnemyActionQueue, type EnemyActionQueueStateSnapshot } from './EnemyActionQueue'

export interface DefaultEnemyActionQueueOptions {
  initialActionType?: abstract new (...args: any[]) => Action
  initialActionPredicate?: (action: Action) => boolean
}

export class DefaultEnemyActionQueue extends EnemyActionQueue {
  private lastIndex: number | undefined
  private readonly initialActionType?: abstract new (...args: any[]) => Action
  private readonly initialActionPredicate?: (action: Action) => boolean

  constructor(options?: DefaultEnemyActionQueueOptions) {
    super()
    this.initialActionType = options?.initialActionType
    this.initialActionPredicate = options?.initialActionPredicate
  }

  protected override onInitialize(): void {
    this.lastIndex = undefined
    super.onInitialize()
  }

  protected populate(): void {
    while (this.pending.length === 0) {
      const next = this.pickNextAction()
      if (!next) {
        break
      }
      this.pending.push(next)
    }
  }

  protected override onActionDequeued(action: Action): void {
    const baseIndex = this.actions.indexOf(action)
    if (baseIndex !== -1) {
      this.lastIndex = baseIndex
    }
  }

  protected override onActionDiscarded(_action: Action): void {
    // discard should not affect lastIndex so that postponed actions execute next
  }

  private pickNextAction(): Action | undefined {
    const count = this.actions.length
    if (count === 0) {
      return undefined
    }

    if (this.lastIndex === undefined) {
      const predicate =
        this.initialActionPredicate ??
        (this.initialActionType
          ? ((action: Action) => action instanceof this.initialActionType!)
          : undefined)

      if (predicate) {
        const matchIndex = this.actions.findIndex((action) => predicate(action))
        if (matchIndex !== -1) {
          this.lastIndex = matchIndex
          return this.actions[matchIndex]
        }
      }
      if (count === 1) {
        this.lastIndex = 0
        return this.actions[0]
      }
      const index = Math.floor(this.rng() * count) % count
      this.lastIndex = index
      return this.actions[index]
    }

    if (count === 1) {
      this.lastIndex = 0
      return this.actions[0]
    }

    const nextIndex = (this.lastIndex + 1) % count
    this.lastIndex = nextIndex
    return this.actions[nextIndex]
  }

  override serializeState(): EnemyActionQueueStateSnapshot {
    return {
      ...super.serializeState(),
      metadata: {
        lastIndex: this.lastIndex,
      },
    }
  }

  override restoreState(snapshot: EnemyActionQueueStateSnapshot): void {
    super.restoreState(snapshot)
    const meta = snapshot.metadata ?? {}
    this.lastIndex = typeof meta.lastIndex === 'number' ? meta.lastIndex : undefined
  }
}
