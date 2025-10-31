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
import {
  HeavenChainAction,
  BattlePrepAction,
  MasochisticAuraAction,
  TackleAction,
  BuildUpAction,
  FlurryAction,
  BattleDanceAction,
  TentacleFlurryAction,
  MucusShotAction,
  AcidSpitAction,
} from '@/domain/entities/actions'
import {
  HardShellState,
  CorrosionState,
  AccelerationState,
  StickyState,
} from '@/domain/entities/states'
import { HeavenChainCard, BattlePrepCard, MasochisticAuraCard } from '@/domain/entities/cards'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '@/domain/entities/enemies'
import { DefaultEnemyTeam } from '@/domain/entities/enemyTeams'

interface BattleFixture {
  battle: Battle
  cards: {
    heavenChains: Card[]
    battlePreps: Card[]
    masochisticAura: Card
  }
  enemyIds: {
    orc: string
    orcDancer: string
    tentacle: string
    snail: string
  }
}

const STATES = {
  hardShell: new HardShellState(20),
  corrosion: new CorrosionState(1),
  acceleration: new AccelerationState(1),
  sticky: new StickyState(1),
}

const ACTIONS = {
  heavenChain: new HeavenChainAction(),
  battlePrep: new BattlePrepAction(),
  masochisticAura: new MasochisticAuraAction(),
  tackle: new TackleAction(),
  buildUp: new BuildUpAction(),
  flurry: new FlurryAction(),
  battleDance: new BattleDanceAction(),
  tentacleFlurry: new TentacleFlurryAction(),
  mucusShot: new MucusShotAction(),
  acidSpit: new AcidSpitAction(),
} as const

function createHeavenChain(id: number): Card {
  return new HeavenChainCard(`card-heaven-chain-${id}`, ACTIONS.heavenChain)
}

function createBattlePrep(id: number): Card {
  return new BattlePrepCard(`card-battle-prep-${id}`, ACTIONS.battlePrep)
}

function createMasochisticAura(): Card {
  return new MasochisticAuraCard('card-masochistic-aura-1', ACTIONS.masochisticAura)
}

function createBattleFixture(): BattleFixture {
  const heavenChains = Array.from({ length: 5 }).map((_, index) => createHeavenChain(index + 1))
  const battlePreps = Array.from({ length: 2 }).map((_, index) => createBattlePrep(index + 1))
  const masochisticAura = createMasochisticAura()

  const deckCards = [
    heavenChains[0],
    heavenChains[1],
    heavenChains[2],
    battlePreps[0],
    masochisticAura,
    heavenChains[3],
    battlePreps[1],
    heavenChains[4],
  ]

  const player = new ProtagonistPlayer()

  const orc = new OrcEnemy()

  const orcDancer = new OrcDancerEnemy()

  const tentacle = new TentacleEnemy()

  const snail = new SnailEnemy()

  const enemyTeam = new DefaultEnemyTeam({
    members: [orc, orcDancer, tentacle, snail],
  })

  const battle = new Battle({
    id: 'battle-1',
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

  return {
    battle,
    cards: {
      heavenChains,
      battlePreps,
      masochisticAura,
    },
    enemyIds: {
      orc: orc.id,
      orcDancer: orcDancer.id,
      tentacle: tentacle.id,
      snail: snail.id,
    },
  }
}

function drawOpeningHand(fixture: BattleFixture): void {
  fixture.battle.startPlayerTurn()
  fixture.battle.drawForPlayer(5)
}

function playMasochisticAura(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cards.masochisticAura.id, {
    targetEnemyId: fixture.enemyIds.snail,
  })
}

function playHeavenChainOnOrc(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cards.heavenChains[0].id, {
    targetEnemyId: fixture.enemyIds.orc,
  })
}

function playBattlePrep(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cards.battlePreps[0].id)
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
  fixture.battle.playCard(fixture.cards.heavenChains[1].id, {
    targetEnemyId: fixture.enemyIds.tentacle,
  })
}

function playHeavenChainOnSnail(fixture: BattleFixture): void {
  fixture.battle.playCard(fixture.cards.heavenChains[2].id, {
    targetEnemyId: fixture.enemyIds.snail,
  })
}

function playAcidSpitOnSnail(fixture: BattleFixture): void {
  const snapshot = fixture.battle.getSnapshot()
  const acidCard = snapshot.hand.find((card) => card.title === '酸を吐く')
  expect(acidCard, '酸を吐くのカードが手札に存在する').toBeDefined()

  if (!acidCard) {
    return
  }

  fixture.battle.playCard(acidCard.id, {
    targetEnemyId: fixture.enemyIds.snail,
  })
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
    expect(snapshot.hand.map((card) => card.id)).toEqual([
      fixture.cards.heavenChains[0].id,
      fixture.cards.heavenChains[1].id,
      fixture.cards.heavenChains[2].id,
      fixture.cards.battlePreps[0].id,
      fixture.cards.masochisticAura.id,
    ])
    expect(snapshot.deck.map((card) => card.id)).toEqual([
      fixture.cards.heavenChains[3].id,
      fixture.cards.battlePreps[1].id,
      fixture.cards.heavenChains[4].id,
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
    expect(snapshot.hand.some((card) => card.title === '酸を吐く')).toBe(true)
    expect(snapshot.hand.some((card) => card.title === '腐食')).toBe(true)
    expect(snapshot.discardPile.map((card) => card.id)).toContain(fixture.cards.masochisticAura.id)
    expect(snapshot.exilePile).toHaveLength(0)
  })

  it('天の鎖でオークの行動を封じる', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(1)
    expect(snapshot.hand.map((card) => card.id)).not.toContain(fixture.cards.heavenChains[0].id)
    expect(snapshot.exilePile.map((card) => card.id)).toContain(fixture.cards.heavenChains[0].id)
  })

  it('戦いの準備で次ターンのマナ+1イベントを積む', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)

    const snapshot = fixture.battle.getSnapshot()
    expect(snapshot.player.currentMana).toBe(0)
    expect(snapshot.discardPile.map((card) => card.id)).toEqual([
      fixture.cards.masochisticAura.id,
      fixture.cards.battlePreps[0].id,
    ])
    expect(snapshot.events.length).toBeGreaterThanOrEqual(1)
  })

  it('オークダンサーが戦いの舞いで加速(1)を得る', () => {
    const fixture = createBattleFixture()
    drawOpeningHand(fixture)
    playMasochisticAura(fixture)
    playHeavenChainOnOrc(fixture)
    playBattlePrep(fixture)
    progressToEnemyTurn(fixture)
    performOrcDancerAction(fixture)

    const snapshot = fixture.battle.getSnapshot()
    const orcDancer = snapshot.enemies.find((enemy) => enemy.id === fixture.enemyIds.orcDancer)
    expect(orcDancer?.states.some((state) => state.name === '加速')).toBe(true)
  })

  it('触手の粘液飛ばしでプレイヤーが15ダメージを受け、カードが手札に追加される', () => {
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

  it('２ターン目のドローフェイズで手札が８枚になり、マナが４になる', () => {
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
    expect(snapshot.hand.map((card) => card.id)).toContain(fixture.cards.heavenChains[3].id)
    expect(snapshot.hand.map((card) => card.id)).toContain(fixture.cards.battlePreps[1].id)
  })

  it('２ターン目に天の鎖で触手を封じる', () => {
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
    expect(snapshot.exilePile.map((card) => card.id)).toContain(fixture.cards.heavenChains[1].id)
  })

  it('２ターン目に天の鎖でかたつむりを封じる', () => {
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
    expect(snapshot.exilePile.map((card) => card.id)).toContain(fixture.cards.heavenChains[2].id)
  })

  it('酸を吐くでかたつむりに腐食(1)を付与する', () => {
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
    const snail = snapshot.enemies.find((enemy) => enemy.id === fixture.enemyIds.snail)
    expect(snail?.states.some((state) => state.name === '腐食')).toBe(true)
    const acidCard = snapshot.discardPile.find((card) => card.title === '酸を吐く')
    expect(acidCard).toBeDefined()
  })

  it('３ターン目のドローフェイズで山札がリフレッシュされる', () => {
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
    expect(snapshot.hand.some((card) => card.id === fixture.cards.heavenChains[4].id)).toBe(true)
    expect(snapshot.hand.some((card) => card.id === fixture.cards.masochisticAura.id)).toBe(true)
    expect(snapshot.discardPile.length).toBeLessThanOrEqual(2)
    expect(snapshot.deck.length).toBeGreaterThanOrEqual(1)
  })
})
