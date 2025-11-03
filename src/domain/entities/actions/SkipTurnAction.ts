import { Action, type ActionContext } from '../Action'
import type { Enemy } from '../Enemy'

export class SkipTurnAction extends Action {
  static readonly ICON = '⛓'
  private readonly messageTemplate: (enemy: Enemy) => string

  constructor(message?: string | ((enemy: Enemy) => string)) {
    super({
      name: '足止め',
      cardDefinition: {
        title: '足止め',
        type: 'skill',
        cost: 0,
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

  override get type(): 'skill' {
    return 'skill'
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
