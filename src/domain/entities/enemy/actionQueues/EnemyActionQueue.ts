import type { Action } from '../../Action'

export interface EnemyActionQueueStateSnapshot {
  pending: Action[]
  actions: Action[]
  metadata?: Record<string, unknown>
  seed?: number | string
}

export abstract class EnemyActionQueue {
  protected actions: Action[] = []
  protected pending: Action[] = []
  protected displayPlan: Action[] = []
  protected turnActions: Array<{ turn: number; action: Action }> = []
  protected rng: () => number = Math.random
  protected seed: number | string | undefined
  // バトル・所有者コンテキスト（条件付きキューなどで使用）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected context: Record<string, any> | undefined

  initialize(actions: Action[], rng: () => number, seed?: number | string): void {
    this.actions = [...actions]
    this.seed = seed
    this.rng = seed !== undefined ? createMulberry32(seed) : rng
    this.pending = []
    this.displayPlan = []
    this.turnActions = []
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setContext(_context: Record<string, unknown>): void {
    this.context = _context
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
      seed: this.seed,
      metadata: {
        turnActions: [...this.turnActions],
      },
    }
  }

  restoreState(snapshot: EnemyActionQueueStateSnapshot): void {
    this.seed = snapshot.seed
    this.rng = snapshot.seed !== undefined ? createMulberry32(snapshot.seed) : this.rng
    this.pending = [...snapshot.pending]
    this.actions = [...snapshot.actions]
    const meta = snapshot.metadata ?? {}
    this.turnActions = Array.isArray((meta as any).turnActions)
      ? ((meta as any).turnActions as Array<{ turn: number; action: Action }>).map((entry) => ({
          turn: entry.turn,
          action: entry.action,
        }))
      : []
    this.snapshotDisplayPlan()
  }

  /**
   * 既決定の行動をターン番号で取得する。
   * 将来的に1ターン複数行動に拡張する場合は配列で返すAPIに拡張する。
   */
  getActionForTurn(turn: number): Action | null {
    const found = this.turnActions.find((entry) => entry.turn === turn)
    return found ? found.action : null
  }

  /**
   * 現在のpendingから次のターン分を決定し、turnActionsに追加する。
   * 派生クラスはpopulate()でpendingを埋める実装を維持しつつ、外から呼ばれることで確定させる想定。
   */
  confirmActionForTurn(turn: number): Action | null {
    this.populate()
    const action = this.pending[0]
    if (!action) {
      return null
    }
    // 既に同ターンが登録済みなら上書きしない
    const exists = this.turnActions.some((entry) => entry.turn === turn)
    if (!exists) {
      this.turnActions.push({ turn, action })
    }
    this.snapshotDisplayPlan()
    return action
  }
}

function createMulberry32(seed: number | string): () => number {
  let t = typeof seed === 'number' ? seed : hashString(seed)
  return function () {
    t += 0x6d2b79f5
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h >>> 0) || 1
}
