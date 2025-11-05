import { describe, it, expect, vi } from 'vitest'

vi.setConfig({ testTimeout: 2000 })

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { Enemy } from '@/domain/entities/Enemy'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { CowardTrait, BleedState } from '@/domain/entities/states'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'

function createBattleWithEnemies(enemies: Enemy[]): Battle {
  const team = new EnemyTeam({ id: 'coward-test', members: enemies })
  return new Battle({
    id: 'battle-coward-test',
    player: new ProtagonistPlayer(),
    enemyTeam: team,
    deck: new Deck(),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

describe('臆病と出血ステート', () => {
  it('臆病を持つ敵は最後の1体になると逃走する', () => {
    const coward = new Enemy({
      name: '臆病なかたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [new BattlePrepAction()],
      traits: [new CowardTrait()],
      image: 'coward.png',
    })

    const ally = new Enemy({
      name: '仲間',
      maxHp: 10,
      currentHp: 10,
      actions: [new BattlePrepAction()],
      image: 'ally.png',
    })

    const battle = createBattleWithEnemies([coward, ally])
    battle.damageEnemy(ally, 20)

    battle.notifyActionResolved({ source: battle.player, action: new BattlePrepAction() })

    expect(coward.status).toBe('escaped')
    expect(battle.enemyTeam.areAllDefeated()).toBe(true)
  })

  it('出血は攻撃行動後に自傷ダメージを与える', () => {
    const bleedEnemy = new Enemy({
      name: '出血兵',
      maxHp: 30,
      currentHp: 30,
      actions: [new TackleAction()],
      states: [new BleedState(5)],
      image: 'bleeder.png',
    })

    const target = new Enemy({
      name: '標的',
      maxHp: 30,
      currentHp: 30,
      actions: [new BattlePrepAction()],
      image: 'target.png',
    })

    const battle = createBattleWithEnemies([bleedEnemy, target])

    const rngSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    battle.enemyTeam.planUpcomingActions(battle)
    rngSpy.mockRestore()

    bleedEnemy.act(battle)

    expect(bleedEnemy.currentHp).toBe(25)
  })
})
