import { Skill, type ActionContext, Attack } from '../Action'
import { ArcaneCardTag, EnemySingleTargetCardTag, SkillTypeCardTag } from '../cardTags'
import type { Enemy } from '../Enemy'
import { TargetEnemyOperation } from '../operations'
import type { Operation } from '../operations'

export class MasochisticAuraAction extends Skill {
  constructor() {
    super({
      name: '被虐のオーラ',
      cardDefinition: {
        title: '被虐のオーラ',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
        categoryTags: [new ArcaneCardTag()],
      },
    })
  }

  protected override description(): string {
    return '攻撃予定の敵が\n即座に行動する'
  }

  protected override buildOperations(): Operation[] {
    return [
      new TargetEnemyOperation({
        restrictions: [
          {
            reason: '次の行動でプレイヤーを攻撃する敵のみ選択できます',
            test: ({ enemy }) => this.isPlanningAttackAgainstPlayer(enemy),
          },
        ],
      }),
    ]
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

    context.battle.markEntrySnapshotBoundary()
    context.battle.queueInterruptEnemyAction(targetId, { trigger: 'card' })
  }

  private isPlanningAttackAgainstPlayer(enemy: Enemy): boolean {
    const nextAction = enemy.queuedActions[0]
    return nextAction instanceof Attack
  }
}
