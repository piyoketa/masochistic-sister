/*
KamaitachiEnemy.ts の責務:
- 「かまいたち」の行動セット（5×4の連撃と追い風支援）を提供し、シナリオ2専用の敵ステータスを初期化する。
- 味方支援ターゲットとして機能するためのタグ／相性値を設定し、追い風の優先度制御に寄与する。

責務ではないこと:
- 追い風実行時の対象選択ロジック（EnemyTeam側）や、ダメージ適用など汎用的なバトル処理。
- 逃走や撃破判定といった状態遷移（Enemy基底クラスが管理）。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { TailwindAction } from '../actions/TailwindAction'
import { Damages } from '../Damages'

export class KamaitachiEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const kamaitachiFlurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 5, baseCount: 4, type: 'multi', cardId: 'flurry' }),
    )

    super({
      name: 'かまいたち',
      maxHp: 30,
      currentHp: 30,
      actions: [kamaitachiFlurry, new TailwindAction()],
      image: '/assets/enemies/kamaitachi.jpg',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 20 },
      ...overrides,
    })
  }
}
