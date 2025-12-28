import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { SummonAllyAction } from '../actions/SummonAllyAction'
import { LargeState } from '../states/LargeState'
import { Damages } from '../Damages'
import type { Battle } from '../../battle/Battle'
import { ConditionalEnemyActionQueue } from '../enemy/actionQueues'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type GiantSlugKingEnemyOptions = EnemyLevelOption

/**
 * 大王なめくじ: 召喚優先、上限時は連撃を行うエリート。
 */
export class GiantSlugKingEnemy extends Enemy {
  constructor(options?: GiantSlugKingEnemyOptions) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({
        baseAmount: 10,
        baseCount: 4,
        type: 'multi',
        cardId: 'flurry',
      }),
    )
    const summon = new SummonAllyAction()
    const baseProps = {
      name: '大王なめくじ',
      maxHp: 200,
      currentHp: 200,
      actions: [summon, flurry],
      states: [new LargeState()],
      image: '/assets/enemies/slug-king.jpg',
      actionQueueFactory: () =>
        new ConditionalEnemyActionQueue(({ actions, context }) => {
          const summonAction = actions.find((action) => action instanceof SummonAllyAction) as
            | SummonAllyAction
            | undefined
          const flurryAction = actions.find((action) => action instanceof FlurryAction)
          // 召喚可能なら優先
          if (summonAction && summonAction.canPlay({ battle: context?.battle as Battle, source: context?.enemy })) {
            return summonAction
          }
          return flurryAction ?? actions[0]
        }),
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
