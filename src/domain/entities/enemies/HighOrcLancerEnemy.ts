import { Enemy, type EnemyProps } from '../Enemy'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { FlurryAction } from '../actions/FlurryAction'
import { TeamBondState } from '../states/TeamBondState'
import { Damages } from '../Damages'

/**
 * ハイオークランサー: 高耐久の突撃役。追い風バフの重み付けを上げるため allyBuffWeights を設定。
 */
export class HighOrcLancerEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      // 10×2の連続攻撃。FlurryActionのデフォルトと同値だが明示しておく。
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )
    super({
      name: 'ハイオークランサー',
      maxHp: 60,
      currentHp: 60,
      actions: [new BattleDanceAction(), flurry],
      states: [new TeamBondState()],
      image: '/assets/enemies/orc-lancer.jpg',
      allyBuffWeights: { tailwind: 50, cheer: 100 },
      ...overrides,
    })
  }
}
