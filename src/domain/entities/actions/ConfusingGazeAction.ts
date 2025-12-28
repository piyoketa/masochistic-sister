/*
責務: 対象に邪念(EvilThoughtState)を付与し、神聖タグカードのコストを増加させる敵スキルActionを提供する。
非責務: ダメージを与えない。記憶生成（攻撃扱い）を誘発しないよう攻撃カテゴリにはしない。
主なインターフェース: gainStatesで付与する状態を宣言し、cardDefinitionでスキル種別・敵単体ターゲットをUIへ伝える。
*/
import { Skill } from '../Action/Skill'
import { SkillTypeCardTag, EnemySingleTargetCardTag } from '../cardTags'
import { EvilThoughtState } from '../states/EvilThoughtState'

export class ConfusingGazeAction extends Skill {
  private readonly magnitude: number

  constructor(magnitude = 1) {
    super({
      name: '惑わす',
      cardDefinition: {
        title: '惑わす',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
        subtitle: '',
      },
      inflictStates: [() => new EvilThoughtState(magnitude)],
    })
    this.magnitude = magnitude
  }

  protected override description(): string {
    return `対象に邪念(${this.magnitude})を付与する`
  }
}
