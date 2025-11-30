/*
責務: 自身に溜め(ChargeState)を付与し、次の攻撃ダメージを増幅するスキルAction。敵AIが自己強化に使う前提。
非責務: 直接ダメージを与えない。行動順管理や記憶生成などのバトル全体制御は担当しない。
主なインターフェース: gainStatesでChargeStateを付与し、cardDefinitionでスキル種別・自身対象を明示してUIに提供する。
*/
import { Skill } from '../Action/Skill'
import { ChargeState } from '../states/ChargeState'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'

export class PowerChargeAction extends Skill {
  constructor(magnitude: number) {
    super({
      name: 'パワーチャージ',
      cardDefinition: {
        title: 'パワーチャージ',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
      gainStates: [() => new ChargeState(magnitude)],
    })
  }

  protected override description(): string {
    return ''
  }
}
