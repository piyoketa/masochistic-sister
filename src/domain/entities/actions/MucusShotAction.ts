import { Attack } from '../Action'
import { Damages } from '../Damages'

export class MucusShotAction extends Attack {
  constructor() {
    super({
      name: '粘液飛ばし',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      cardDefinition: {
        title: '粘液飛ばし',
        type: 'attack',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '対象にねばねば(1)を付与する'
  }
}
