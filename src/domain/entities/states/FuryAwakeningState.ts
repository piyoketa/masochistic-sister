import { State, type DamageHitContext, type DamageSequenceContext } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import { StrengthState } from './StrengthState'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'

export class FuryAwakeningState extends State {
  private pendingStacks = 0

  constructor() {
    super({
      id: 'state-fury-awakening',
      name: '怒りの覚醒',
      cardDefinition: {
        title: '怒りの覚醒',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    return 'ダメージを受ける度に打点上昇(10)を得る'
  }

  override isPostHitModifier(): boolean {
    return true
  }

  override onHitResolved(context: DamageHitContext): boolean {
    if (context.role !== 'defender') {
      return false
    }
    if (context.outcome.damage <= 0) {
      return false
    }
    this.pendingStacks += 1
    return true
  }

  override onDamageSequenceResolved(context: DamageSequenceContext): void {
    if (this.pendingStacks <= 0) {
      return
    }
    const owner = context.defender
    const stacks = this.pendingStacks
    this.pendingStacks = 0

    const strength = new StrengthState(10 * stacks)
    owner.addState(strength, { battle: context.battle })
  }
}
