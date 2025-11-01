import { Skill } from '../Action'

export class BattlePrepAction extends Skill {
  constructor() {
    super({
      name: '戦いの準備',
      cardDefinition: {
        title: '戦いの準備',
        type: 'skill',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '次のターンに獲得するマナを+1する'
  }
}
