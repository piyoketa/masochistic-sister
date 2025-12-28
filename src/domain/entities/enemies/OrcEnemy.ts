import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { BuildUpAction } from '../actions/BuildUpAction'
import { JointLockAction } from '../actions/JointLockAction'
import { Damages } from '../Damages'
import { buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type OrcEnemyOptions = EnemyLevelOption

export class OrcEnemy extends Enemy {
  constructor(options?: OrcEnemyOptions) {
    const baseProps = {
      name: 'オーク',
      maxHp: 40,
      currentHp: 40,
      actions: [new TackleAction(), new BuildUpAction()],
      image: '/assets/enemies/orc.png',
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
        apply: (props: EnemyProps) => ({
          ...props,
          actions: [
            new JointLockAction().cloneWithDamages(
              new Damages({ baseAmount: 20, baseCount: 1, type: 'single', cardId: 'joint-lock' }),
            ),
            new BuildUpAction(),
          ],
        }),
      },
    ]

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
