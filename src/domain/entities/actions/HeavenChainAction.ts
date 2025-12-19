import { Skill, type ActionContext, type ActionCostContext } from '../Action'
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
import { NoViolenceRelic } from '../relics/NoViolenceRelic'

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
        subtitle: '祈り',
        effectTags: [new ExhaustCardTag()],
        categoryTags: [new SacredCardTag()],
      },
      audioCue: {
        soundId: 'skills/Onoma-Flash02.mp3',
        waitMs: 500,
        durationMs: 500,
      },
      cutInCue: {
        src: '/assets/cut_ins/HeavenChainAction.png',
        waitMs: 800,
        durationMs: 800,
      },      
    })
  }

  protected override description(): string {
    return 'このターン\n行動を封じる'
  }

  protected override buildOperations(): Operation[] {
    return [
      new TargetEnemyOperation({
        restrictions: [
          {
            reason: '天の鎖無効の敵には天の鎖を使えません',
            test: ({ enemy }) => !enemy.getStates().some((state) => state instanceof LargeState),
          },
        ],
      }),
    ]
  }

  override cost(context?: ActionCostContext): number {
    const base = super.cost(context)
    const hasNoViolence = context?.battle?.hasActiveRelic('no-violence')
    if (hasNoViolence) {
      return 0
    }
    return base
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
    const currentTurn = context.battle.turnPosition.turn
    // 既に確定済みの行動も現在ターン指定で差し替える
    target.replaceActionForTurn(currentTurn, new SkipTurnAction(message))

    context.battle.addLogEntry({
      message: `${target.name}は天の鎖で動きを封じられた。`,
      metadata: { enemyId: target.id, action: 'heaven-chain' },
    })

    const noViolence = context.battle.getRelicById('no-violence') as NoViolenceRelic | undefined
    noViolence?.markUsed()
  }
}
