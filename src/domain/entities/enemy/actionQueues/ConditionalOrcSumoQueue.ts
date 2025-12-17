import type { Action } from '../../Action/ActionBase'
import { EnemyActionQueue, type EnemyActionQueueStateSnapshot } from './EnemyActionQueue'
import { FattenAction } from '../../actions/FattenAction'
import { BattleDanceAction } from '../../actions/BattleDanceAction'

type QueueContext = {
  battle?: import('../../../battle/Battle').Battle
}

/**
 * オーク力士専用: プレイヤーが「重量化」を持っている場合、太らせるの代わりに戦いの舞いを選択する。
 */
export class ConditionalOrcSumoQueue extends EnemyActionQueue {
  private readonly battleDance: BattleDanceAction
  private lastIndex: number | undefined

  constructor() {
    super()
    this.battleDance = new BattleDanceAction()
  }

  protected override onInitialize(): void {
    this.lastIndex = undefined
    super.onInitialize()
  }

  override setContext(context: Record<string, unknown>): void {
    super.setContext(context)
  }

  protected override pickActionForTurn(turn: number): Action | undefined {
    const candidates = this.actions.filter((action) => !(action instanceof BattleDanceAction))
    const count = candidates.length
    if (count === 0) {
      return undefined
    }

    if (this.lastIndex === undefined) {
      const index = Math.floor(this.rng() * count) % count
      this.lastIndex = index
      const action = candidates[index]
      return action ? this.applyReplacement(action) : undefined
    }

    const nextIndex = count === 1 ? 0 : (this.lastIndex + 1) % count
    this.lastIndex = nextIndex
    const action = candidates[nextIndex]
    return action ? this.applyReplacement(action) : undefined
  }

  override serializeState(): EnemyActionQueueStateSnapshot {
    return {
      ...super.serializeState(),
      metadata: {
        ...(super.serializeState().metadata ?? {}),
        lastIndex: this.lastIndex,
      },
    }
  }

  override restoreState(snapshot: EnemyActionQueueStateSnapshot): void {
    super.restoreState(snapshot)
    const meta = snapshot.metadata ?? {}
    this.lastIndex = typeof meta.lastIndex === 'number' ? meta.lastIndex : undefined
  }

  private applyReplacement(picked: Action): Action {
    if (picked instanceof FattenAction && this.shouldSwapToBattleDance()) {
      return this.actions.find((action) => action instanceof BattleDanceAction) ?? this.battleDance
    }
    return picked
  }

  private getContext(): QueueContext | undefined {
    // EnemyActionQueue で保持している context を安全に取り出すためのユーティリティ
    return (this as unknown as { context?: QueueContext }).context
  }

  private shouldSwapToBattleDance(): boolean {
    const battle = this.getContext()?.battle
    if (!battle) {
      return false
    }
    const playerStates = battle.player.getStates(battle)
    return playerStates.some((state) => state.id === 'state-heavyweight')
  }
}
