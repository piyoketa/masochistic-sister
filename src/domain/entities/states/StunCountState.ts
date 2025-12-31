import type { Battle } from '../../battle/Battle'
import type { Action } from '../Action'
import { SkipTurnAction } from '../actions/SkipTurnAction'
import { Enemy } from '../Enemy'
import type { DamageHitContext } from '../State'
import { BuffState } from '../State'
import { FiveLegsState } from './FiveLegsState'

/**
 * スタンカウント:
 * - 被弾ごとにカウントを1減らす。
 * - カウントが0以下になると、次の行動を「足止め」に変更して自身を消去する。
 * - プレイヤーは保持しない想定なので Buff として実装。
 */
export class StunCountState extends BuffState {
  constructor(magnitude: number) {
    super({
      id: 'state-stun-count',
      name: 'スタンカウント',
      stackable: true,
      magnitude,
    })
  }

  override description(): string {
    const remain = this.magnitude ?? 0
    return `このターン中、あと<magnitude>${remain}</magnitude>回ダメージを受けるとスタンする。`
  }

  override isPostHitModifier(): boolean {
    return true
  }

  override affectsDefender(): boolean {
    return true
  }

  override onHitResolved(context: DamageHitContext): boolean {
    if (!(context.defender instanceof Enemy)) {
      // 想定外: 敵以外には付与されない
      return false
    }
    const owner = context.defender
    const current = this.magnitude ?? 0
    this.setMagnitude(current - 1)

    if ((this.magnitude ?? 0) <= 0) {
      this.applyStun(owner, context.battle)
      owner.removeState(this.id)
    }
    return false
  }

  private applyStun(owner: Enemy, battle: Battle): void {
    // スタンが成立した時点で、次回必要ヒット数を+5して硬くしていく。
    const fiveLegs = owner.states.find((state) => state instanceof FiveLegsState) as
      | FiveLegsState
      | undefined
    fiveLegs?.increaseRequirement(5)
    const message = `${owner.name}はスタンして動けない！`
    const currentTurn = battle.turnPosition.turn
    // 次行動が既に確定していても、このターンの予定を足止め用アクションに強制上書きする
    owner.replaceActionForTurn(currentTurn, new SkipTurnAction(message))
    battle.addLogEntry({
      message: `${owner.name}はスタンして行動不能になった。`,
      metadata: { enemyId: owner.id, action: 'stun-count' },
    })
  }
}
