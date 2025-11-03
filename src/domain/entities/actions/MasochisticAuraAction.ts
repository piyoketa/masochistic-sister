import { Skill, type ActionContext } from '../Action'
import { ArcaneCardTag } from '../cardTags'
import type { Enemy } from '../Enemy'
import { TargetEnemyOperation } from '../operations'
import type { Operation } from '../operations'

export class MasochisticAuraAction extends Skill {
  constructor() {
    super({
      name: '被虐のオーラ',
      cardDefinition: {
        title: '被虐のオーラ',
        type: 'skill',
        cost: 1,
        cardTags: [new ArcaneCardTag()],
      },
    })
  }

  protected override description(): string {
    return '選択した敵を即座に行動させる'
  }

  protected override buildOperations(): Operation[] {
    return [new TargetEnemyOperation()]
  }

  protected override perform(context: ActionContext): void {
    const target = context.target as Enemy | undefined

    if (!target) {
      throw new Error('Target enemy is required for Masochistic Aura')
    }

    const targetId = target.id
    if (targetId === undefined) {
      throw new Error('Target enemy has no repository id')
    }

    context.battle.performEnemyAction(targetId)
  }

}
