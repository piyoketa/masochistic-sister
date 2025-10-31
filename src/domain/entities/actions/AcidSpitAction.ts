import { Action } from '../Action'

export class AcidSpitAction extends Action {
  constructor() {
    super({
      id: 'action-acid-spit',
      name: '酸を吐く',
      category: 'attack',
      baseDamage: 5,
      hitCount: 1,
      description: '腐食(1)を付与する',
      cardDefinition: {
        title: '酸を吐く',
        type: 'attack',
        cost: 1,
        description: '腐食(1)を付与する',
      },
    })
  }
}
