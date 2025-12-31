/*
ConditionalOrcHeroQueue.ts の責務:
- オークヒーローの行動候補をラウンドロビンで選択しつつ、次の突き刺す(Flurry)が重量化などの補正で攻撃回数0になる見込みの場合だけ戦いの舞い(BattleDance)へ差し替える。
- Battle/Enemy コンテキストから所有者の状態を参照し、実際のダメージ計算と同じプリフェーズ補正（Acceleration/Heavyweight など）で攻撃回数を試算するロジックを保持する。

責務ではないこと:
- 戦いの舞いや突き刺す自体のダメージ計算やエフェクト再生。これらは各 Action が担う。
- 重量化の付与・解除やスタック増減の管理。それらは State/Action 側が担当する。

主要な通信相手とインターフェース:
- `EnemyActionQueue`: initialize/ensureActionForTurn 経由で行動選択を委譲し、pickActionForTurn を上書きして条件差し替えを実現する。
- `OrcHeroEnemy`: actionQueueFactory から本キューを生成し、setContext で owner(battle 中のオークヒーロー)を受け取る。
- `Enemy`: コンテキストから owner を取得し、`getStates()` で `HeavyweightState`/`AccelerationState` を含むバフ・デバフを集計し、攻撃回数が0になるかどうかを事前計算する（加速がある場合は回数減少を打ち消す）。類似する State が存在しても id で厳密に判定する。
*/
import type { Action } from '../../Action/ActionBase'
import { EnemyActionQueue, type EnemyActionQueueStateSnapshot } from './EnemyActionQueue'
import { BattleDanceAction } from '../../actions/BattleDanceAction'
import { FlurryAction } from '../../actions/FlurryAction'
import type { Enemy } from '../../Enemy'

/**
 * オークヒーロー専用キュー:
 * - 戦いの舞いは通常候補から除外し、突き刺す/ビルドアップを周回させる。
 * - 突き刺すが重量化などで攻撃回数0になる見込みのときだけ戦いの舞いへ差し替える（加速で回数が残る場合は突き刺すを維持）。
 */
export class ConditionalOrcHeroQueue extends EnemyActionQueue {
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

  protected override pickActionForTurn(_turn: number): Action | undefined {
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
    const base = super.serializeState()
    return {
      ...base,
      metadata: {
        ...(base.metadata ?? {}),
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
    // 突き刺すが重量化などで0回攻撃になる見込みの場合のみ、テンポロス防止のためバフ技に差し替える。
    if (picked instanceof FlurryAction && this.shouldSwapToBattleDance(picked)) {
      return this.actions.find((action) => action instanceof BattleDanceAction) ?? this.battleDance
    }
    return picked
  }

  private getOwnerFromContext(): Enemy | undefined {
    const ctx = (this as unknown as { context?: { enemy?: Enemy; owner?: Enemy } }).context
    return ctx?.enemy ?? ctx?.owner
  }

  private shouldSwapToBattleDance(picked: FlurryAction): boolean {
    const owner = this.getOwnerFromContext()
    if (!owner) {
      return false
    }
    const predictedCount = this.predictAttackCount(picked, owner)
    return predictedCount <= 0
  }

  private predictAttackCount(action: FlurryAction, owner: Enemy): number {
    const base = action.baseDamages
    const states = owner.getStates()
    const heavyweightStacks = this.getStack(states, 'state-heavyweight')
    const accelerationStacks = this.getStack(states, 'state-acceleration')
    // 仕様: 重量化は multi の回数を減らし、加速は multi の回数を増やす。single にはどちらも影響しない。
    if (base.type !== 'multi') {
      return base.baseCount
    }
    const adjusted = base.baseCount - heavyweightStacks + accelerationStacks
    return Math.max(0, adjusted)
  }

  private getStack(states: import('../../State').State[], targetId: string): number {
    const found = states.find((state) => state.id === targetId)
    return typeof found?.magnitude === 'number' ? found.magnitude : 0
  }
}
