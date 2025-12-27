/*
IronBloomEnemy.ts の責務:
- シナリオ2のボス役「鉄花」の初期ステータスと行動パターン（体液をかける→突き刺す）を提供する。
- バリア回復によるバリア循環を trait として付与し、毎ターン開始時にガードを再生成できるようにする。

責務ではないこと:
- バリア処理の実行順やダメージ軽減ロジック（State/Attack側の共通処理が担当）。
- 行動後の状態管理（Enemy 基底クラスが担う）。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { MucusShotAction } from '../actions/MucusShotAction'
import { FlurryAction } from '../actions/FlurryAction'
import { GuardianPetalState } from '../states/GuardianPetalState'

export class IronBloomEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: '鉄花',
      maxHp: 10,
      currentHp: 10,
      actions: [new MucusShotAction(), new FlurryAction()],
      states: [new GuardianPetalState(3)],
      image: '/assets/enemies/iron-bloom.png',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 30 },
      ...overrides,
    })
  }
}
