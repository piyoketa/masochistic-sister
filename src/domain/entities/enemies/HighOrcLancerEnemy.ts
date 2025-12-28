import { Enemy } from '../Enemy'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { FlurryAction } from '../actions/FlurryAction'
import { TeamBondState } from '../states/TeamBondState'
import { Damages } from '../Damages'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type HighOrcLancerEnemyOptions = EnemyLevelOption

/**
 * ハイオークランサー: 高耐久の突撃役。追い風バフの重み付けを上げるため allyBuffWeights を設定。
 */
export class HighOrcLancerEnemy extends Enemy {
  constructor(options?: HighOrcLancerEnemyOptions) {
    const flurry = new FlurryAction().cloneWithDamages(
      // 10×2の連続攻撃。FlurryActionのデフォルトと同値だが明示しておく。
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )
    const baseProps = {
      name: 'ハイオークランサー',
      maxHp: 60,
      currentHp: 60,
      actions: [new BattleDanceAction(), flurry],
      states: [new TeamBondState()],
      image: '/assets/enemies/orc-lancer.jpg',
      allyBuffWeights: { tailwind: 50, cheer: 100 },
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
