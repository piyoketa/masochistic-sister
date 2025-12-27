/*
OrcTrainerEnemy.ts の責務:
- 新敵「オークトレーナー」の初期パラメータ（HP40/軽量化付与済み）と行動セット（Flurry 15×2、シェイプアップ）を定義する。
- 速度バフ優先度（allyBuffWeights: tailwind 100）など、AI・味方効果の重みづけを提供する。

責務ではないこと:
- 行動順の制御やターゲット選択ロジック（EnemyActionQueue や各 Action に委譲）。
- 軽量化の具体的な効果や非スタック処理（LightweightState 側が担う）。

主要な通信相手:
- `Enemy` 基底クラス: 行動キュー初期化や状態管理、ログ出力を委譲する。
- `FlurryAction`/`ShapeUpAction`: 所持アクションとしてダメージ/状態付与を実行する。Flurry は `cloneWithDamages` で 15×2 (type: 'multi') に調整。
- `LightweightState`: 初期状態として付与し、攻撃補正を持ったまま戦闘に参加する。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { ShapeUpAction } from '../actions/ShapeUpAction'
import { Damages } from '../Damages'
import { LightweightState } from '../states/LightweightState'
import { BuildUpAction } from '../actions/BuildUpAction'
import { ConditionalOrcTrainerQueue } from '../enemy/actionQueues/ConditionalOrcTrainerQueue'

export class OrcTrainerEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    // 15×2 の連続攻撃を作成。連撃カテゴリは Damages.type='multi' で明示し、回数変動で判定しない。
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({
        baseAmount: 15,
        baseCount: 2,
        type: 'multi',
        cardId: 'flurry',
      }),
    )

    super({
      name: 'オークトレーナー',
      maxHp: 40,
      currentHp: 40,
      // BuildUp は差し替え用にキューへ渡す（初期候補には含めないが、actions 配列には含めておく）
      actions: [flurry, new ShapeUpAction(), new BuildUpAction()],
      states: [new LightweightState()],
      allyBuffWeights: { tailwind: 100 },
      image: '/assets/enemies/orc-trainer.png',
      actionQueueFactory: () => new ConditionalOrcTrainerQueue(),
      ...overrides,
    })
  }
}
