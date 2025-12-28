import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { FattenAction } from '../actions/FattenAction'
import { Damages } from '../Damages'
import { HeavyweightState } from '../states/HeavyweightState'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { ConditionalOrcSumoQueue } from '../enemy/actionQueues/ConditionalOrcSumoQueue'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type OrcSumoEnemyOptions = EnemyLevelOption

/**
 * オーク力士: 突き刺すと重量化付与攻撃を行うタフな近接型。
 */
export class OrcSumoEnemy extends Enemy {
  constructor(options?: OrcSumoEnemyOptions) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({
        baseAmount: 20,
        baseCount: 2,
        type: 'multi',
        cardId: 'flurry',
      }),
    )
    const baseProps = {
      name: 'オーク力士',
      maxHp: 40,
      currentHp: 40,
      actions: [flurry, new FattenAction(), new BattleDanceAction()],
      states: [new HeavyweightState()],
      // 追い風の対象になれるよう、加速向き・多段攻撃タグを付与する。
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 100 },
      image: '/assets/enemies/orc-sumo.png',
      actionQueueFactory: () => new ConditionalOrcSumoQueue(),
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
