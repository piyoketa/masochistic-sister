import { Skill, type ActionContext, type ActionCostContext, Attack } from '../Action'
import { ArcaneCardTag, EnemySingleTargetCardTag, SkillTypeCardTag } from '../cardTags'
import type { Enemy } from '../Enemy'
import { TargetEnemyOperation } from '../operations'
import type { Operation } from '../operations'
import { ArcaneAdaptationRelic } from '../relics/ArcaneAdaptationRelic'

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
        subtitle: '',
        categoryTags: [new ArcaneCardTag()],
      },
      audioCue: {
        soundId: 'skills/Onoma-Flash02.mp3',
        waitMs: 500,
        durationMs: 500,
      },
      cutInCue: {
        src: '/assets/cut_ins/MasochisticAuraAction.png',
        waitMs: 800,
        durationMs: 800,
      },
    })
  }

  protected override description(): string {
    return '敵を即座に行動させる'
  }

  protected override buildOperations(): Operation[] {
    return [
      new TargetEnemyOperation(
        // {
        //   restrictions: [
        //     {
        //       reason: '次の行動でプレイヤーを攻撃する敵のみ選択できます',
        //       test: ({ enemy }) => this.isPlanningAttackAgainstPlayer(enemy),
        //     },
        //   ],
        // }
      ),
    ]
  }

  override cost(context?: ActionCostContext): number {
    const base = super.cost()
    const hasAdaptation = context?.battle?.hasActiveRelic('arcane-adaptation')
    if (hasAdaptation) {
      return 0
    }
    return base
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

    // コスト軽減 relic は1ターン1回のみ有効。使用後にフラグを立てる。
    const adaptation = context.battle.getRelicById('arcane-adaptation') as
      | ArcaneAdaptationRelic
      | undefined
    adaptation?.markUsed()
  }

  private isPlanningAttackAgainstPlayer(enemy: Enemy): boolean {
    const nextAction = enemy.queuedActions[0]
    return nextAction instanceof Attack
  }
}
