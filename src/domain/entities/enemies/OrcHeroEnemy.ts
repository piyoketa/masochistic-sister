import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { LargeState } from '../states/LargeState'
import { FuryAwakeningState } from '../states/FuryAwakeningState'
import { BuildUpAction } from '../actions/BuildUpAction'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type OrcHeroEnemyOptions = EnemyLevelOption

export class OrcHeroEnemy extends Enemy {
  constructor(options?: OrcHeroEnemyOptions) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )

    const baseProps = {
      name: 'オークヒーロー',
      maxHp: 150,
      currentHp: 150,
      actions: [flurry, new BuildUpAction()],
      states: [new LargeState(), new FuryAwakeningState()],
      image: '/assets/enemies/orc-hero.png',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 100 },
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp, 20)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
