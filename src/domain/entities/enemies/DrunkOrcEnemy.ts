import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { DrunkenBreathAction } from '../actions/DrunkenBreathAction'
import { Damages } from '../Damages'
import { buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type DrunkOrcEnemyOptions = EnemyLevelOption

/**
 * 酒飲みオーク: 突き刺すと酩酊付与スキルを持つサポート兼アタッカー。
 */
export class DrunkOrcEnemy extends Enemy {
  constructor(options?: DrunkOrcEnemyOptions) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )
    const baseProps = {
      name: '酒飲みオーク',
      maxHp: 40,
      currentHp: 40,
      actions: [flurry, new DrunkenBreathAction()],
      image: '/assets/enemies/drunk-orc.png',
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
          actions: [flurry, new DrunkenBreathAction(2)],
        }),
      },
    ]

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
