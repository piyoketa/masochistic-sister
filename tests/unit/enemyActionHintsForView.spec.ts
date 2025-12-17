import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { Enemy } from '@/domain/entities/Enemy'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { buildEnemyActionHintsForView, formatEnemyActionChipsForView } from '@/view/enemyActionHintsForView'

function createBattleWithOneEnemy(): { battle: Battle; enemyId: number } {
  const enemy = new Enemy({
    name: 'テスト敵',
    maxHp: 30,
    currentHp: 30,
    actions: [new TackleAction()],
    image: 'enemy.png',
  })
  const team = new EnemyTeam({
    id: 'enemy-team-test',
    members: [enemy],
  })

  const battle = new Battle({
    id: 'battle-test',
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

  const enemyId = team.members[0]?.id
  if (enemyId === undefined) {
    throw new Error('敵のIDが採番されていません')
  }
  return { battle, enemyId }
}

describe('buildEnemyActionHintsForView', () => {
  it('キャッシュが無い場合はキューから行動予測を生成しactedフラグを付与する', () => {
    const { battle, enemyId } = createBattleWithOneEnemy()
    // 行動確定を行う（ターン1）
    battle.enemyTeam.ensureActionsForTurn(battle, battle.turnPosition.turn)
    const snapshot = battle.getSnapshot()
    snapshot.turnPosition.side = 'player'
    snapshot.enemies[0]!.hasActedThisTurn = false

    const result = buildEnemyActionHintsForView({
      battle,
      snapshot,
    })

    const hints = result.get(enemyId)
    expect(hints).toBeDefined()
    expect(hints && hints.length).toBeGreaterThan(0)
    expect(hints?.every((hint) => hint.acted === false)).toBe(true)

    const chips = formatEnemyActionChipsForView(enemyId, hints ?? [])
    expect(chips.length).toBeGreaterThan(0)
    expect(chips[0]?.label.length).toBeGreaterThan(0)
  })
})
