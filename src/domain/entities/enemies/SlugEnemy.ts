/*
SlugEnemy.ts の責務:
- シナリオ2に登場する「なめくじ」のステータスと行動（殴打／溶かす）を定義し、臆病特性を付与する。
- 臆病特性による逃走挙動を有効化するため、`CowardTrait` を初期ステートとして登録する。

責務ではないこと:
- 逃走タイミングの判定（CowardTrait や EnemyTeam 側が担当）。
- 防御ステータスやバリア等の複雑な計算。本クラスは初期化に専念する。
*/
import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'
import { CowardTrait } from '../states/CowardTrait'

export class SlugEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: 'なめくじ',
      maxHp: 30,
      currentHp: 30,
      actions: [new TackleAction(), new AcidSpitAction()],
      states: [new CowardTrait()],
      image: '/assets/enemies/slug.jpg',
      ...overrides,
    })
  }
}
