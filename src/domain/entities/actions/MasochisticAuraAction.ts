import { Skill, type ActionContext } from '../Action'
import { ArcaneCardTag } from '../cardTags'
import type { Enemy } from '../Enemy'
import { assertTargetEnemyOperation, type TargetEnemyOperation } from '../operations'

export class MasochisticAuraAction extends Skill {
  constructor() {
    super({
      id: 'action-masochistic-aura',
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

  override execute(context: ActionContext): void {
    const metadata = context.metadata as TargetEnemyOperation | undefined
    const target = (context.target as Enemy | undefined)
      ?? (metadata ? context.battle.enemyTeam.findEnemy(metadata.targetEnemyId) : undefined)

    if (!target) {
      throw new Error('Target enemy is required for Masochistic Aura')
    }

    context.battle.performEnemyAction(target.id)
  }

  protected override validateOperation(operation: unknown): Record<string, unknown> | undefined {
    assertTargetEnemyOperation(operation)
    return operation as TargetEnemyOperation
  }
}
