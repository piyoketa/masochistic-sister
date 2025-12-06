/*
責務: 対象に邪念(EvilThoughtState)を付与し、神聖タグカードのコストを増加させる敵スキルActionを提供する。
非責務: ダメージを与えない。記憶生成（攻撃扱い）を誘発しないよう攻撃カテゴリにはしない。
主なインターフェース: gainStatesで付与する状態を宣言し、cardDefinitionでスキル種別・敵単体ターゲットをUIへ伝える。
*/
import { Skill } from '../Action/Skill'
import { SkillTypeCardTag, EnemySingleTargetCardTag } from '../cardTags'
import { EvilThoughtState } from '../states/EvilThoughtState'

export class ConfusingGazeAction extends Skill {
  constructor() {
    super({
      name: '惑わす眼光',
      cardDefinition: {
        title: '惑わす眼光',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
        subtitle: '',
      },
      inflictStates: [() => new EvilThoughtState(1)],
    })
  }

  protected override description(): string {
    return '対象に邪念を付与する'
  }
}
