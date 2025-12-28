import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { Damages } from '../Damages'
import { buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type OrcDancerEnemyOptions = EnemyLevelOption

export class OrcDancerEnemy extends Enemy {
  constructor(options?: OrcDancerEnemyOptions) {
    const OrcFlurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )

    const baseProps = {
      name: 'オークダンサー',
      maxHp: 40,
      currentHp: 40,
      actions: [OrcFlurry, new BattleDanceAction()],
      image: '/assets/enemies/orc_lancer.png',
    }
    const levelConfigs = [
      {
        level: 2,
        apply: (props: EnemyProps) => ({
          ...props,
          maxHp: 50,
          currentHp: 50,
        }),
      },
      {
        level: 3,
        apply: (props: EnemyProps) => {
          const flurryLv3 = new FlurryAction().cloneWithDamages(
            new Damages({ baseAmount: 10, baseCount: 3, type: 'multi', cardId: 'flurry' }),
          )
          return {
            ...props,
            actions: [flurryLv3, new BattleDanceAction()],
          }
        },
      },
    ]

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
