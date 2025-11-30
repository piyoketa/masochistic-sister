import type { BattleSnapshot } from '@/domain/battle/Battle'
import { Battle } from '@/domain/battle/Battle'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { Deck } from '@/domain/battle/Deck'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { Hand } from '@/domain/battle/Hand'
import { ActionLogReplayer } from '@/domain/battle/ActionLogReplayer'
import { OperationLog } from '@/domain/battle/OperationLog'
import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'
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

const scenarioStepKeys = [
  'battleStart',
  'playerTurn1Start',
  'playMasochisticAuraOnSnail',
  'playDailyRoutine',
  'playBattlePrep',
  'endPlayerTurn1',
  'playerTurn2Start',
  'playTackleOnSnail',
  'playAcidSpitOnTentacle',
  'playMucusShotOnTentacle',
  'playCorrosion',
  'endPlayerTurn2',
  'playerTurn3Start',
  'playAcheOnFlurry',
  'playFlurryOnOrc',
  'playFlurryOnOrcDancer',
  'victory',
] as const

type ScenarioStepKey = (typeof scenarioStepKeys)[number]
export type ScenarioSteps = Record<ScenarioStepKey, number>

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
  operationLog: OperationLog
}

function finalizeScenarioSteps(partial: Partial<ScenarioSteps>): ScenarioSteps {
  const missing = scenarioStepKeys.filter((key) => partial[key] === undefined)
  if (missing.length > 0) {
    throw new Error(`Scenario steps are missing indices for: ${missing.join(', ')}`)
  }
  return partial as ScenarioSteps
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
  const operationLog = new OperationLog()

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

  const operationStepHints: Partial<Record<number, ScenarioStepKey>> = {}

  const registerOperation = (
    key: ScenarioStepKey | undefined,
    entry: Parameters<OperationLog['push']>[0],
  ) => {
    const opIndex = operationLog.push(entry)
    if (key) {
      operationStepHints[opIndex] = key
    }
  }

  registerOperation('playMasochisticAuraOnSnail', {
    type: 'play-card',
    card: references.masochisticAuraIds[0]!,
    operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
  })
  registerOperation('playDailyRoutine', {
    type: 'play-card',
    card: references.dailyRoutineId,
  })
  registerOperation('playBattlePrep', {
    type: 'play-card',
    card: references.battlePrepId,
  })
  registerOperation('endPlayerTurn1', { type: 'end-player-turn' })
  registerOperation('playTackleOnSnail', {
    type: 'play-card',
    card: (battle: Battle) => findMemoryCardId(battle, 'たいあたり'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
  })
  registerOperation('playAcidSpitOnTentacle', {
    type: 'play-card',
    card: (battle: Battle) => findMemoryCardId(battle, '吸いつく'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
  })
  registerOperation('playMucusShotOnTentacle', {
    type: 'play-card',
    card: (battle: Battle) => findMemoryCardId(battle, '体液をかける'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
  })
  registerOperation('playCorrosion', {
    type: 'play-card',
    card: (battle: Battle) => findStatusCardId(battle, '腐食'),
  })
  registerOperation('endPlayerTurn2', { type: 'end-player-turn' })
  registerOperation('playAcheOnFlurry', {
    type: 'play-card',
    card: references.acheId,
    operations: [
      {
        type: 'select-hand-card',
        payload: (battle: Battle) => findMemoryCardId(battle, '乱れ突き'),
      },
    ],
  })
  registerOperation('playFlurryOnOrc', {
    type: 'play-card',
    card: (battle: Battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orc }],
  })
  registerOperation('playFlurryOnOrcDancer', {
    type: 'play-card',
    card: (battle: Battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orcDancer }],
  })

  const recordedSteps: Partial<ScenarioSteps> = {}
  const recordStep = (key: ScenarioStepKey, index: number): void => {
    if (recordedSteps[key] === undefined) {
      recordedSteps[key] = index
    }
  }

  let startTurnCount = 0
  const operationReplayer = new OperationLogReplayer({
    createBattle,
    operationLog,
    onEntryAppended: (entry, { index }) => {
      if (entry.type === 'battle-start') {
        recordStep('battleStart', index)
      } else if (entry.type === 'start-player-turn') {
        startTurnCount += 1
        if (startTurnCount === 1) {
          recordStep('playerTurn1Start', index)
        } else if (startTurnCount === 2) {
          recordStep('playerTurn2Start', index)
        } else if (startTurnCount === 3) {
          recordStep('playerTurn3Start', index)
        }
      } else if (entry.type === 'victory') {
        recordStep('victory', index)
      }
    },
    onOperationApplied: ({ operationIndex, actionLogIndex }) => {
      const key = operationStepHints[operationIndex]
      if (key) {
        recordStep(key, actionLogIndex)
      }
    },
  })
  const { actionLog } = operationReplayer.buildActionLog()

  const finalizedSteps = finalizeScenarioSteps(recordedSteps)

  return {
    createBattle,
    replayer: new ActionLogReplayer({
      createBattle,
      actionLog,
    }),
    steps: finalizedSteps,
    references,
    operationLog,
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
