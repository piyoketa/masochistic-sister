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
  masochisticAuraIds: [number, number]
  heavenChainIds: [number, number, number, number]
  battlePrepId: number
  dailyRoutineId: number
  acheId: number
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
  const masochisticAuraIds = collectCardIdsByTitle('被虐のオーラ')

  if (heavenChainIds.length < 4) {
    throw new Error('デフォルトデッキに天の鎖が4枚未満です')
  }
  if (masochisticAuraIds.length < 2) {
    throw new Error('デフォルトデッキに被虐のオーラが2枚未満です')
  }

  const heavenChainTuple = heavenChainIds.slice(0, 4) as [number, number, number, number]
  const masochisticAuraTuple = masochisticAuraIds.slice(0, 2) as [number, number]

  const battlePrepId = requireCardId(snapshot.deck.find((card) => card.title === '戦いの準備'))
  const dailyRoutineId = requireCardId(snapshot.deck.find((card) => card.title === '日課'))
  const acheId = requireCardId(snapshot.deck.find((card) => card.title === '疼き'))

  const findEnemyId = (name: string): number => {
    const enemy = snapshot.enemies.find((candidate) => candidate.name === name)
    if (!enemy) {
      throw new Error(`Enemy ${name} not found in sample snapshot`)
    }
    return enemy.id
  }

  return {
    masochisticAuraIds: masochisticAuraTuple,
    heavenChainIds: heavenChainTuple,
    battlePrepId,
    dailyRoutineId,
    acheId,
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

  const findMemoryCardId = (battle: Battle, title: string): number => {
    const inHand = battle.hand
      .list()
      .find(
        (candidate) =>
          candidate.title === title &&
          (candidate.cardTags ?? []).some((tag) => tag.id === 'tag-memory'),
      )

    if (inHand) {
      return requireCardId(inHand)
    }

    const fallback = battle.cardRepository.find(
      (candidate) =>
        candidate.title === title &&
        (candidate.cardTags ?? []).some((tag) => tag.id === 'tag-memory'),
    )

    if (!fallback) {
      throw new Error(`${title} の記憶カードが見つかりません`)
    }

    return requireCardId(fallback)
  }

  const findStatusCardId = (battle: Battle, title: string): number => {
    const card = battle.hand
      .list()
      .find(
        (candidate) =>
          candidate.title === title &&
          (candidate.definition.cardType === 'status' || candidate.state !== undefined),
      )

    if (card) {
      return requireCardId(card)
    }

    const fallback = battle.cardRepository.find(
      (candidate) =>
        candidate.title === title &&
        (candidate.definition.cardType === 'status' || candidate.state !== undefined),
    )

    if (!fallback) {
      throw new Error(`${title} の状態カードが見つかりません`)
    }

    return requireCardId(fallback)
  }

  const steps: ScenarioSteps = {
    battleStart: actionLog.push({ type: 'battle-start' }),
    playerTurn1Start: actionLog.push({ type: 'start-player-turn', draw: 5 }),
    playMasochisticAuraOnSnail: actionLog.push({
      type: 'play-card',
      card: references.masochisticAuraIds[0]!,
      operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
    }),
    playDailyRoutine: actionLog.push({
      type: 'play-card',
      card: references.dailyRoutineId,
    }),
    playBattlePrep: actionLog.push({
      type: 'play-card',
      card: references.battlePrepId,
    }),
    endPlayerTurn1: actionLog.push({ type: 'end-player-turn' }),
    playerTurn2Start: actionLog.push({ type: 'start-player-turn', draw: 2 }),
    playTackleOnSnail: actionLog.push({
      type: 'play-card',
      card: (battle) => findMemoryCardId(battle, 'たいあたり'),
      operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
    }),
    playAcidSpitOnTentacle: actionLog.push({
      type: 'play-card',
      card: (battle) => findMemoryCardId(battle, '酸を吐く'),
      operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
    }),
    playMucusShotOnTentacle: actionLog.push({
      type: 'play-card',
      card: (battle) => findMemoryCardId(battle, '粘液飛ばし'),
      operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
    }),
    playCorrosion: actionLog.push({
      type: 'play-card',
      card: (battle) => findStatusCardId(battle, '腐食'),
    }),
    endPlayerTurn2: actionLog.push({ type: 'end-player-turn' }),
    playerTurn3Start: actionLog.push({ type: 'start-player-turn', draw: 2 }),
    playAcheOnFlurry: actionLog.push({
      type: 'play-card',
      card: references.acheId,
      operations: [
        {
          type: 'select-hand-card',
          payload: (battle) => findMemoryCardId(battle, '乱れ突き'),
        },
      ],
    }),
    playFlurryOnOrc: actionLog.push({
      type: 'play-card',
      card: (battle) => findMemoryCardId(battle, '乱れ突き'),
      operations: [{ type: 'target-enemy', payload: references.enemyIds.orc }],
    }),
    playFlurryOnOrcDancer: actionLog.push({
      type: 'play-card',
      card: (battle) => findMemoryCardId(battle, '乱れ突き'),
      operations: [{ type: 'target-enemy', payload: references.enemyIds.orcDancer }],
    }),
    victory: actionLog.push({ type: 'victory' }),
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
