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
import { Attack, type ActionContext } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import type { Enemy } from '@/domain/entities/Enemy'
import type { Player } from '@/domain/entities/Player'
import { SelectHandCardOperation, type CardOperation } from '@/domain/entities/operations'

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
  const id = card.numericId
  if (id === undefined) {
    throw new Error('Card missing repository id')
  }

  return id
}

class TestChaosStrikeAction extends Attack {
  constructor() {
    super({
      name: '混迷（テスト）',
      baseDamage: new Damages({ baseAmount: 0, baseCount: 1, type: 'single' }),
      cardDefinition: {
        title: '混迷（テスト）',
        type: 'attack',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '手札を1枚捨て、そのカードのコスト×10のダメージを与える'
  }

  protected override buildOperations() {
    return [...super.buildOperations(), new SelectHandCardOperation()]
  }

  protected override beforeAttack(context: ActionContext, _defender: Player | Enemy): void {
    const selectOperation = context.operations?.find(
      (operation) => operation.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined

    if (!selectOperation) {
      throw new Error('SelectHandCardOperation is required for Test Chaos Strike')
    }

    const selectedCard = selectOperation.card
    context.battle.hand.remove(selectedCard)
    context.battle.discardPile.add(selectedCard)

    this.setOverrideDamages(
      new Damages({
        baseAmount: Math.max(0, selectedCard.cost) * 10,
        baseCount: 1,
        type: 'single',
      }),
    )
  }
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
    expect(snail?.numericId).toBeDefined()

    const auraCardId = requireCardId(auraCard)

    battle.playCard(auraCardId, [{ type: 'target-enemy', payload: snail!.numericId }])

    expect(battle.hand.list().some((card) => card.numericId === auraCardId)).toBe(false)
    expect(battle.discardPile.list().some((card) => card.numericId === auraCardId)).toBe(true)
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

    expect(battle.hand.list().some((card) => card.numericId === extraCardId)).toBe(false)
    expect(battle.discardPile.list().some((card) => card.numericId === extraCardId)).toBe(true)
    expect(battle.discardPile.list().some((card) => card.numericId === swapCardId)).toBe(true)
    expect(battle.hand.list().some((card) => card.numericId === drawCardId)).toBe(true)
  })

  it('requires both operations for Test Chaos Strike and applies damage', () => {
    const repo = new CardRepository()
    const chaosCard = repo.create(() => new Card({ action: new TestChaosStrikeAction() }))
    const sacrifice = repo.create(() => new Card({ action: new BattlePrepAction() }))
    const battle = createBattleWithHand([chaosCard, sacrifice], [], repo)
    const target = battle.enemyTeam.members.find((enemy) => enemy.name === 'かたつむり')
    expect(target?.numericId).toBeDefined()

    const chaosCardId = requireCardId(chaosCard)
    const sacrificeId = requireCardId(sacrifice)

    expect(() => battle.playCard(chaosCardId, [{ type: 'target-enemy', payload: target!.numericId }])).toThrow(
      'Operation "select-hand-card" is required but missing',
    )

    expect(() => battle.playCard(chaosCardId, [{ type: 'select-hand-card', payload: sacrificeId }])).toThrow(
      'Operation "target-enemy" is required but missing',
    )

    battle.playCard(chaosCardId, [
      { type: 'target-enemy', payload: target!.numericId },
      { type: 'select-hand-card', payload: sacrificeId },
    ])

    expect(battle.hand.list().some((card) => card.numericId === sacrificeId)).toBe(false)
    expect(battle.discardPile.list().some((card) => card.numericId === sacrificeId)).toBe(true)
    expect(battle.discardPile.list().some((card) => card.numericId === chaosCardId)).toBe(true)
    expect(target!.currentHp).toBe(target!.maxHp - sacrifice.cost * 10)
  })
})
