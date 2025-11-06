/*
BatEnemy.ts の責務:
- コウモリ敵キャラクターの初期パラメータ（HP・行動候補・タグ）を定義し、バトル開始時に一貫した挙動を提供する。
- 吸血攻撃（BloodSuckAction）を行動一覧へ設定し、EnemyTeam/AI から参照可能にする。

責務ではないこと:
- 吸血攻撃自体のダメージ計算やドレイン処理（`BloodSuckAction` 側が担当）。
- 行動順管理やターゲット決定ロジック（`EnemyActionQueue` や `EnemyTeam` が担当）。

主要な連携相手とインターフェース:
- `BloodSuckAction`: 行動リストに登録し、単発ドレイン攻撃を提供する。
- `EnemyTeam`: 本 Enemy インスタンスをメンバーとして保持し、ターン開始時処理・行動呼び出しを行う。
- `EnemyRepository`: 生成時に登録され、ID 付与を受け取る。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { BloodSuckAction } from '../actions/BloodSuckAction'

export class BatEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: 'コウモリ',
      maxHp: 30,
      currentHp: 30,
      actions: [new BloodSuckAction()],
      image: '/assets/enemies/bat.jpg',
      ...overrides,
    })
  }
}
