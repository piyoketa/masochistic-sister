/*
責務: 単体ビーム攻撃（1回攻撃）を定義するスキル/カード用Action。与ダメージ量のみ可変にし、敵AIでの再利用を容易にする。
非責務: バフ・デバフ付与や状態異常の計算は行わない。記憶生成などのバトル進行管理も担当しない。
主なインターフェース: Battle経由で実行される際、Attack基底のperformに委譲し、cardDefinitionを通じてUIへタイトル/コスト/ターゲット情報を提供する。ダメージ型はsingle固定。
*/
import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'

export class BeamShotAction extends Attack {
  constructor(baseAmount: number) {
    super({
      name: 'ビーム',
      baseDamage: new Damages({ baseAmount, baseCount: 1, type: 'single', cardId: 'beam-shot' }),
      effectType: 'beam',
      cardDefinition: {
        title: 'ビーム',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return 'ビームで攻撃する'
  }
}
