import { Enemy } from '../Enemy'
import { CaringAllyTrait } from '../states/CaringAllyTrait'
import { LightweightState } from '../states/LightweightState'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { CheerAction } from '../actions/CheerAction'

/*
ハイオークトレーナー:
- HP 60
- Trait: 仲間想い
- 初期State: 軽量化
- 技: 突き刺す(15x2), 応援
*/
export function createHighOrcTrainer(): Enemy {
  return new Enemy({
    name: 'ハイオークトレーナー',
    maxHp: 60,
    currentHp: 60,
    actions: [
      new FlurryAction().cloneWithDamages(
        new Damages({
          baseAmount: 10,
          baseCount: 2,
          type: 'multi',
          cardId: 'flurry',
        }),
      ),
      new CheerAction(),
    ],
    allyBuffWeights: { tailwind: 100, cheer: 100 },    
    states: [new CaringAllyTrait(), new LightweightState()],
    image: '/assets/enemies/orc-dancer.jpg',
  })
}
