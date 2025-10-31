import { Attack } from '../Action'
import { Damages } from '../Damages'

export class MucusShotAction extends Attack {
  constructor() {
    super({
      name: '粘液飛ばし',
      baseDamages: Damages.single(5),
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
