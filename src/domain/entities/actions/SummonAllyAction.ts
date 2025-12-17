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
        subtitle: '',
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
    return enemyCount < MAX_ENEMIES - 1
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
    // 召喚直後はそのターン行動済みにして、即座の行動を防ぐ
    // slug.setHasActedThisTurn(true)
    const added = battle.enemyTeam.addEnemy(slug)
    battle.addLogEntry({
      message: `${context.source.name}が${added.name}を呼び出した！`,
      metadata: { enemyId: added.id, action: 'summon-ally' },
    })
    // 召喚直後に次ターン行動も確定させ、味方バフの計画ターゲットも同時に決定する。
    battle.enemyTeam.ensureActionsForTurn(battle, battle.turnPosition.turn)
  }
}
