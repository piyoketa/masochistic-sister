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
import { CowardTrait } from '@/domain/entities/states'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'

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

describe('臆病', () => {
  it('臆病を持つ敵は最後の1体になると逃走する', () => {
    const coward = new Enemy({
      name: '臆病なかたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [new BattlePrepAction()],
      states: [new CowardTrait()],
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
    const lethalEvent = {
      actionId: 'test-direct-damage',
      attacker: { type: 'player' as const },
      defender: { type: 'enemy' as const, enemyId: ally.id ?? -1 },
      outcomes: [{ damage: 20, effectType: 'test-direct' }],
    }
    // Battle.damageEnemyはDamageEvent型を要求するため、簡易イベントを組み立てて即死ダメージを与える
    battle.damageEnemy(ally, lethalEvent)

    battle.notifyActionResolved({ source: battle.player, action: new BattlePrepAction() })

    expect(coward.status).toBe('escaped')
    expect(battle.enemyTeam.areAllDefeated()).toBe(true)
  })
})
