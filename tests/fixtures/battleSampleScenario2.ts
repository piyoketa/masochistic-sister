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
import { buildScenario2Deck } from '@/domain/entities/decks'
import { IronBloomTeam } from '@/domain/entities/enemyTeams'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
import { TailwindAction } from '@/domain/entities/actions/TailwindAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { MucusShotAction } from '@/domain/entities/actions/MucusShotAction'
import { AcidSpitAction } from '@/domain/entities/actions/AcidSpitAction'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { MasochisticAuraAction } from '@/domain/entities/actions/MasochisticAuraAction'
import { DailyRoutineAction } from '@/domain/entities/actions/DailyRoutineAction'
import { ReloadAction } from '@/domain/entities/actions/ReloadAction'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import { StickyState } from '@/domain/entities/states/StickyState'

const scenario2StepKeys = [
  'battleStart',
  'playerTurn1Start',
  'playMasochisticAuraOnIronBloom',
  'playHeavenChainOnSlug',
  'playBattlePrep',
  'endPlayerTurn1',
  'playerTurn2Start',
  'playFlurryOnIronBloom',
  'playMasochisticAuraOnOrcLancer',
  'playFlurryOnOrcLancer',
  'playDailyRoutine',
  'endPlayerTurn2',
  'playerTurn3Start',
  'playReload',
  'playFlurryOnKamaitachi',
  'victory',
] as const

type Scenario2StepKey = (typeof scenario2StepKeys)[number]
export type Scenario2Steps = Record<Scenario2StepKey, number>

export interface Scenario2References {
  heavenChainIds: readonly [number, number, number, number]
  masochisticAuraIds: readonly [number, number]
  battlePrepId: number
  dailyRoutineId: number
  reloadId: number
  enemyIds: {
    orcLancer: number
    kamaitachi: number
    ironBloom: number
    slug: number
  }
}

export interface BattleScenario2 {
  createBattle: () => Battle
  replayer: ActionLogReplayer
  steps: Scenario2Steps
  references: Scenario2References
  operationLog: OperationLog
  turnDrawPlan: number[]
}

function finalizeScenario2Steps(partial: Partial<Scenario2Steps>): Scenario2Steps {
  const missing = scenario2StepKeys.filter((key) => partial[key] === undefined)
  if (missing.length > 0) {
    throw new Error(`Scenario2 steps are missing indices for: ${missing.join(', ')}`)
  }
  return partial as Scenario2Steps
}

export function requireCardId(card: Card | undefined): number {
  if (!card || card.id === undefined) {
    throw new Error('Card missing repository id')
  }
  return card.id
}

function createScenario2Battle(): Battle {
  const cardRepository = new CardRepository()
  const deckResult = buildScenario2Deck(cardRepository)

  const player = new ProtagonistPlayer()
  const enemyTeam = new IronBloomTeam()

  return new Battle({
    id: 'battle-scenario-2',
    cardRepository,
    player,
    enemyTeam,
    deck: new Deck(deckResult.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

function collectScenario2References(snapshot: BattleSnapshot): Scenario2References {
  const collectCardIdsByTitle = (title: string): number[] =>
    snapshot.deck.filter((card) => card.title === title).map((card) => requireCardId(card))

  const heavenChains = collectCardIdsByTitle('天の鎖')
  const masochisticAuras = collectCardIdsByTitle('被虐のオーラ')

  if (heavenChains.length < 4) {
    throw new Error('シナリオ2デッキに天の鎖が4枚ありません')
  }
  if (masochisticAuras.length < 2) {
    throw new Error('シナリオ2デッキに被虐のオーラが2枚ありません')
  }

  const findCardId = (title: string): number => {
    const card = snapshot.deck.find((candidate) => candidate.title === title)
    if (!card) {
      throw new Error(`カード ${title} がデッキに見つかりません`)
    }
    return requireCardId(card)
  }

  const findEnemyId = (name: string): number => {
    const enemy = snapshot.enemies.find((candidate) => candidate.name === name)
    if (!enemy) {
      throw new Error(`Enemy ${name} not found in scenario snapshot`)
    }
    return enemy.id
  }

  return {
    heavenChainIds: heavenChains.slice(0, 4) as [number, number, number, number],
    masochisticAuraIds: masochisticAuras.slice(0, 2) as [number, number],
    battlePrepId: findCardId('戦いの準備'),
    dailyRoutineId: findCardId('日課'),
    reloadId: findCardId('再装填'),
    enemyIds: {
      orcLancer: findEnemyId('オークランサー'),
      kamaitachi: findEnemyId('かまいたち'),
      ironBloom: findEnemyId('鉄花'),
      slug: findEnemyId('なめくじ'),
    },
  }
}

function findMemoryCardId(battle: Battle, title: string): number {
  const inHand = battle.hand
    .list()
    .find(
      (card) =>
        card.title === title &&
        (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory'),
    )

  if (inHand) {
    return requireCardId(inHand)
  }

  const fallback = battle.cardRepository.find(
    (card) =>
      card.title === title && (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory'),
  )

  if (!fallback) {
    throw new Error(`${title} の記憶カードが見つかりません`)
  }

  return requireCardId(fallback)
}

export function createBattleScenario2(): BattleScenario2 {
  const createBattle = () => createScenario2Battle()
  const sampleSnapshot = createBattle().getSnapshot()
  const references = collectScenario2References(sampleSnapshot)
  const operationLog = new OperationLog()
  const turnDrawPlan = [5, 2, 2, 2]
  const operationStepHints: Partial<Record<number, Scenario2StepKey>> = {}

  const registerOperation = (
    key: Scenario2StepKey | undefined,
    entry: Parameters<OperationLog['push']>[0],
  ) => {
    const opIndex = operationLog.push(entry)
    if (key) {
      operationStepHints[opIndex] = key
    }
  }

  registerOperation('playMasochisticAuraOnIronBloom', {
    type: 'play-card',
    card: references.masochisticAuraIds[0],
    operations: [{ type: 'target-enemy', payload: references.enemyIds.ironBloom }],
  })
  registerOperation('playHeavenChainOnSlug', {
    type: 'play-card',
    card: references.heavenChainIds[0],
    operations: [{ type: 'target-enemy', payload: references.enemyIds.slug }],
  })
  registerOperation('playBattlePrep', {
    type: 'play-card',
    card: references.battlePrepId,
  })
  registerOperation('endPlayerTurn1', { type: 'end-player-turn' })
  registerOperation('playFlurryOnIronBloom', {
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.ironBloom }],
  })
  registerOperation('playMasochisticAuraOnOrcLancer', {
    type: 'play-card',
    card: references.masochisticAuraIds[1],
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orcLancer }],
  })
  registerOperation('playFlurryOnOrcLancer', {
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orcLancer }],
  })
  registerOperation('playDailyRoutine', {
    type: 'play-card',
    card: references.dailyRoutineId,
  })
  registerOperation('endPlayerTurn2', { type: 'end-player-turn' })
  registerOperation('playReload', {
    type: 'play-card',
    card: references.reloadId,
  })
  registerOperation('playFlurryOnKamaitachi', {
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.kamaitachi }],
  })

  const recordedSteps: Partial<Scenario2Steps> = {}
  const recordStep = (key: Scenario2StepKey, index: number): void => {
    if (recordedSteps[key] === undefined) {
      recordedSteps[key] = index
    }
  }

  let startTurnCount = 0
  const operationReplayer = new OperationLogReplayer({
    createBattle,
    operationLog,
    turnDrawPlan,
    defaultDrawCount: turnDrawPlan[turnDrawPlan.length - 1] ?? 2,
    onEntryAppended: (entry, index) => {
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
  const steps = finalizeScenario2Steps(recordedSteps)

  return {
    createBattle,
    replayer: new ActionLogReplayer({
      createBattle,
      actionLog,
    }),
    steps,
    references,
    operationLog,
    turnDrawPlan,
  }
}


export {
  TailwindAction,
  FlurryAction,
  MucusShotAction,
  AcidSpitAction,
  HeavenChainAction,
  MasochisticAuraAction,
  DailyRoutineAction,
  ReloadAction,
  CorrosionState,
  StickyState,
}
