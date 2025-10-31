import { Action } from '../Action'

export class BattleDanceAction extends Action {
  constructor() {
    super({
      id: 'action-battle-dance',
      name: '戦いの舞い',
      category: 'skill',
      description: '自身に加速(1)を付与する',
      cardDefinition: {
        title: '戦いの舞い',
        type: 'skill',
        cost: 1,
        description: '自身に加速(1)を付与する',
      },
    })
  }
}
