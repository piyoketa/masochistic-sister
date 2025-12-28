import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { DarkBlessingAction } from '../actions/DarkBlessingAction'
import { DrunkenBreathAction } from '../actions/DrunkenBreathAction'
import { CaringAllyTrait } from '../states/CaringAllyTrait'
import { BarrierState } from '../states/BarrierState'
import { LeastUsedActionQueue } from '../enemy/actionQueues/LeastUsedActionQueue'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

/*
オーク呪術師:
- HP40、仲間想い Trait、初期にバリア5を所持。
- 行動: 闇の加護 / 酒の息 / 突き刺す(5x3) を LeastUsedActionQueue でローテーション。
*/
export function createOrcShamanEnemy(options?: EnemyLevelOption): Enemy {
  const flurry = new FlurryAction().cloneWithDamages(
    new Damages({
      baseAmount: 5,
      baseCount: 3,
      type: 'multi',
      cardId: 'flurry',
    }),
  )

  const baseProps = {
    name: 'オーク呪術師',
    maxHp: 40,
    currentHp: 40,
    actions: [new DarkBlessingAction(), new DrunkenBreathAction(), flurry],
    states: [new CaringAllyTrait(), new BarrierState(5)],
    image: '/assets/enemies/orc.jpg',
    actionQueueFactory: () => new LeastUsedActionQueue(),
  }
  const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

  return new Enemy(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
}
