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
      name: '吐きかけられた',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      effectType: 'spit',
      inflictStates: [() => new StickyState(1)],
      cardDefinition: {
        title: '吐きかけられた',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '粘液を浴びせる攻撃'
  }
}
