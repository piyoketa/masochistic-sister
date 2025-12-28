import { Enemy } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'
import { HardShellState } from '../states/HardShellState'
import { StatusImmunityTrait } from '../states/StatusImmunityTrait'
import { buildEnemyPropsWithLevel, type EnemyLevelConfig, type EnemyLevelOption } from './levelUtils'

export type SnailEnemyOptions = EnemyLevelOption

export class SnailEnemy extends Enemy {
  constructor(options?: SnailEnemyOptions) {
    const baseProps = {
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [new TackleAction(), new AcidSpitAction()],
      states: [new HardShellState(), new StatusImmunityTrait()],
      image: '/assets/enemies/snail.png',
    }

    const levelConfigs: EnemyLevelConfig[] = [
      {
        level: 2,
        apply: (props) => ({
          ...props,
          maxHp: 20,
          currentHp: 20,
        }),
      },
      {
        level: 3,
        apply: (props) => ({
          ...props,
          states: [new HardShellState(25), new StatusImmunityTrait()],
        }),
      },
    ]

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
