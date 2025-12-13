import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { SummonAllyAction } from '../actions/SummonAllyAction'
import { LargeState } from '../states/LargeState'
import { TeamBondState } from '../states/TeamBondState'
import { Damages } from '../Damages'
import type { Battle } from '../../battle/Battle'

/**
 * 大王なめくじ: 召喚優先、上限時は連撃を行うエリート。
 */
export class GiantSlugKingEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({
        baseAmount: 10,
        baseCount: 4,
        type: 'multi',
        cardId: 'flurry',
      }),
    )
    super({
      name: '大王なめくじ',
      maxHp: 200,
      currentHp: 200,
      actions: [new SummonAllyAction(), flurry],
      states: [new LargeState()],
      image: '/assets/enemies/slug-king.jpg',
      actionQueueFactory: undefined,
      ...overrides,
    })
  }
}
