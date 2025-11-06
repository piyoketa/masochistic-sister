/*
IronBloomEnemy.ts の責務:
- シナリオ2のボス役「鉄花」の初期ステータスと行動パターン（粘液飛ばし→乱れ突き）を提供する。
- 守りの花びらによるバリア循環を trait として付与し、毎ターン開始時にガードを再生成できるようにする。

責務ではないこと:
- バリア処理の実行順やダメージ軽減ロジック（State/Attack側の共通処理が担当）。
- 行動後の状態管理（Enemy 基底クラスが担う）。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { MucusShotAction } from '../actions/MucusShotAction'
import { FlurryAction } from '../actions/FlurryAction'
import { GuardianPetalState } from '../states/GuardianPetalState'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'

export class IronBloomEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: '鉄花',
      maxHp: 10,
      currentHp: 10,
      actions: [new MucusShotAction(), new FlurryAction()],
      states: [new GuardianPetalState(3)],
      image: '/assets/enemies/iron-bloom.jpg',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 30 },
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: MucusShotAction }),
      ...overrides,
    })
  }
}
