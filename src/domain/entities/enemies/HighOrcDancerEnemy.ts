import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { TailwindAction } from '../actions/TailwindAction'
import { TeamBondState } from '../states/TeamBondState'
import { Damages } from '../Damages'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type HighOrcDancerEnemyOptions = EnemyLevelOption

/**
 * ハイオークダンサー: 連撃と追い風で味方を支援する役割。チームの絆 Trait を持つ。
 */
export class HighOrcDancerEnemy extends Enemy {
  constructor(options?: HighOrcDancerEnemyOptions) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({
        baseAmount: 10,
        baseCount: 2,
        type: 'multi',
        cardId: 'flurry',
      }),
    )
    const baseProps = {
      name: 'ハイオークダンサー',
      maxHp: 60,
      currentHp: 60,
      actions: [flurry, new TailwindAction()],
      states: [new TeamBondState()],
      image: '/assets/enemies/orc-dancer.jpg',
      allyBuffWeights: { tailwind: 20, cheer: 100 },
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
