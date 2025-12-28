import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { Deck } from '@/domain/battle/Deck'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { Hand } from '@/domain/battle/Hand'
import { OperationRunner } from '@/domain/battle/OperationRunner'
import { TurnManager } from '@/domain/battle/TurnManager'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { TestEnemyTeam } from '@/domain/entities/enemyTeams'
import { CardRepository } from '@/domain/repository/CardRepository'

describe('アクティブレリックの起動', () => {
  it('贄の自覚を起動すると贄状態が付与され、使用回数が減少する', () => {
    const cardRepository = new CardRepository()
    const battle = new Battle({
      id: 'active-relic-test',
      player: new ProtagonistPlayer({ currentMana: 3, maxMana: 3 }),
      enemyTeam: new TestEnemyTeam({ bonusLevels: 0 }),
      deck: new Deck([]),
      hand: new Hand(),
      discardPile: new DiscardPile(),
      exilePile: new ExilePile(),
      events: new BattleEventQueue(),
      log: new BattleLog(),
      turn: new TurnManager(),
      cardRepository,
      relicClassNames: ['SacrificialAwarenessRelic'],
    })

    const runner = new OperationRunner({ battle })
    runner.initializeIfNeeded()

    runner.playRelic('sacrificial-awareness')

    const snapshot = runner.captureSnapshot().snapshot
    const sacrificeState = snapshot.player.states?.find((state) => state.id === 'state-sacrifice')
    expect(sacrificeState?.magnitude).toBe(1)

    const relicSnapshot = snapshot.player.relics.find((relic) => relic.id === 'sacrificial-awareness')
    expect(relicSnapshot?.usesRemaining).toBe(0)
    expect(relicSnapshot?.usable).toBe(false)
  })
})
