import { Action, type ActionContext } from '../Action'
import type { Enemy } from '../Enemy'
import { SkipTypeCardTag } from '../cardTags'

export class SkipTurnAction extends Action {
  static readonly cardId = 'skip-turn'
  static readonly ICON = '⛓'
  private readonly messageTemplate: (enemy: Enemy) => string

  constructor(message?: string | ((enemy: Enemy) => string)) {
    super({
      name: '天の鎖',
      cardDefinition: {
        title: '天の鎖',
        cardType: 'skip',
        type: new SkipTypeCardTag(),
        cost: 0,
      },
      audioCue: {
        soundId: 'skills/OtoLogic_Electric-Shock02-Short.mp3',
        waitMs: 500,
        durationMs: 500,
      },
    })

    if (typeof message === 'function') {
      this.messageTemplate = message
    } else if (typeof message === 'string') {
      this.messageTemplate = (enemy) => message.replace('{name}', enemy.name)
    } else {
      this.messageTemplate = (enemy) => `${enemy.name}は身動きが取れず、何もできなかった。`
    }
  }

  override get type(): 'skip' {
    return 'skip'
  }

  protected override description(): string {
    return '何も行動しない'
  }

  protected override perform(context: ActionContext): void {
    const enemy = context.source as Enemy
    context.battle.addLogEntry({
      message: this.messageTemplate(enemy),
      metadata: { enemyId: enemy.id, action: 'skip' },
    })
  }
}
