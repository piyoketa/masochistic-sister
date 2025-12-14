import type { Action } from '../../Action/ActionBase'
import { EnemyActionQueue, type EnemyActionQueueStateSnapshot } from './EnemyActionQueue'
import { BuildUpAction } from '../../actions/BuildUpAction'
import { ShapeUpAction } from '../../actions/ShapeUpAction'

/**
 * オークトレーナー専用の行動キュー:
 * - Flurry と ShapeUp を交互に実行。
 * - ShapeUp が選ばれ、プレイヤーが「軽量化」を既に持っている場合は BuildUp に差し替える。
 *   （BuildUp は初期候補に含めず、差し替え専用）
 */
export class ConditionalOrcTrainerQueue extends EnemyActionQueue {
  private readonly buildUp: BuildUpAction
  private lastIndex: number | undefined

  constructor() {
    super()
    this.buildUp = new BuildUpAction()
  }

  protected override onInitialize(): void {
    this.lastIndex = undefined
    super.onInitialize()
  }

  protected override pickActionForTurn(_turn: number): Action | undefined {
    const candidates = this.actions.filter((action) => !(action instanceof BuildUpAction))
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
    if (picked instanceof ShapeUpAction && this.shouldSwapToBuildUp()) {
      return this.actions.find((action) => action instanceof BuildUpAction) ?? this.buildUp
    }
    return picked
  }

  private getContext():
    | {
        battle?: import('../../../battle/Battle').Battle
      }
    | undefined {
    return (this as unknown as { context?: { battle?: import('../../../battle/Battle').Battle } })
      .context
  }

  private shouldSwapToBuildUp(): boolean {
    const battle = this.getContext()?.battle
    if (!battle) {
      return false
    }
    const playerStates = battle.player.getStates(battle)
    return playerStates.some((state) => state.id === 'state-lightweight')
  }
}
