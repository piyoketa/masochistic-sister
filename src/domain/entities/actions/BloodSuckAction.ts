/*
BloodSuckAction.ts の責務:
- 口づけ攻撃カードの共通挙動（10ダメージ＋ドレイン付与）を定義し、敵味方を問わず同一ロジックで利用できるようにする。
- 攻撃のダメージプロファイルと `DrainCardTag` を設定して、`Attack` 基底クラスによるドレイン処理を有効化する。

責務ではないこと:
- 実際のHP回復処理の適用タイミング管理（`Attack` 側が `cardTags` を参照して実行する）。
- 敵固有AIやターン順制御など、カード以外の行動ロジック。

主要な通信相手とインターフェース:
- `Attack`: ダメージ計算・ヒット解決のフレームワークを継承し、必要なプロファイルやタグを提供する。
- `Damages`: 単発10ダメージの情報を渡し、演出用 `DamageOutcome` を生成させる。
- `CardDefinition`: カード表示用のメタ情報（タイトル、タグ、コストなど）を組み立て、UI層へ提供する。
*/
import { Attack } from '../Action'
import { Damages } from '../Damages'
import {
  DrainCardTag,
  EnemySingleTargetCardTag,
  OralTechniqueCardTag,
  SingleAttackCardTag,
} from '../cardTags'

export class BloodSuckAction extends Attack {
  static readonly cardId = 'blood-suck'
  constructor() {
    super({
      name: '口づけ',
      baseDamage: new Damages({ baseAmount: 10, baseCount: 1, type: 'single', cardId: 'blood-suck' }),
      effectType: 'kiss',
      cardDefinition: {
        title: '口づけ',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
        categoryTags: [new OralTechniqueCardTag()],
        effectTags: [new DrainCardTag()],
      },
      cutInCue: {
        src: '/assets/cut_ins/kiss.png',
        waitMs: 800,
        durationMs: 800,
      },   
    })
  }

  protected override description(): string {
    return '10ダメージを与え、与えたダメージ分だけ体力を回復する'
  }
}
