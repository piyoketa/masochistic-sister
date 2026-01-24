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
import { Card } from '@/domain/entities/Card'
import { DailyRoutineAction } from '@/domain/entities/actions/DailyRoutineAction'

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
      relicIds: ['sacrificial-awareness'],
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

  it('日課レリックを起動すると2枚ドローし、残回数が0になる', () => {
    const cardRepository = new CardRepository()
    const deckCards = [
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
    ]

    const battle = new Battle({
      id: 'active-relic-daily-routine',
      player: new ProtagonistPlayer({ currentMana: 3, maxMana: 3 }),
      enemyTeam: new TestEnemyTeam({ bonusLevels: 0 }),
      deck: new Deck(deckCards),
      hand: new Hand(),
      discardPile: new DiscardPile(),
      exilePile: new ExilePile(),
      events: new BattleEventQueue(),
      log: new BattleLog(),
      turn: new TurnManager(),
      cardRepository,
      relicIds: ['daily-routine-relic'],
    })

    const runner = new OperationRunner({ battle })
    runner.initializeIfNeeded()

    runner.playRelic('daily-routine-relic')

    const snapshot = runner.captureSnapshot().snapshot
    expect(snapshot.hand.length).toBe(6)

    const relicSnapshot = snapshot.player.relics.find((relic) => relic.id === 'daily-routine-relic')
    expect(relicSnapshot?.usesRemaining).toBe(0)
    expect(relicSnapshot?.usable).toBe(false)
  })

  it('日課レリックのrelic-activateバッチは手札を更新せず、レリック領域だけを差し替える', () => {
    const cardRepository = new CardRepository()
    // card-trash 等の後続バッチが正しく動けるよう、手札更新はrelic-activateのパッチに含めないことを確認する
    const deckCards = [
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
      cardRepository.create(() => new Card({ action: new DailyRoutineAction() })),
    ]

    const battle = new Battle({
      id: 'active-relic-daily-routine-hand-patch',
      player: new ProtagonistPlayer({ currentMana: 3, maxMana: 3 }),
      enemyTeam: new TestEnemyTeam({ bonusLevels: 0 }),
      deck: new Deck(deckCards),
      hand: new Hand(),
      discardPile: new DiscardPile(),
      exilePile: new ExilePile(),
      events: new BattleEventQueue(),
      log: new BattleLog(),
      turn: new TurnManager(),
      cardRepository,
      relicIds: ['daily-routine-relic'],
    })

    const runner = new OperationRunner({ battle })
    runner.initializeIfNeeded()

    runner.playRelic('daily-routine-relic')

    const actionLog = runner.getActionLog()
    const lastEntry = actionLog.at(actionLog.length - 1)
    expect(lastEntry?.type).toBe('play-relic')

    const relicBatch = lastEntry?.animationBatches?.find((batch) =>
      batch.instructions.some((instruction) => instruction.metadata?.stage === 'relic-activate'),
    )
    expect(relicBatch).toBeTruthy()
    const changes = relicBatch?.patch?.changes as {
      player?: unknown
      hand?: unknown
      deck?: unknown
      discardPile?: unknown
      exilePile?: unknown
    }
    expect(changes?.player).toBeTruthy()
    expect(changes?.hand).toBeUndefined()
    expect(changes?.deck).toBeUndefined()
    expect(changes?.discardPile).toBeUndefined()
    expect(changes?.exilePile).toBeUndefined()
  })
})
