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
    return '粘液を浴びせ、対象に粘着ダメージを与える'
  }
}
