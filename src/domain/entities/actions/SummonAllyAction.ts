import { Skill } from '../Action/Skill'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import type { ActionContext } from '../Action'
import { SlugEnemy } from '../enemies/SlugEnemy'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { TackleAction } from './TackleAction'
import { AcidSpitAction } from './AcidSpitAction'

const MAX_ENEMIES = 5

export class SummonAllyAction extends Skill {
  constructor() {
    super({
      name: '仲間を呼ぶ',
      cardDefinition: {
        title: '仲間を呼ぶ',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return 'なめくじを召喚する'
  }

  canPlay(context?: { battle?: import('../../battle/Battle').Battle; source?: import('../Enemy').Enemy }): boolean {
    const enemyCount =
      context?.battle?.enemyTeam.members.filter((enemy) => enemy.isActive() || enemy.status === 'active')
        .length ?? 0
    return enemyCount < MAX_ENEMIES
  }

  protected override perform(context: ActionContext): void {
    const battle = context.battle
    const current = battle.enemyTeam.members.filter((enemy) => enemy.isActive() || enemy.status === 'active').length
    if (current >= MAX_ENEMIES) {
      battle.addLogEntry({
        message: '仲間を呼ぼうとしたが、これ以上増えない。',
      })
      return
    }

    const initial = Math.random() < 0.5 ? TackleAction : AcidSpitAction
    const slug = new SlugEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({
          initialActionType: initial,
        }),
    })
    const added = battle.enemyTeam.addEnemy(slug)
    battle.addLogEntry({
      message: `${context.source.name}が${added.name}を呼び出した！`,
      metadata: { enemyId: added.id, action: 'summon-ally' },
    })
    battle.enemyTeam.planUpcomingActions(battle)
  }
}
