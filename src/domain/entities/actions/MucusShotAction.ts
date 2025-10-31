import { Action } from '../Action'

export class MucusShotAction extends Action {
  constructor() {
    super({
      id: 'action-mucus-shot',
      name: '粘液飛ばし',
      category: 'attack',
      baseDamage: 5,
      hitCount: 1,
      description: 'ねばねば(1)を付与する',
      cardDefinition: {
        title: '粘液飛ばし',
        type: 'attack',
        cost: 1,
        description: 'ねばねば(1)を付与する',
      },
    })
  }
}
