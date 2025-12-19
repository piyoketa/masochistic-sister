import type { Action, ActionPlanSnapshot, ActionWithPlan } from '../../Action/ActionBase'
import type { Battle } from '../../../battle/Battle'
import type { Enemy } from '../../Enemy'
import type { EnemyTeam } from '../../EnemyTeam'

export type EnemyTurnActionEntry = {
  turn: number
  action: Action
  plan?: ActionPlanSnapshot
}

export interface EnemyActionQueueStateSnapshot {
  actions: Action[]
  turnActions: EnemyTurnActionEntry[]
  metadata?: Record<string, unknown>
  seed?: number | string
}

export abstract class EnemyActionQueue {
  protected actions: Action[] = []
  protected turnActions: EnemyTurnActionEntry[] = []
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

  peekEntries(): EnemyTurnActionEntry[] {
    return this.turnActions.slice().sort((a, b) => a.turn - b.turn)
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
          ? ((meta as any).turnActions as EnemyTurnActionEntry[])
          : []
    this.turnActions = turnEntries.map((entry) => ({
      turn: entry.turn,
      action: entry.action,
      plan: entry.plan,
    }))
    // 計画情報をActionへ復元する。Action側が未対応なら何もしない。
    this.turnActions.forEach((entry) => this.restorePlanForAction(entry.action, entry.plan))
  }

  /**
   * 指定ターンの行動を置き換える（存在しなければ新規にセット）。差し替え前の行動を返す。
   */
  replaceActionForTurn(turn: number, action: Action): Action | undefined {
    const prev = this.turnActions.find((entry) => entry.turn === turn)?.action
    this.assignActionForTurn(turn, action, { replace: true })
    return prev
  }

  /**
   * 指定ターンの行動を「既存ならそのまま返し、無ければ生成して登録」する。
   */
  ensureActionForTurn(turn: number, context?: { battle?: Battle; enemy?: Enemy; team?: EnemyTeam }): Action | null {
    const found = this.turnActions.find((entry) => entry.turn === turn)
    // EnemyTeam/Enemy から渡されたコンテキストが無い場合は、setContext で与えられた値を使う。
    const effectiveContext =
      context ??
      ({
        battle: (this.context as any)?.battle,
        enemy: (this.context as any)?.enemy ?? (this.context as any)?.owner,
        team: (this.context as any)?.team,
      } satisfies { battle?: Battle; enemy?: Enemy; team?: EnemyTeam })
    if (found) {
      // 初期化時に計画をしていない場合があるので、ここで欠損していれば補完する。
      if (!found.plan) {
        const planned = this.tryPlanAction(found.action, effectiveContext)
        if (!planned.success) {
          // 計画できないなら現在の予定を破棄して再抽選へ進む
          this.discardTurn(turn)
        } else {
          this.assignActionForTurn(turn, found.action, { replace: true, plan: planned.plan })
          return found.action
        }
      } else {
        // 計画済みならそのまま返す
        return found.action
      }
    }

    // 計画失敗時に次候補へ進むため、試行回数を制限しつつループする。
    const attemptLimit = Math.max(1, this.actions.length)
    for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
      const action = this.pickActionForTurn(turn)
      if (!action) {
        return null
      }
      const planned = this.tryPlanAction(action, effectiveContext)
      if (planned.success) {
        this.assignActionForTurn(turn, action, { replace: false, plan: planned.plan })
        return action
      }
      this.onActionDiscarded(action)
    }
    return null
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

  protected assignActionForTurn(
    turn: number,
    action: Action,
    options?: { replace?: boolean; plan?: ActionPlanSnapshot },
  ): void {
    const idx = this.turnActions.findIndex((entry) => entry.turn === turn)
    if (idx >= 0) {
      if (options?.replace !== false) {
        this.turnActions[idx] = { turn, action, plan: options?.plan }
      }
      return
    }
    this.turnActions.push({ turn, action, plan: options?.plan })
    this.turnActions.sort((a, b) => a.turn - b.turn)
  }

  private tryPlanAction(
    action: Action,
    context?: { battle?: Battle; enemy?: Enemy; team?: EnemyTeam },
  ): { success: boolean; plan?: ActionPlanSnapshot } {
    const hasContext = Boolean(context?.battle && context?.enemy && context?.team)
    if (!hasContext || !this.isPlanAllyTargetSkill(action)) {
      return { success: true, plan: this.serializePlanForAction(action) }
    }

    const planned = action.planTarget({
      battle: context!.battle!,
      source: context!.enemy!,
      team: context!.team!,
    })
    if (!planned) {
      return { success: false }
    }

    return { success: true, plan: this.serializePlanForAction(action) }
  }

  private isPlanAllyTargetSkill(
    action: Action | undefined,
  ): action is Action & { planTarget: (params: { battle: Battle; source: Enemy; team: EnemyTeam }) => boolean } {
    return Boolean(action) && typeof (action as any).planTarget === 'function'
  }

  private serializePlanForAction(action: Action): ActionPlanSnapshot | undefined {
    if (!this.isActionWithPlan(action)) {
      return undefined
    }
    return action.serializePlan()
  }

  private restorePlanForAction(action: Action, plan: ActionPlanSnapshot | undefined): void {
    if (!this.isActionWithPlan(action)) {
      return
    }
    action.restorePlan(plan)
  }

  private isActionWithPlan(action: Action): action is Action & ActionWithPlan {
    return typeof (action as any)?.serializePlan === 'function' && typeof (action as any)?.restorePlan === 'function'
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
