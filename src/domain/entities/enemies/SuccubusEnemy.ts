/*
SuccubusEnemy.ts の責務:
- 新敵「淫魔」の基本パラメータ（HP30）と行動セット（BloodSuck/ConfusingGaze）を定義し、バトルで一貫した挙動を提供する。
- 味方バフ重みや初期状態など、AI が参照するメタ情報を Enemy 基底へ受け渡す。

責務ではないこと:
- 各行動の効果計算や状態付与の詳細（`BloodSuckAction` / `ConfusingGazeAction` 側が担当）。
- 行動順やターゲット選択の決定（`EnemyActionQueue` や Battle 側に委譲）。

主要な通信相手:
- `BloodSuckAction`: ドレイン攻撃を実行するため行動リストに登録する。
- `ConfusingGazeAction`: 邪念付与デバフを提供し、コスト上昇を誘発する。
- `Enemy` 基底: HP・行動リスト・画像パスの保持と行動キュー初期化を管理する。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { BloodSuckAction } from '../actions/BloodSuckAction'
import { ConfusingGazeAction } from '../actions/ConfusingGazeAction'

export class SuccubusEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: '淫魔',
      maxHp: 30,
      currentHp: 30,
      actions: [new BloodSuckAction(), new ConfusingGazeAction()],
      image: '/assets/enemies/bat.jpg',
      ...overrides,
    })
  }
}
