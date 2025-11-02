import { Skill } from '../Action'
import { StrengthState } from '../states/StrengthState'

export class BuildUpAction extends Skill {
  constructor() {
    super({
      name: 'ビルドアップ',
      cardDefinition: {
        title: 'ビルドアップ',
        type: 'skill',
        cost: 1,
      },
      gainStates: [() => new StrengthState(10)],
    })
  }

  protected override description(): string {
    return '自身に筋力上昇を付与する'
  }
}
