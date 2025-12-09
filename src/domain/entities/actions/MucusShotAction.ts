import { Attack, type ActionContext } from '../Action'
import { Damages } from '../Damages'
import { StickyState } from '../states/StickyState'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'
import { isPlayerEntity } from '../typeGuards'

export class MucusShotAction extends Attack {
  constructor() {
    super({
      name: '体液をかける',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single', cardId: 'mucus-shot' }),
      effectType: 'spit',
      inflictStates: [() => new StickyState(1)],
      cardDefinition: {
        title: '体液をかける',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }
}
