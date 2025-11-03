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
import { MasochisticAuraAction, HandSwapAction, BattlePrepAction } from '@/domain/entities/actions'
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

function requireCardId(card: Card): number {
  const id = card.id
  if (id === undefined) {
    throw new Error('Card missing repository id')
  }

  return id
}

describe('Card operation validation', () => {
  it('throws when required target operation is missing', () => {
    const repo = new CardRepository()
    const auraCard = repo.create(() => new Card({ action: new MasochisticAuraAction() }))
    const battle = createBattleWithHand([auraCard], [], repo)

    const auraCardId = requireCardId(auraCard)

    expect(() => battle.playCard(auraCardId, [])).toThrow('Operation "target-enemy" is required but missing')
  })

  it('throws when target enemy id is invalid', () => {
    const repo = new CardRepository()
    const auraCard = repo.create(() => new Card({ action: new MasochisticAuraAction() }))
    const battle = createBattleWithHand([auraCard], [], repo)

    const auraCardId = requireCardId(auraCard)

    expect(() => battle.playCard(auraCardId, [{ type: 'target-enemy', payload: 999 }])).toThrow('Enemy 999 not found')
  })

  it('plays Masochistic Aura when valid target provided', () => {
    const repo = new CardRepository()
    const auraCard = repo.create(() => new Card({ action: new MasochisticAuraAction() }))
    const battle = createBattleWithHand([auraCard], [], repo)
    const snail = battle.enemyTeam.members.find((enemy) => enemy.name === 'かたつむり')
    expect(snail?.id).toBeDefined()

    const auraCardId = requireCardId(auraCard)

    battle.playCard(auraCardId, [{ type: 'target-enemy', payload: snail!.id }])

    expect(battle.hand.list().some((card) => card.id === auraCardId)).toBe(false)
    expect(battle.discardPile.list().some((card) => card.id === auraCardId)).toBe(true)
  })

  it('requires hand selection for Hand Swap', () => {
    const repo = new CardRepository()
    const swapCard = repo.create(() => new Card({ action: new HandSwapAction() }))
    const extraCard = repo.create(() => new Card({ action: new BattlePrepAction() }))
    const drawCard = repo.create(() => new Card({ action: new BattlePrepAction() }))
    const battle = createBattleWithHand([swapCard, extraCard], [drawCard], repo)

    const swapCardId = requireCardId(swapCard)
    const extraCardId = requireCardId(extraCard)
    const drawCardId = requireCardId(drawCard)

    expect(() => battle.playCard(swapCardId, [])).toThrow('Operation "select-hand-card" is required but missing')

    const invalidOperations: CardOperation[] = [{ type: 'select-hand-card', payload: 999 }]
    expect(() => battle.playCard(swapCardId, invalidOperations)).toThrow('Card 999 not found in hand')

    battle.playCard(swapCardId, [{ type: 'select-hand-card', payload: extraCardId }])

    expect(battle.hand.list().some((card) => card.id === extraCardId)).toBe(false)
    expect(battle.discardPile.list().some((card) => card.id === extraCardId)).toBe(true)
    expect(battle.discardPile.list().some((card) => card.id === swapCardId)).toBe(true)
    expect(battle.hand.list().some((card) => card.id === drawCardId)).toBe(true)
  })
})
