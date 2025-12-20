import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { DrunkenBreathAction } from '../actions/DrunkenBreathAction'
import { Damages } from '../Damages'

/**
 * 酒飲みオーク: 突き刺すと酩酊付与スキルを持つサポート兼アタッカー。
 */
export class DrunkOrcEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )
    super({
      name: '酒飲みオーク',
      maxHp: 40,
      currentHp: 40,
      actions: [flurry, new DrunkenBreathAction()],
      image: '/assets/enemies/drunk-orc.png',
      ...overrides,
    })
  }
}
