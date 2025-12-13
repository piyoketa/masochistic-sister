import type { Action } from '../../Action'

export interface EnemyActionQueueStateSnapshot {
  actions: Action[]
  turnActions: Array<{ turn: number; action: Action }>
  metadata?: Record<string, unknown>
  seed?: number | string
}

export abstract class EnemyActionQueue {
  protected actions: Action[] = []
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
    this.turnActions = []
    this.onInitialize()
  }

  protected onInitialize(): void {
    this.ensureActionForTurn(1)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setContext(_context: Record<string, unknown>): void {
    this.context = _context
  }

  /**
   * 現在ターンの行動を破棄する。ターンが分からない場合は最も若いターンを削除する。
   */
  discardTurn(turn?: number): Action | undefined {
    if (this.turnActions.length === 0) {
      return undefined
    }
    const targetIndex =
      turn !== undefined
        ? this.turnActions.findIndex((entry) => entry.turn === turn)
        : 0
    const index = targetIndex >= 0 ? targetIndex : 0
    const removed = this.turnActions.splice(index, 1)[0]
    if (removed) {
      this.onActionDiscarded(removed.action)
    }
    return removed?.action
  }

  peek(): Action[] {
    return this.turnActions
      .slice()
      .sort((a, b) => a.turn - b.turn)
      .map((entry) => entry.action)
  }

  resetTurn(): void {}

  protected onActionDiscarded(_action: Action): void {}

  serializeState(): EnemyActionQueueStateSnapshot {
    return {
      actions: [...this.actions],
      turnActions: [...this.turnActions],
      seed: this.seed,
      metadata: {
        turnActions: [...this.turnActions],
      },
    }
  }

  restoreState(snapshot: EnemyActionQueueStateSnapshot): void {
    this.seed = snapshot.seed
    this.rng = snapshot.seed !== undefined ? createMulberry32(snapshot.seed) : this.rng
    this.actions = [...snapshot.actions]
    const meta = snapshot.metadata ?? {}
    const turnEntries =
      Array.isArray(snapshot.turnActions) && snapshot.turnActions.length > 0
        ? snapshot.turnActions
        : Array.isArray((meta as any).turnActions)
          ? ((meta as any).turnActions as Array<{ turn: number; action: Action }>)
          : []
    this.turnActions = turnEntries.map((entry) => ({
      turn: entry.turn,
      action: entry.action,
    }))
  }

  /**
   * 指定ターンの行動を「既存ならそのまま返し、無ければ生成して登録」する。
   */
  ensureActionForTurn(turn: number): Action | null {
    const found = this.turnActions.find((entry) => entry.turn === turn)
    if (found) {
      return found.action
    }
    const action = this.pickActionForTurn(turn)
    if (!action) {
      return null
    }
    this.assignActionForTurn(turn, action, { replace: false })
    return action
  }

  /**
   * 外部から明示的にターン指定で行動をセットする。
   */
  setActionForTurn(turn: number, action: Action, options?: { replace?: boolean }): void {
    this.assignActionForTurn(turn, action, options)
  }

  /**
   * 次の未確定ターンに行動を予約する（ターン番号を返す）。
   */
  scheduleActionForNextTurn(action: Action, options?: { replace?: boolean }): number {
    const turn = this.nextUnscheduledTurn()
    this.assignActionForTurn(turn, action, options)
    return turn
  }

  /**
   * 予定済みの行動をすべて取り消す。
   */
  clearScheduledActions(): void {
    this.turnActions.length = 0
  }

  protected abstract pickActionForTurn(turn: number): Action | undefined

  protected assignActionForTurn(turn: number, action: Action, options?: { replace?: boolean }): void {
    const idx = this.turnActions.findIndex((entry) => entry.turn === turn)
    if (idx >= 0) {
      if (options?.replace !== false) {
        this.turnActions[idx] = { turn, action }
      }
      return
    }
    this.turnActions.push({ turn, action })
    this.turnActions.sort((a, b) => a.turn - b.turn)
  }

  protected nextUnscheduledTurn(): number {
    const lastTurn = this.turnActions.reduce((max, entry) => Math.max(max, entry.turn), 0)
    return lastTurn + 1
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
