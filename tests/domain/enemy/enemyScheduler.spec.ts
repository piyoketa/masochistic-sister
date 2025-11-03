/**
 * Enemy 行動キューとスケジューリングの仕様
 * -----------------------------------------
 * - 敵は EnemyActionQueue を通じて行動を決定する。キューは即時挿入（queueImmediateAction）
 *   や先頭除去（discardNextScheduledAction）を介して操作され、行動順序を一元管理する。
 * - デフォルトの行動キューは、初回にランダムで技を選び、その後は登録済みの技を交互に実行する。
 * - HeavenChainAction により次の行動がキャンセルされた場合、現在ターンは SkipTurnAction を
 *   実行し、キャンセルされた行動は次ターン冒頭に必ず実行されるようキューへ戻される。
 * - BeamEnemyActionQueue のようにキューを差し替えることで、チャージ行動→大技といった
 *   敵固有の行動パターンを簡潔に表現できる。
 */
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
import { BeamEnemyActionQueue, DefaultEnemyActionQueue } from '@/domain/entities/enemy/actionQueues'

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
      metadata: { enemyId: enemy.id, action: this.label },
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

describe('DefaultEnemyActionQueue', () => {
  let actionA: LogSkillAction
  let actionB: LogSkillAction

  beforeEach(() => {
    actionA = new LogSkillAction('たいあたり')
    actionB = new LogSkillAction('酸を吐く')
  })

  it('初回の行動を固定し、その後は交互に行動する', () => {
    const enemy = new Enemy({
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [actionA, actionB],
      image: '',
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionPredicate: (action) => action === actionB }),
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

  it('天の鎖でスキップ後、次のターンに予定行動を再開する', () => {
    const enemy = new Enemy({
      name: 'オーク',
      maxHp: 10,
      currentHp: 10,
      actions: [actionA, actionB],
      image: '',
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionPredicate: (action) => action === actionA }),
    })
    const battle = createBattle(enemy)
    const player = battle.player
    const action = new HeavenChainAction()

    action.execute({
      battle,
      source: player,
      target: enemy,
      metadata: {},
      operations: [],
    })

    enemy.resetTurn()
    enemy.act(battle)

    enemy.resetTurn()
    enemy.act(battle)

    const messages = battle.log.list().map((entry) => entry.message)
    expect(messages).toEqual([
      'オークは天の鎖で動きを封じられた。',
      'オークは天の鎖で縛られていて何もできない！',
      'オークはたいあたりを使った',
    ])
  })

  it('即時挿入した行動が優先され、元のキューは保持される', () => {
    const enemy = new Enemy({
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [actionA, actionB],
      image: '',
    })
    const battle = createBattle(enemy)

    enemy.queueImmediateAction(new SkipTurnAction(() => '追加で縛られている'))
    expect(enemy.queuedActions[0]?.name).toBe('追加で縛られている')

    enemy.resetTurn()
    enemy.act(battle)

    expect(enemy.queuedActions.length).toBeGreaterThan(0)
    const nextAction = enemy.queuedActions[0]
    expect(nextAction).toBe(actionA)

    const firstEntry = battle.log.list()[0]
    expect(firstEntry?.metadata?.action).toBe('skip')
  })
})

describe('BeamEnemyActionQueue', () => {
  let charge1: LogSkillAction
  let charge2: LogSkillAction
  let beam: LogSkillAction

  beforeEach(() => {
    charge1 = new LogSkillAction('チャージ1')
    charge2 = new LogSkillAction('チャージ2')
    beam = new LogSkillAction('超ビーム')
  })

  it('チャージ2回の後にビームを撃ち、その後チャージに戻る', () => {
    const enemy = new Enemy({
      name: 'ビーム兵器',
      maxHp: 10,
      currentHp: 10,
      actions: [charge1, charge2, beam],
      image: '',
      actionQueueFactory: () => new BeamEnemyActionQueue(),
    })
    const battle = createBattle(enemy)

    enemy.resetTurn()
    enemy.act(battle)
    enemy.resetTurn()
    enemy.act(battle)
    enemy.resetTurn()
    enemy.act(battle)

    const messages = battle.log.list().map((entry) => entry.message)
    expect(messages).toEqual([
      'ビーム兵器はチャージ1を使った',
      'ビーム兵器はチャージ2を使った',
      'ビーム兵器は超ビームを使った',
    ])

    enemy.resetTurn()
    enemy.act(battle)
    expect(battle.log.list().at(-1)?.message).toBe('ビーム兵器はチャージ1を使った')
  })

  it('チャージ中に行動を止められるとチャージ1からやり直す', () => {
    const enemy = new Enemy({
      name: 'ビーム兵器',
      maxHp: 10,
      currentHp: 10,
      actions: [charge1, charge2, beam],
      image: '',
      actionQueueFactory: () => new BeamEnemyActionQueue(),
    })
    const battle = createBattle(enemy)

    enemy.resetTurn()
    enemy.act(battle) // チャージ1
    enemy.discardNextScheduledAction() // チャージ2を中断
    enemy.queueImmediateAction(new SkipTurnAction('拘束された'))

    enemy.resetTurn()
    enemy.act(battle) // スキップ

    enemy.resetTurn()
    enemy.act(battle) // 再びチャージ1から

    const messages = battle.log.list().map((entry) => entry.message)
    expect(messages).toEqual([
      'ビーム兵器はチャージ1を使った',
      '拘束された',
      'ビーム兵器はチャージ1を使った',
    ])
  })
})
