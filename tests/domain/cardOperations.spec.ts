import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { Card } from '@/domain/entities/Card'
import { CardRepository } from '@/domain/repository/CardRepository'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { SnailTeam } from '@/domain/entities/enemyTeams'
import { MasochisticAuraAction, HandSwapAction, ChaosStrikeAction, BattlePrepAction } from '@/domain/entities/actions'
import type { CardOperation } from '@/domain/entities/operations'

function createBattleWithHand(
  handCards: Card[],
  deckCards: Card[] = [],
  cardRepository: CardRepository = new CardRepository(),
): Battle {
  const player = new ProtagonistPlayer()
  const enemyTeam = new SnailTeam()

  const battle = new Battle({
    id: 'battle-test',
    player,
    enemyTeam,
    deck: new Deck(deckCards),
    hand: new Hand(handCards),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
    cardRepository,
  })

  battle.startPlayerTurn()
  return battle
}

describe('Card operation validation', () => {
  it('throws when required target operation is missing', () => {
    const repo = new CardRepository()
    const auraCard = repo.create(() => new Card({ action: new MasochisticAuraAction() }))
    const battle = createBattleWithHand([auraCard], [], repo)

    expect(() => battle.playCard(auraCard.id, [])).toThrow('Operation "target-enemy" is required but missing')
  })

  it('throws when target enemy id is invalid', () => {
    const repo = new CardRepository()
    const auraCard = repo.create(() => new Card({ action: new MasochisticAuraAction() }))
    const battle = createBattleWithHand([auraCard], [], repo)

    expect(() => battle.playCard(auraCard.id, [{ type: 'target-enemy', payload: 999 }])).toThrow('Enemy 999 not found')
  })

  it('plays Masochistic Aura when valid target provided', () => {
    const repo = new CardRepository()
    const auraCard = repo.create(() => new Card({ action: new MasochisticAuraAction() }))
    const battle = createBattleWithHand([auraCard], [], repo)
    const snail = battle.enemyTeam.members.find((enemy) => enemy.name === 'かたつむり')
    expect(snail?.numericId).toBeDefined()

    battle.playCard(auraCard.id, [{ type: 'target-enemy', payload: snail!.numericId }])

    expect(battle.hand.list().some((card) => card.id === auraCard.id)).toBe(false)
    expect(battle.discardPile.list().some((card) => card.id === auraCard.id)).toBe(true)
  })

  it('requires hand selection for Hand Swap', () => {
    const repo = new CardRepository()
    const swapCard = repo.create(() => new Card({ action: new HandSwapAction() }))
    const extraCard = repo.create(() => new Card({ action: new BattlePrepAction() }))
    const drawCard = repo.create(() => new Card({ action: new BattlePrepAction() }))
    const battle = createBattleWithHand([swapCard, extraCard], [drawCard], repo)

    expect(() => battle.playCard(swapCard.id, [])).toThrow('Operation "select-hand-card" is required but missing')

    const invalidOperations: CardOperation[] = [{ type: 'select-hand-card', payload: 'invalid' }]
    expect(() => battle.playCard(swapCard.id, invalidOperations)).toThrow('Card invalid not found in hand')

    battle.playCard(swapCard.id, [{ type: 'select-hand-card', payload: extraCard.id }])

    expect(battle.hand.list().some((card) => card.id === extraCard.id)).toBe(false)
    expect(battle.discardPile.list().some((card) => card.id === extraCard.id)).toBe(true)
    expect(battle.discardPile.list().some((card) => card.id === swapCard.id)).toBe(true)
    expect(battle.hand.list().some((card) => card.id === drawCard.id)).toBe(true)
  })

  it('requires both operations for Chaos Strike and applies damage', () => {
    const repo = new CardRepository()
    const chaosCard = repo.create(() => new Card({ action: new ChaosStrikeAction() }))
    const sacrifice = repo.create(() => new Card({ action: new BattlePrepAction() }))
    const battle = createBattleWithHand([chaosCard, sacrifice], [], repo)
    const target = battle.enemyTeam.members.find((enemy) => enemy.name === 'かたつむり')
    expect(target?.numericId).toBeDefined()

    expect(() => battle.playCard(chaosCard.id, [{ type: 'target-enemy', payload: target!.numericId }])).toThrow(
      'Operation "select-hand-card" is required but missing',
    )

    expect(() => battle.playCard(chaosCard.id, [{ type: 'select-hand-card', payload: sacrifice.id }])).toThrow(
      'Operation "target-enemy" is required but missing',
    )

    battle.playCard(chaosCard.id, [
      { type: 'target-enemy', payload: target!.numericId },
      { type: 'select-hand-card', payload: sacrifice.id },
    ])

    expect(battle.hand.list().some((card) => card.id === sacrifice.id)).toBe(false)
    expect(battle.discardPile.list().some((card) => card.id === sacrifice.id)).toBe(true)
    expect(battle.discardPile.list().some((card) => card.id === chaosCard.id)).toBe(true)
    expect(target!.currentHp).toBe(target!.maxHp - sacrifice.cost * 10)
  })
})
