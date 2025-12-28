import { Enemy, type EnemyProps } from '../Enemy'
import { MucusShotAction } from '../actions/MucusShotAction'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type TentacleEnemyOptions = EnemyLevelOption

export class TentacleEnemy extends Enemy {
  constructor(options?: TentacleEnemyOptions) {
    const tentacleFlurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )

    const baseProps = {
      name: '触手',
      maxHp: 25,
      currentHp: 25,
      actions: [tentacleFlurry, new MucusShotAction()],
      image: '/assets/enemies/tentacle.png',
    }
    const levelConfigs = [
      {
        level: 2,
        apply: (props: EnemyProps) => ({
          ...props,
          maxHp: 40,
          currentHp: 40,
        }),
      },
      {
        level: 3,
        apply: (props: EnemyProps) => ({
          ...props,
          actions: [
            tentacleFlurry,
            new MucusShotAction().cloneWithDamages(
              new Damages({ baseAmount: 10, baseCount: 1, type: 'single', cardId: 'mucus-shot' }),
            ),
          ],
        }),
      },
    ]

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
