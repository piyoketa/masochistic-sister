import { Enemy, type EnemyProps } from '../Enemy'
import { BeamShotAction } from '../actions/BeamShotAction'
import { PowerChargeAction } from '../actions/PowerChargeAction'
import { LargeState } from '../states/LargeState'
import { FiveLegsState } from '../states/FiveLegsState'
import { StunCountState } from '../states/StunCountState'

/**
 * ゴブリン ビーム砲部隊: 大型かつ5本脚でスタン耐性を持つタンク兼高火力砲。
 */
export class GoblinBeamCannonEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: 'ゴブリン ビーム砲部隊',
      maxHp: 150,
      currentHp: 150,
      actions: [new BeamShotAction(20), new PowerChargeAction(80)],
      states: [new LargeState(), new FiveLegsState(), new StunCountState(5)],
      image: '/assets/enemies/orc-lancer.jpg',
      ...overrides,
    })
  }
}
