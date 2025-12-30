import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { FattenAction } from '../actions/FattenAction'
import { Damages } from '../Damages'
import { HeavyweightState } from '../states/HeavyweightState'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { ConditionalOrcSumoQueue } from '../enemy/actionQueues/ConditionalOrcSumoQueue'
import { AccelerationState } from '../states/AccelerationState'
import { buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

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
      maxHp: 45,
      currentHp: 45,
      actions: [flurry, new FattenAction(), new BattleDanceAction()],
      states: [new HeavyweightState()],
      // 追い風の対象になれるよう、加速向き・多段攻撃タグを付与する。
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 100 },
      image: '/assets/enemies/orc-sumo.png',
      actionQueueFactory: () => new ConditionalOrcSumoQueue(),
    }
    const levelConfigs = [
      {
        level: 2,
        apply: (props: EnemyProps) => ({
          ...props,
          maxHp: 60,
          currentHp: 60,
        }),
      },
      {
        level: 3,
        apply: (props: EnemyProps) => ({
          ...props,
          states: [...(props.states ?? []), new AccelerationState(1)],
        }),
      },
    ]

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
