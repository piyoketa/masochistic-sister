import { Skill, type ActionContext } from '../Action'
import {
  EnemySingleTargetCardTag,
  ExhaustCardTag,
  SacredCardTag,
  SkillTypeCardTag,
} from '../cardTags'
import type { Enemy } from '../Enemy'
import { SkipTurnAction } from './SkipTurnAction'
import { TargetEnemyOperation, type Operation } from '../operations'
import { LargeState } from '../states/LargeState'

export class HeavenChainAction extends Skill {
  constructor() {
    super({
      name: '天の鎖',
      cardDefinition: {
        title: '天の鎖',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
        effectTags: [new ExhaustCardTag()],
        categoryTags: [new SacredCardTag()],
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

    if (target.getStates().some((state) => state instanceof LargeState)) {
      context.battle.addLogEntry({
        message: `${target.name}は巨大な体で鎖を振り払った！`,
        metadata: { enemyId: target.id, action: 'heaven-chain-immune' },
      })
      return
    }

    const message = `${target.name}は天の鎖で縛られていて何もできない！`
    target.discardNextScheduledAction()
    target.queueImmediateAction(new SkipTurnAction(message))

    context.battle.addLogEntry({
      message: `${target.name}は天の鎖で動きを封じられた。`,
      metadata: { enemyId: target.id, action: 'heaven-chain' },
    })
  }
}
