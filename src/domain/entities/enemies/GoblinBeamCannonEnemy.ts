import { Enemy } from '../Enemy'
import { BeamShotAction } from '../actions/BeamShotAction'
import { PowerChargeAction } from '../actions/PowerChargeAction'
import { LargeState } from '../states/LargeState'
import { FiveLegsState } from '../states/FiveLegsState'
import { StunCountState } from '../states/StunCountState'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type GoblinBeamCannonEnemyOptions = EnemyLevelOption

/**
 * ゴブリン ビーム砲部隊: 天の鎖無効かつ5本脚でスタン耐性を持つタンク兼高火力砲。
 */
export class GoblinBeamCannonEnemy extends Enemy {
  constructor(options?: GoblinBeamCannonEnemyOptions) {
    const baseProps = {
      name: 'ビーム砲',
      maxHp: 300,
      currentHp: 300,
      actions: [new BeamShotAction(20), new PowerChargeAction(80)],
      states: [new LargeState(), new FiveLegsState(), new StunCountState(5)],
      image: '/assets/enemies/big-canon.png',
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
