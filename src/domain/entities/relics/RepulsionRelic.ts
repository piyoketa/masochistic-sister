/**
 * RepulsionRelic の責務:
 * - 戦闘中にプレイヤーが被弾するたび、打点上昇(1)を累積させる。
 * - レリック情報（名称・説明・アイコン）を提供し、表示に用いる。
 *
 * 非責務:
 * - レリックのドロップ/獲得フローや候補選定（Field/Store 側で管理）。
 * - バトル外の状態管理（戦闘開始時にのみ有効化する）。
 *
 * 主な通信相手とインターフェース:
 * - Battle: `onHitResolved` で被弾を検知し、`onDamageSequenceResolved` でまとめて StrengthState を付与。
 * - Player: `addState` を通じて打点上昇を反映する。
 */
import { Relic } from './Relic'
import { StrengthState } from '../states/StrengthState'
import type { Battle } from '@/domain/battle/Battle'
import type { Player } from '../Player'
import type { DamageHitContext, DamageSequenceContext } from '../State'

export class RepulsionRelic extends Relic {
  readonly id = 'repulsion'
  readonly name = '反発'
  readonly usageType = 'passive' as const
  readonly icon = '💢'
  private pendingStacks = 0

  description(): string {
    return 'ダメージを受ける度、打点上昇(1)を得る'
  }

  override isActive(context?: { battle?: Battle; player?: Player }): boolean {
    // 戦闘外では非アクティブ扱い、戦闘中は常に有効
    return Boolean(context?.battle && context?.player)
  }

  override isPostHitModifier(): boolean {
    return true
  }

  override onHitResolved(context: DamageHitContext): boolean {
    if (context.role !== 'defender') {
      return false
    }
    if (context.outcome.damage <= 0) {
      return false
    }
    // ヒット単位でスタックを蓄積し、シーケンス終了時にまとめて付与する。
    this.pendingStacks += 1
    return true
  }

  override onDamageSequenceResolved(context: DamageSequenceContext): void {
    if (this.pendingStacks <= 0) {
      return
    }
    const stacks = this.pendingStacks
    this.pendingStacks = 0

    const defender = context.defender
    // プレイヤーのみを対象に打点上昇を付与する。
    if ('addState' in defender && typeof defender.addState === 'function') {
      defender.addState(new StrengthState(stacks), { battle: context.battle })
    }
  }
}
