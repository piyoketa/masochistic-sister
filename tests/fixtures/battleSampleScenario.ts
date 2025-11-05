import { ActionLog } from '@/domain/battle/ActionLog'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import { Battle } from '@/domain/battle/Battle'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { Deck } from '@/domain/battle/Deck'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { Hand } from '@/domain/battle/Hand'
import { ActionLogReplayer } from '@/domain/battle/ActionLogReplayer'
import { TurnManager } from '@/domain/battle/TurnManager'
import { Card } from '@/domain/entities/Card'
import { buildTestDeck } from '@/domain/entities/decks'
import { TestEnemyTeam } from '@/domain/entities/enemyTeams'
import { AcidSpitAction } from '@/domain/entities/actions/AcidSpitAction'
import { BattleDanceAction } from '@/domain/entities/actions/BattleDanceAction'
import { MucusShotAction } from '@/domain/entities/actions/MucusShotAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import { AccelerationState } from '@/domain/entities/states/AccelerationState'
import { StickyState } from '@/domain/entities/states/StickyState'
import { StrengthState } from '@/domain/entities/states/StrengthState'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'

export interface ScenarioSteps {
  battleStart: number
  playerTurn1Start: number
  playMasochisticAura: number
  playHeavenChainOnOrc: number
  playBattlePrep: number
  endPlayerTurn1: number
  startPlayerTurn2: number
}

export interface ScenarioReferences {
  masochisticAuraId: number
  heavenChainIds: [number, number, number, number, number]
  battlePrepIds: [number, number]
  enemyIds: {
    orc: number
    orcDancer: number
    tentacle: number
    snail: number
  }
}

export interface BattleScenario {
  createBattle: () => Battle
  replayer: ActionLogReplayer
  steps: ScenarioSteps
  references: ScenarioReferences
}

export function requireCardId(card: Card | undefined): number {
  if (!card || card.id === undefined) {
    throw new Error('Card missing repository id')
  }
  return card.id
}

export function createBaseBattle(): Battle {
  const cardRepository = new CardRepository()
  const defaultDeck = buildTestDeck(cardRepository)
  const player = new ProtagonistPlayer()
  const enemyTeam = new TestEnemyTeam()

  return new Battle({
    id: 'battle-1',
    cardRepository,
    player,
    enemyTeam,
    deck: new Deck(defaultDeck.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

export function collectScenarioReferences(snapshot: BattleSnapshot): ScenarioReferences {
  const collectCardIdsByTitle = (title: string): number[] =>
    snapshot.deck.filter((card) => card.title === title).map((card) => requireCardId(card))

  const heavenChainIds = collectCardIdsByTitle('天の鎖')
  const battlePrepIds = collectCardIdsByTitle('戦いの準備')

  if (heavenChainIds.length < 5) {
    throw new Error('デフォルトデッキに天の鎖が5枚未満です')
  }
  if (battlePrepIds.length < 2) {
    throw new Error('デフォルトデッキに戦いの準備が2枚未満です')
  }

  const heavenChainTuple = heavenChainIds.slice(0, 5) as [number, number, number, number, number]
  const battlePrepTuple = battlePrepIds.slice(0, 2) as [number, number]

  const masochisticAuraId = requireCardId(
    snapshot.deck.find((card) => card.title === '被虐のオーラ'),
  )

  const findEnemyId = (name: string): number => {
    const enemy = snapshot.enemies.find((candidate) => candidate.name === name)
    if (!enemy) {
      throw new Error(`Enemy ${name} not found in sample snapshot`)
    }
    return enemy.id
  }

  return {
    masochisticAuraId,
    heavenChainIds: heavenChainTuple,
    battlePrepIds: battlePrepTuple,
    enemyIds: {
      orc: findEnemyId('オーク'),
      orcDancer: findEnemyId('オークダンサー'),
      tentacle: findEnemyId('触手'),
      snail: findEnemyId('かたつむり'),
    },
  }
}

export function createBattleScenario(): BattleScenario {
  const createBattle = () => createBaseBattle()
  const sampleSnapshot = createBattle().getSnapshot()
  const references = collectScenarioReferences(sampleSnapshot)
  const actionLog = new ActionLog()

  const steps: ScenarioSteps = {
    battleStart: actionLog.push({ type: 'battle-start' }),
    playerTurn1Start: actionLog.push({ type: 'start-player-turn', draw: 5 }),
    playMasochisticAura: actionLog.push({
      type: 'play-card',
      card: references.masochisticAuraId,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
    }),
    playHeavenChainOnOrc: actionLog.push({
      type: 'play-card',
      card: references.heavenChainIds[0]!,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.orc }],
    }),
    playBattlePrep: actionLog.push({
      type: 'play-card',
      card: references.battlePrepIds[0]!,
    }),
    endPlayerTurn1: actionLog.push({ type: 'end-player-turn' }),
    startPlayerTurn2: actionLog.push({ type: 'start-player-turn' }),
  }

  return {
    createBattle,
    replayer: new ActionLogReplayer({
      createBattle,
      actionLog,
    }),
    steps,
    references,
  }
}

export function createBattleSampleScenario(): BattleScenario {
  return createBattleScenario()
}

export function createBattleSampleScenarioPattern2(): BattleScenario {
  return createBattleScenario()
}

export {
  AcidSpitAction,
  BattleDanceAction,
  MucusShotAction,
  TackleAction,
  FlurryAction,
  CorrosionState,
  AccelerationState,
  StickyState,
  StrengthState,
  SkipTurnAction,
}
