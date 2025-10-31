import { Skill } from '../Action'

export class BattlePrepAction extends Skill {
  constructor() {
    super({
      name: '戦いの準備',
      description: '次のターン、マナ+1',
      cardDefinition: {
        title: '戦いの準備',
        type: 'skill',
        cost: 1,
        description: '次のターン、マナ+1',
      },
    })
  }
}
