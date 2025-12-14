/*
MiasmaState.ts の責務:
- プレイヤーに付与され、ターン開始時に自傷ダメージを与える。
- プレイヤーが敵から攻撃を受けた際、攻撃者に瘴気ダメージ（ヒット数×magnitude）を同期して与えるトリガー情報として機能する。
  同期ダメージ自体は Battle.handlePlayerDamageReactions で処理する。
*/
import { BadState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'

export class MiasmaState extends BadState {
  constructor(magnitude = 10) {
    super({
      id: 'state-miasma',
      name: '瘴気',
      magnitude,
      cardDefinition: {
        title: '瘴気',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const mag = this.magnitude ?? 0
    return `ターン開始時に自傷 ${mag}\n敵からの攻撃ヒットごとに攻撃者へ${mag}の瘴気ダメージ`
  }

  override onTurnStart(context: { battle: Battle; owner: Player | Enemy }): void {
    const mag = Math.max(0, Math.floor(this.magnitude ?? 0))
    if (mag <= 0) {
      return
    }
    // 自傷ダメージ。攻撃扱いではないので applySpecialDamage を使用し、リアクションを発火させない。
    context.owner.applySpecialDamage(mag, { battle: context.battle, reason: 'miasma' })
  }

  override stackWith(state: MiasmaState): void {
    if (state.id !== this.id) {
      super.stackWith(state)
      return
    }
    // マグニチュードは加算
    const incoming = Math.max(0, state.magnitude ?? 0)
    const current = Math.max(0, this.magnitude ?? 0)
    this.setMagnitude(current + incoming)
  }
}
