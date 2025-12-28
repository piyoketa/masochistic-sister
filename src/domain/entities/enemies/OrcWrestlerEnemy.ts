import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { JointLockAction } from '../actions/JointLockAction'
import { HardShellState } from '../states/HardShellState'
import { Damages } from '../Damages'
import { buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type OrcWrestlerEnemyOptions = EnemyLevelOption

export class OrcWrestlerEnemy extends Enemy {
  constructor(options?: OrcWrestlerEnemyOptions) {
    const baseProps = {
      name: '盾持ちオーク',
      maxHp: 40,
      currentHp: 40,
      actions: [new TackleAction(), new JointLockAction()],
      states: [new HardShellState(10)],
      image: '/assets/enemies/orc_sheild.png',
    }
    const levelConfigs = [
      {
        level: 2,
        apply: (props: EnemyProps) => ({
          ...props,
          states: [new HardShellState(15)],
        }),
      },
      {
        level: 3,
        apply: (props: EnemyProps) => ({
          ...props,
          actions: [
            new TackleAction(),
            new JointLockAction().cloneWithDamages(
              new Damages({ baseAmount: 20, baseCount: 1, type: 'single', cardId: 'joint-lock' }),
            ),
          ],
        }),
      },
    ]

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
