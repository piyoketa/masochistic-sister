import { SingleAttack } from '../Action'

export class MucusShotAction extends SingleAttack {
  constructor() {
    super({
      name: '粘液飛ばし',
      baseDamage: 5,
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
