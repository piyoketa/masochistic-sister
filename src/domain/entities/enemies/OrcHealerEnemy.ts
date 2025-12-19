import { Enemy } from '../Enemy'
import { CureBadStateAction } from '../actions/CureBadStateAction'
import { SelfRegenerationAction } from '../actions/SelfRegenerationAction'
import { TackleAction } from '../actions/TackleAction'
import { LeastUsedActionQueue } from '../enemy/actionQueues/LeastUsedActionQueue'
import { Damages } from '../Damages'

/*
オーク治療師:
- BadStateを治す「キュア」、自己回復「自己再生」、攻撃「殴打(10)」を持つ。
- 行動選択は使用条件を満たす技のうち、戦闘中の選択回数が最も少ないものを優先し、同数ならランダム。
- HP: 80
*/
export function createOrcHealerEnemy(): Enemy {
  return new Enemy({
    name: 'オーク治療師',
    maxHp: 80,
    currentHp: 80,
    actions: [
      new CureBadStateAction(),
      new SelfRegenerationAction(),
      // 殴打の打点を10に調整したバリアントを使用
      new TackleAction().cloneWithDamages(
        new Damages({
          baseAmount: 10,
          baseCount: 1,
          type: 'single',
          cardId: 'tackle',
        }),
      ),
    ],
    image: '/assets/enemies/orc.jpg',
    actionQueueFactory: () => new LeastUsedActionQueue(),
  })
}
