import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { SummonAllyAction } from '../actions/SummonAllyAction'
import { ConditionalEnemyActionQueue } from '../enemy/actionQueues'
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
      }),
    )
    super({
      name: '大王なめくじ',
      maxHp: 100,
      currentHp: 100,
      actions: [new SummonAllyAction(), flurry],
      states: [new LargeState()],
      image: '/assets/enemies/slug-king.jpg',
      actionQueueFactory: () =>
        new ConditionalEnemyActionQueue([
          {
            actionType: SummonAllyAction,
            condition: ({ battle }) => {
              const count = battle?.enemyTeam.members.filter(
                (enemy) => enemy.isActive() || enemy.status === 'active',
              ).length
              return (count ?? 0) < 5
            },
          },
          {
            actionType: FlurryAction,
            condition: () => true,
          },
        ]),
      ...overrides,
    })
  }
}
