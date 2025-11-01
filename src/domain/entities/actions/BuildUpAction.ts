import { Skill, type ActionContext } from '../Action'
import { StrengthState } from '../states/StrengthState'
import { isPlayerEntity } from '../typeGuards'

export class BuildUpAction extends Skill {
  constructor() {
    super({
      name: 'ビルドアップ',
      cardDefinition: {
        title: 'ビルドアップ',
        type: 'skill',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '自身に筋力上昇を付与する'
  }

  override execute(context: ActionContext): void {
    const source = context.source
    if (isPlayerEntity(source)) {
      source.addState(new StrengthState(10), { battle: context.battle })
    } else {
      source.addState(new StrengthState(10))
    }
  }
}
