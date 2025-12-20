/*
OrcLancerEnemy.ts の責務:
- シナリオ2で登場する「オークランサー」の初期ステータスと行動パターンを定義する。
- 加速支援スキルとの連携のため、味方タグや相性重みを設定し、`TailwindAction` の対象となれるようにする。

責務ではないこと:
- 戦闘ロジック（行動順制御やバフ適用）は Enemy / EnemyTeam が担い、本クラスは初期値の提供に限定する。
- 被ダメージ処理や行動後のリセット等、汎用的な敵挙動。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { FlurryAction } from '../actions/FlurryAction'

export class OrcLancerEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const battleDance = new BattleDanceAction()
    const flurry = new FlurryAction()

    super({
      name: 'オークランサー',
      maxHp: 40,
      currentHp: 40,
      actions: [battleDance, flurry],
      image: '/assets/enemies/orc_lancer.png',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 50 },
      ...overrides,
    })
  }
}
