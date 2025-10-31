import { Skill, type ActionContext } from '../Action'
import { ArcaneCardTag } from '../cardTags'
import type { Enemy } from '../Enemy'
import { TargetEnemyOperation } from '../operations'
import type { Operation } from '../operations'

export class MasochisticAuraAction extends Skill {
  constructor() {
    super({
      name: '被虐のオーラ',
      description: '選択した敵を即座に行動させる',
      cardDefinition: {
        title: '被虐のオーラ',
        type: 'skill',
        cost: 1,
        description: '選択した敵を即座に行動させる',
        cardTags: [new ArcaneCardTag()],
      },
    })
  }

  protected override buildOperations(): Operation[] {
    return [new TargetEnemyOperation()]
  }

  override execute(context: ActionContext): void {
    const target = context.target as Enemy | undefined

    if (!target) {
      throw new Error('Target enemy is required for Masochistic Aura')
    }

    const targetId = target.numericId
    if (targetId === undefined) {
      throw new Error('Target enemy has no repository id')
    }

    context.battle.performEnemyAction(targetId)
  }

  protected override resolveTarget(
    metadata: Record<string, unknown> | undefined,
    context: ActionContext,
  ): Enemy | undefined {
    const targetEnemyId = (metadata as { targetEnemyId?: number } | undefined)?.targetEnemyId
    if (typeof targetEnemyId !== 'number') {
      return undefined
    }

    return context.battle.enemyTeam.findEnemyByNumericId(targetEnemyId)
  }
}
