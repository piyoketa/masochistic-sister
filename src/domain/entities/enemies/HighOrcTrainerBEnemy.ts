import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { CheerAction } from '../actions/CheerAction'
import { TailwindAction } from '../actions/TailwindAction'
import { LightweightState } from '../states/LightweightState'
import { CaringAllyTrait } from '../states/CaringAllyTrait'
import { LeastUsedActionQueue } from '../enemy/actionQueues/LeastUsedActionQueue'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

/*
ハイオークトレーナーB:
- HP60、仲間想い Trait、初期に軽量化を付与。
- 行動: 突き刺す(15x2) / 応援 / 追い風 を LeastUsedActionQueue でローテーション。
*/
export function createHighOrcTrainerB(options?: EnemyLevelOption): Enemy {
  const flurry = new FlurryAction().cloneWithDamages(
    new Damages({
      baseAmount: 15,
      baseCount: 2,
      type: 'multi',
      cardId: 'flurry',
    }),
  )

  const baseProps = {
    name: 'ハイオークトレーナーB',
    maxHp: 60,
    currentHp: 60,
    actions: [flurry, new CheerAction(), new TailwindAction()],
    states: [new CaringAllyTrait(), new LightweightState()],
    allyBuffWeights: { tailwind: 100, cheer: 100 },    
    image: '/assets/enemies/orc-dancer.jpg',
    actionQueueFactory: () => new LeastUsedActionQueue(),
  }
  const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

  return new Enemy(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
}
