import { Skill } from '../Action'

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
}
