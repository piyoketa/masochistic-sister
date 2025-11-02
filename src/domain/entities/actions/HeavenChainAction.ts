import { Skill, type ActionContext } from '../Action'
import { ExhaustCardTag, SacredCardTag } from '../cardTags'
import type { Enemy } from '../Enemy'
import { SkipTurnAction } from './SkipTurnAction'
import { TargetEnemyOperation, type Operation } from '../operations'

export class HeavenChainAction extends Skill {
  constructor() {
    super({
      name: '天の鎖',
      cardDefinition: {
        title: '天の鎖',
        type: 'skill',
        cost: 1,
        notes: ['［消費］使用すると、この戦闘中は除去される'],
        cardTags: [new ExhaustCardTag(), new SacredCardTag()],
      },
    })
  }

  protected override description(): string {
    return 'このターン、選択した敵の行動を封じる'
  }

  protected override buildOperations(): Operation[] {
    return [new TargetEnemyOperation()]
  }

  protected override perform(context: ActionContext): void {
    const target = context.target as Enemy | undefined
    if (!target) {
      throw new Error('天の鎖の対象となる敵が見つかりませんでした')
    }

    const message = `${target.name}は天の鎖で縛られていて何もできない！`
    target.discardNextScheduledAction()
    target.queueImmediateAction(new SkipTurnAction(message))

    context.battle.addLogEntry({
      message: `${target.name}は天の鎖で動きを封じられた。`,
      metadata: { enemyId: target.numericId, action: 'heaven-chain' },
    })
  }
}
