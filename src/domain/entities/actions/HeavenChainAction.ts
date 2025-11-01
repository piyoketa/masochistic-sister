import { Skill, type ActionContext } from '../Action'
import { ExhaustCardTag, SacredCardTag } from '../cardTags'
import type { Enemy } from '../Enemy'
import { SkipTurnAction } from './SkipTurnAction'

export class HeavenChainAction extends Skill {
  constructor() {
    super({
      name: '天の鎖',
      description: 'このターン、敵1体の動きを止める',
      cardDefinition: {
        title: '天の鎖',
        type: 'skill',
        cost: 1,
        description: 'このターン、敵1体の動きを止める',
        notes: ['［消費］使用すると、この戦闘中は除去される'],
        cardTags: [new ExhaustCardTag(), new SacredCardTag()],
      },
    })
  }

  override execute(context: ActionContext): void {
    const target = context.target as Enemy | undefined
    if (!target) {
      throw new Error('天の鎖の対象となる敵が見つかりませんでした')
    }

    const message = `${target.name}は天の鎖で縛られていて何もできない！`
    target.queueImmediateAction(new SkipTurnAction(message))

    context.battle.addLogEntry({
      message: `${target.name}は天の鎖で動きを封じられた。`,
      metadata: { enemyId: target.numericId, action: 'heaven-chain' },
    })
  }
}
