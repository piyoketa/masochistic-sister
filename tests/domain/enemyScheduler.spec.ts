import { describe, it, expect, beforeEach } from 'vitest'

import { Enemy } from '@/domain/entities/Enemy'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { CardRepository } from '@/domain/repository/CardRepository'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { Skill, type ActionContext } from '@/domain/entities/Action'
import { HeavenChainAction } from '@/domain/entities/actions'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'

class LogSkillAction extends Skill {
  constructor(private readonly label: string) {
    super({
      name: label,
      cardDefinition: {
        title: label,
        type: 'skill',
        cost: 0,
      },
    })
  }

  protected override description(): string {
    return `${this.label}を実行する`
  }

  override execute(context: ActionContext): void {
    const enemy = context.source as Enemy
    context.battle.addLogEntry({
      message: `${enemy.name}は${this.label}を使った`,
      metadata: { enemyId: enemy.numericId, action: this.label },
    })
  }
}

function createBattle(enemy: Enemy): Battle {
  const player = new ProtagonistPlayer()
  const enemyTeam = new EnemyTeam({
    id: 'team',
    members: [enemy],
  })

  return new Battle({
    id: 'battle-test',
    player,
    enemyTeam,
    deck: new Deck(),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
    cardRepository: new CardRepository(),
  })
}

describe('Enemy action scheduling', () => {
  let actionA: LogSkillAction
  let actionB: LogSkillAction

  beforeEach(() => {
    actionA = new LogSkillAction('たいあたり')
    actionB = new LogSkillAction('酸を吐く')
  })

  it('初期行動をランダムで決定し、同じ技を連続で選ばない', () => {
    const rngValues = [0.9, 0.1]
    let rngIndex = 0
    const enemy = new Enemy({
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [actionA, actionB],
      image: '',
      rng: () => {
        const value = rngValues[rngIndex % rngValues.length]!
        rngIndex += 1
        return value
      },
    })
    const battle = createBattle(enemy)

    enemy.resetTurn()
    enemy.act(battle)

    enemy.resetTurn()
    enemy.act(battle)

    const logs = battle.log.list().map((entry) => entry.message)
    expect(logs).toEqual([
      'かたつむりは酸を吐くを使った',
      'かたつむりはたいあたりを使った',
    ])
  })

  it('天の鎖で行動不能アクションを先頭へ差し込み、ログが記録される', () => {
    const enemy = new Enemy({
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [actionA, actionB],
      image: '',
    })
    const battle = createBattle(enemy)
    const player = battle.player
    const action = new HeavenChainAction()
    const targetId = enemy.numericId
    if (targetId === undefined) {
      throw new Error('enemy numeric id not assigned')
    }

    action.execute({
      battle,
      source: player,
      target: enemy,
      metadata: {},
      operations: [],
    })

    enemy.resetTurn()
    enemy.act(battle)

    const messages = battle.log.list().map((entry) => entry.message)
    expect(messages).toEqual([
      'かたつむりは天の鎖で動きを封じられた。',
      'かたつむりは天の鎖で縛られていて何もできない！',
    ])
  })

  it('同ターン中に二度めの行動要求が来た場合は何もしない', () => {
    const enemy = new Enemy({
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [actionA, actionB],
      image: '',
    })
    const battle = createBattle(enemy)

    enemy.resetTurn()
    enemy.act(battle)
    enemy.act(battle) // 同一ターン中、既に行動済みのためスキップ

    const messages = battle.log.list().map((entry) => entry.message)
    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatch(/かたつむりは.+を使った/)
    expect(messages[1]).toBe('かたつむりは既に行動したため、何もしなかった。')
  })

  it('ImmediateActionを差し込み後もキューを維持する', () => {
    const enemy = new Enemy({
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [actionA, actionB],
      image: '',
    })
    const battle = createBattle(enemy)

    enemy.queueImmediateAction(new SkipTurnAction(() => '追加で縛られている'))
    expect(enemy.queuedActions.length).toBeGreaterThanOrEqual(2)

    enemy.resetTurn()
    enemy.act(battle)

    // Immediate action が先に処理され、次の行動候補が補充されていること
    expect(enemy.queuedActions.length).toBeGreaterThanOrEqual(2)

    const messages = battle.log.list().map((entry) => entry.message)
    expect(messages[0]).toBe('追加で縛られている')
  })
})
