import { Skill } from '../Action'

export class BattleDanceAction extends Skill {
  constructor() {
    super({
      name: '戦いの舞い',
      cardDefinition: {
        title: '戦いの舞い',
        type: 'skill',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '自身に加速(1)を付与する'
  }
}
