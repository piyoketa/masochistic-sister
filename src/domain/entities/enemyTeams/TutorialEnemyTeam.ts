import { EnemyTeam } from '../EnemyTeam'
import { OrcEnemy } from '../enemies/OrcEnemy'
import { SlugEnemy } from '../enemies/SlugEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { FlurryAction } from '../actions/FlurryAction'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { TackleAction } from '../actions/TackleAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'
import { Damages } from '../Damages'
import { BuildUpAction } from '../actions/BuildUpAction'

/**
 * チュートリアル用の固定敵チーム。
 * - オーク: 初手フルーリー(10×2)を確定。
 * - なめくじ: HP30 / 初手殴打(20)。
 * - かたつむり: 初手「溶かす」(AcidSpit)。
 */
export class TutorialEnemyTeam extends EnemyTeam {
  constructor() {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )
    const orc = new OrcEnemy({
      actions: [flurry, new TackleAction(), new BuildUpAction()],
      actionQueueFactory: () => new DefaultEnemyActionQueue({ initialActionType: FlurryAction }),
    })

    const slug = new SlugEnemy({
      maxHp: 30,
      currentHp: 30,
      actionQueueFactory: () => new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
    })

    const snail = new SnailEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue({ initialActionType: AcidSpitAction }),
    })

    super({
      id: 'enemy-team-tutorial',
      name: 'チュートリアル',
      members: [orc, slug, snail],
    })
  }
}
