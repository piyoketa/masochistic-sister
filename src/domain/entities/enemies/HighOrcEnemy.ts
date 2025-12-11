/*
HighOrcEnemy.ts の責務:
- 新敵「ハイオーク」の初期パラメータ（HP60）、行動セット（乱れ突き10×2・ビルドアップ10）、初期Trait（堅固10/仲間想い）を定義し、戦闘開始時に一貫した挙動を提供する。
- 味方バフ重み（allyBuffWeights: tailwind 100）など、AIが参照するメタ情報を Enemy 基底へ受け渡す。

責務ではないこと:
- 乱れ突き/ビルドアップの効果計算や状態付与の詳細（各Action側が担当）。
- 行動順やターゲット選択ロジック（EnemyActionQueueやBattleが担当）。

主要な通信相手:
- `FlurryAction`: 乱れ突き用に `cloneWithDamages` で 10×2（type: 'multi'）へ調整して使用する。連撃カテゴリ判定は Damages.type を利用し、回数変動では判定しない。
- `BuildUpAction`: 打点上昇(10)を得る自己バフ。行動リストに登録する。
- `HardShellState` / `CaringAllyTrait`: 初期Traitとして所持。被ダメ軽減と味方撃破時の打点上昇付与を提供する。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { BuildUpAction } from '../actions/BuildUpAction'
import { Damages } from '../Damages'
import { HardShellState } from '../states/HardShellState'
import { CaringAllyTrait } from '../states/CaringAllyTrait'

export class HighOrcEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({
        baseAmount: 10,
        baseCount: 2,
        type: 'multi',
        cardId: 'flurry',
      }),
    )

    super({
      name: 'ハイオーク',
      maxHp: 60,
      currentHp: 60,
      actions: [flurry, new BuildUpAction()],
      states: [new HardShellState(10), new CaringAllyTrait()],
      allyBuffWeights: { tailwind: 100 },
      image: '/assets/enemies/orc.jpg',
      ...overrides,
    })
  }
}
