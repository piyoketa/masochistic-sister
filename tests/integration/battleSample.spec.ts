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
import { buildDefaultDeck } from '@/domain/entities/decks'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { SnailTeam } from '@/domain/entities/enemyTeams'

interface BattleFixture {
  battle: Battle
  cards: {
    heavenChains: readonly [Card, Card, Card, Card, Card]
    battlePreps: readonly [Card, Card]
    masochisticAura: Card
  }
  cardIds: {
    heavenChains: readonly [number, number, number, number, number]
    battlePreps: readonly [number, number]
    masochisticAura: number
  }
  enemyIds: {
    orc: number
    orcDancer: number
    tentacle: number
    snail: number
  }
}

function requireCardId(card: Card): number {
  const id = card.numericId
  if (id === undefined) {
    throw new Error('Card missing repository id')
  }

  return id
}

function createBattleFixture(): BattleFixture {
  const cardRepository = new CardRepository()
  const defaultDeck = buildDefaultDeck(cardRepository)
  const { deck: deckCards, heavenChains, battlePreps, masochisticAura } = defaultDeck

  const player = new ProtagonistPlayer()

  const enemyTeam = new SnailTeam()
  const members = enemyTeam.members
  if (members.length < 4) {
    throw new Error('Snail team requires four enemies')
  }

  const orc = members[0]!
  const orcDancer = members[1]!
  const tentacle = members[2]!
  const snail = members[3]!

  if (
    orc.numericId === undefined ||
    orcDancer.numericId === undefined ||
    tentacle.numericId === undefined ||
    snail.numericId === undefined
  ) {
    throw new Error('Enemy repository IDs are not assigned')
  }

  const battle = new Battle({
    id: 'battle-1',
    cardRepository,
    player,
    enemyTeam,
    deck: new Deck(deckCards),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })

  const [heavenChain0, heavenChain1, heavenChain2, heavenChain3, heavenChain4] = heavenChains
  const heavenChainIds: readonly [number, number, number, number, number] = [
    requireCardId(heavenChain0),
    requireCardId(heavenChain1),
    requireCardId(heavenChain2),
    requireCardId(heavenChain3),
    requireCardId(heavenChain4),
  ]

  const [battlePrep0, battlePrep1] = battlePreps
  const battlePrepIds: readonly [number, number] = [requireCardId(battlePrep0), requireCardId(battlePrep1)]
  const masochisticAuraId: number = requireCardId(masochisticAura)

  return {
    battle,
    cards: {
      heavenChains,
      battlePreps,
      masochisticAura,
    },
    cardIds: {
      heavenChains: heavenChainIds,
      battlePreps: battlePrepIds,
      masochisticAura: masochisticAuraId,
    },
    enemyIds: {
      orc: orc.numericId,
      orcDancer: orcDancer.numericId,
      tentacle: tentacle.numericId,
      snail: snail.numericId,
    },
  }
}

function drawOpeningHand(fixture: BattleFixture): void {
  fixture.battle.startPlayerTurn()
  fixture.battle.drawForPlayer(5)
}

function playMasochisticAura(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cardIds.masochisticAura, [
    { type: 'target-enemy', payload: fixture.enemyIds.snail },
  ])
}

function playHeavenChainOnOrc(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cardIds.heavenChains[0], [
    { type: 'target-enemy', payload: fixture.enemyIds.orc },
  ])
}

function playBattlePrep(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cardIds.battlePreps[0])
}

function progressToEnemyTurn(fixture: BattleFixture): void {
  fixture.battle.endPlayerTurn()
  fixture.battle.startEnemyTurn()
}

function performOrcDancerAction(fixture: BattleFixture): void {
  fixture.battle.performEnemyAction(fixture.enemyIds.orcDancer)
}

function performTentacleAction(fixture: BattleFixture): void {
  fixture.battle.performEnemyAction(fixture.enemyIds.tentacle)
}

function startSecondPlayerTurn(fixture: BattleFixture): void {
  fixture.battle.endPlayerTurn()
  fixture.battle.startPlayerTurn()
  fixture.battle.drawForPlayer(2)
}

function playHeavenChainOnTentacle(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cardIds.heavenChains[1], [
    { type: 'target-enemy', payload: fixture.enemyIds.tentacle },
  ])
}

function playHeavenChainOnSnail(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cardIds.heavenChains[2], [
    { type: 'target-enemy', payload: fixture.enemyIds.snail },
  ])
}

function playAcidSpitOnSnail(fixture: BattleFixture): void {
  const acidCard = fixture.battle.cardRepository.find((card) => card.title === '記憶：酸を吐く')
  expect(acidCard, '記憶：酸を吐くのカードが手札に存在する').toBeDefined()

  if (!acidCard) {
    return
  }

  const acidCardId = requireCardId(acidCard)
  const snapshot = fixture.battle.getSnapshot()
  expect(snapshot.hand.some((card) => card.numericId === acidCardId)).toBe(true)

  fixture.battle.playCard(acidCardId, [
    { type: 'target-enemy', payload: fixture.enemyIds.snail },
  ])
}

function startThirdPlayerTurn(fixture: BattleFixture): void {
  fixture.battle.endPlayerTurn()
  fixture.battle.startEnemyTurn()
  fixture.battle.startPlayerTurn()
  fixture.battle.drawForPlayer(2)
}

describe('Battle sample scenario', () => {
  it('初回ドローフェイズで5枚引く', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.hand.map(requireCardId)).toEqual([
      fixture.cardIds.heavenChains[0],
      fixture.cardIds.heavenChains[1],
      fixture.cardIds.heavenChains[2],
      fixture.cardIds.battlePreps[0],
      fixture.cardIds.masochisticAura,
    ])
    expect(snapshot.deck.map(requireCardId)).toEqual([
      fixture.cardIds.heavenChains[3],
      fixture.cardIds.battlePreps[1],
      fixture.cardIds.heavenChains[4],
    ])
    expect(snapshot.player.currentMana).toBe(3)
    expect(snapshot.player.currentHp).toBe(100)
  })

  it('被虐のオーラを発動し、かたつむりを即座に行動させる', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(2)
    expect(snapshot.player.currentHp).toBe(95)
    expect(snapshot.hand.some((card) => card.title === '記憶：酸を吐く')).toBe(true)
    expect(snapshot.hand.some((card) => card.title === '腐食')).toBe(true)
    expect(snapshot.discardPile.map(requireCardId)).toContain(fixture.cardIds.masochisticAura)
    expect(snapshot.exilePile).toHaveLength(0)
  })

  it.skip('天の鎖でオークの行動を封じる', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(1)
    expect(snapshot.hand.map(requireCardId)).not.toContain(fixture.cardIds.heavenChains[0])
    expect(snapshot.exilePile.map(requireCardId)).toContain(fixture.cardIds.heavenChains[0])
  })

  it.skip('戦いの準備で次ターンのマナ+1イベントを積む', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(0)
    expect(snapshot.discardPile.map(requireCardId)).toEqual([
      fixture.cardIds.masochisticAura,
      fixture.cardIds.battlePreps[0],
    ])
    expect(snapshot.events.length).toBeGreaterThanOrEqual(1)
  })

  it.skip('オークダンサーが戦いの舞いで加速(1)を得る', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)
    progressToEnemyTurn(fixture)
    performOrcDancerAction(fixture)

    const snapshot = fixture.battle.getSnapshot()
    const orcDancer = snapshot.enemies.find((enemy) => enemy.numericId === fixture.enemyIds.orcDancer)
    expect(orcDancer?.states.some((state) => state.name === '加速')).toBe(true)
  })

  it.skip('触手の粘液飛ばしでプレイヤーが15ダメージを受け、カードが手札に追加される', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)
    progressToEnemyTurn(fixture)
    performOrcDancerAction(fixture)
    performTentacleAction(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentHp).toBe(80)
    expect(snapshot.hand.some((card) => card.title === '粘液飛ばし')).toBe(true)
    expect(snapshot.hand.some((card) => card.title === 'ねばねば')).toBe(true)
  })

  it.skip('２ターン目のドローフェイズで手札が８枚になり、マナが４になる', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)
    progressToEnemyTurn(fixture)
    performOrcDancerAction(fixture)
    performTentacleAction(fixture)
    fixture.battle.performEnemyAction(fixture.enemyIds.snail)
    startSecondPlayerTurn(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(4)
    expect(snapshot.hand).toHaveLength(8)
    expect(snapshot.hand.map(requireCardId)).toContain(fixture.cardIds.heavenChains[3])
    expect(snapshot.hand.map(requireCardId)).toContain(fixture.cardIds.battlePreps[1])
  })

  it.skip('２ターン目に天の鎖で触手を封じる', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)
    progressToEnemyTurn(fixture)
    performOrcDancerAction(fixture)
    performTentacleAction(fixture)
    fixture.battle.performEnemyAction(fixture.enemyIds.snail)
    startSecondPlayerTurn(fixture)
    playHeavenChainOnTentacle(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(3)
    expect(snapshot.exilePile.map(requireCardId)).toContain(fixture.cardIds.heavenChains[1])
  })

  it.skip('２ターン目に天の鎖でかたつむりを封じる', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)
    progressToEnemyTurn(fixture)
    performOrcDancerAction(fixture)
    performTentacleAction(fixture)
    fixture.battle.performEnemyAction(fixture.enemyIds.snail)
    startSecondPlayerTurn(fixture)
    playHeavenChainOnTentacle(fixture)
    playHeavenChainOnSnail(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(2)
    expect(snapshot.exilePile.map(requireCardId)).toContain(fixture.cardIds.heavenChains[2])
  })

  it.skip('酸を吐くでかたつむりに腐食(1)を付与する', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)
    progressToEnemyTurn(fixture)
    performOrcDancerAction(fixture)
    performTentacleAction(fixture)
    fixture.battle.performEnemyAction(fixture.enemyIds.snail)
    startSecondPlayerTurn(fixture)
    playHeavenChainOnTentacle(fixture)
    playHeavenChainOnSnail(fixture)
    playAcidSpitOnSnail(fixture)

    const snapshot = fixture.battle.getSnapshot()
    const snail = snapshot.enemies.find((enemy) => enemy.numericId === fixture.enemyIds.snail)
    expect(snail?.states.some((state) => state.name === '腐食')).toBe(true)
    const acidCard = snapshot.discardPile.find((card) => card.title === '記憶：酸を吐く')
    expect(acidCard).toBeDefined()
  })

  it.skip('３ターン目のドローフェイズで山札がリフレッシュされる', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)
    progressToEnemyTurn(fixture)
    performOrcDancerAction(fixture)
    performTentacleAction(fixture)
    fixture.battle.performEnemyAction(fixture.enemyIds.snail)
    startSecondPlayerTurn(fixture)
    playHeavenChainOnTentacle(fixture)
    playHeavenChainOnSnail(fixture)
    playAcidSpitOnSnail(fixture)
    startThirdPlayerTurn(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(3)
    expect(snapshot.hand.some((card) => card.numericId === fixture.cardIds.heavenChains[4])).toBe(true)
    expect(snapshot.hand.some((card) => card.numericId === fixture.cardIds.masochisticAura)).toBe(true)
    expect(snapshot.discardPile.length).toBeLessThanOrEqual(2)
    expect(snapshot.deck.length).toBeGreaterThanOrEqual(1)
  })
})
