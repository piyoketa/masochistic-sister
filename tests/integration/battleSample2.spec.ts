import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'
import { buildScenario2Deck } from '@/domain/entities/decks'
import { IronBloomTeam } from '@/domain/entities/enemyTeams'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
import { ACTION_LOG_ENTRY_SEQUENCE as ACTION_LOG_EXPECTED_SEQUENCE_STAGE2 } from '../fixtures/battleSample2ExpectedActionLog'
import {
  buildOperationLog,
  summarizeActionLogEntry,
  type ActionLogEntrySummary,
  type AnimationBatchSummary,
  type OperationLogEntryConfig,
} from './utils/battleLogTestUtils'
import {
  collectCardIdsByTitle,
  findMemoryCardId,
  requireCardId,
  requireEnemyId,
} from './utils/scenarioEntityUtils'

const EXPECTED_ACTION_LOG_SUMMARY_STAGE2: ActionLogEntrySummary[] = [
  ...ACTION_LOG_EXPECTED_SEQUENCE_STAGE2,
]

const battleFactory = () => {
  const cardRepository = new CardRepository()
  const scenarioDeck = buildScenario2Deck(cardRepository)
  return new Battle({
    id: 'battle-scenario-2',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new IronBloomTeam(),
    deck: new Deck(scenarioDeck.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

const references = collectScenarioReferences(battleFactory().getSnapshot())
const operationEntries = buildOperationEntries(references)

const OPERATION_EXPECTATIONS = [
  { name: '被虐のオーラで鉄花の体液をかけるを誘発', lastActionIndex: 2 },
  { name: '天の鎖でなめくじの行動を拘束', lastActionIndex: 3 },
  { name: '戦いの準備で次ターンのマナを予約', lastActionIndex: 4 },
  { name: 'ターン終了 → 敵行動と次ターン開始', lastActionIndex: 11 },
  { name: '乱れ突き(記憶)で鉄花を攻撃', lastActionIndex: 12 },
  { name: '被虐のオーラでオークランサーに追い風', lastActionIndex: 13 },
  { name: '乱れ突きでオークランサーに連撃', lastActionIndex: 14 },
  { name: '日課で手札補充', lastActionIndex: 15 },
  { name: 'ターン終了2 → 敵行動第2セット', lastActionIndex: 23 },
  { name: '再装填で手札を更新', lastActionIndex: 24 },
  { name: '乱れ突きでかまいたち撃破＆臆病連鎖', lastActionIndex: 27 },
] as const

function warmupActionLog(logDetails: boolean): void {
  const fullOperationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
  const replayer = new OperationLogReplayer({
    createBattle: battleFactory,
    operationLog: fullOperationLog,
  })
  const { actionLog } = replayer.buildActionLog()
  if (!logDetails) {
    return
  }
  const summary = actionLog.toArray().map(summarizeActionLogEntry)
  // eslint-disable-next-line no-console
  console.log('BATTLE_SAMPLE2_ACTION_LOG_SUMMARY', JSON.stringify(summary, null, 2))
  operationEntries.forEach((_, index) => {
    const partialLog = buildOperationLog(operationEntries, index)
    const partialReplayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog: partialLog,
    })
    const { actionLog: partialActionLog } = partialReplayer.buildActionLog()
    // eslint-disable-next-line no-console
    console.log(
      'BATTLE_SAMPLE2_OPERATION',
      index + 1,
      'lastActionIndex',
      partialActionLog.toArray().length - 1,
    )
  })
}

warmupActionLog(process.env.LOG_BATTLE_SAMPLE2_SUMMARY === '1')

describe('シナリオ2: OperationLog → ActionLog + AnimationInstruction', () => {
  OPERATION_EXPECTATIONS.forEach(({ name, lastActionIndex }, operationIndex) => {
    it(`${operationIndex + 1}. ${name}`, () => {
      const operationLog = buildOperationLog(operationEntries, operationIndex)
      const replayer = new OperationLogReplayer({
        createBattle: battleFactory,
        operationLog,
      })
      const { actionLog } = replayer.buildActionLog()
      const actualSummary = actionLog.toArray().map(summarizeActionLogEntry)
      const actualComparable = actualSummary.slice(0, lastActionIndex + 1).map(normalizeEntryForComparison)
      const expectedComparable = EXPECTED_ACTION_LOG_SUMMARY_STAGE2.slice(0, lastActionIndex + 1).map(
        normalizeEntryForComparison,
      )
      expect(actualComparable).toEqual(expectedComparable)
    })
  })
})

function collectScenarioReferences(snapshot: Awaited<ReturnType<Battle['getSnapshot']>>) {
  const heavenChainIds = collectCardIdsByTitle(snapshot.deck, '天の鎖')
  const masochisticAuraIds = collectCardIdsByTitle(snapshot.deck, '被虐のオーラ')
  return {
    masochisticAuraIds: masochisticAuraIds.slice(0, 2) as [number, number],
    heavenChainIds: heavenChainIds.slice(0, 4) as [number, number, number, number],
    battlePrepId: requireCardId(snapshot.deck.find((card) => card.title === '戦いの準備')),
    dailyRoutineId: requireCardId(snapshot.deck.find((card) => card.title === '日課')),
    reloadId: requireCardId(snapshot.deck.find((card) => card.title === '再装填')),
    enemyIds: {
      ironBloom: requireEnemyId(snapshot.enemies, '鉄花'),
      slug: requireEnemyId(snapshot.enemies, 'なめくじ'),
      orcLancer: requireEnemyId(snapshot.enemies, 'オークランサー'),
      kamaitachi: requireEnemyId(snapshot.enemies, 'かまいたち'),
    },
  }
}

function buildOperationEntries(
  references: ReturnType<typeof collectScenarioReferences>,
): OperationLogEntryConfig[] {
  const entries: OperationLogEntryConfig[] = []
  entries.push({
    type: 'play-card',
    card: references.masochisticAuraIds[0],
    operations: [{ type: 'target-enemy', payload: references.enemyIds.ironBloom }],
  })
  entries.push({
    type: 'play-card',
    card: references.heavenChainIds[0],
    operations: [{ type: 'target-enemy', payload: references.enemyIds.slug }],
  })
  entries.push({
    type: 'play-card',
    card: references.battlePrepId,
  })
  entries.push({ type: 'end-player-turn' })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.ironBloom }],
  })
  entries.push({
    type: 'play-card',
    card: references.masochisticAuraIds[1],
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orcLancer }],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orcLancer }],
  })
  entries.push({
    type: 'play-card',
    card: references.dailyRoutineId,
  })
  entries.push({ type: 'end-player-turn' })
  entries.push({
    type: 'play-card',
    card: references.reloadId,
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.kamaitachi }],
  })
  return entries
}

function normalizeEntryForComparison(entry: ActionLogEntrySummary): ActionLogEntrySummary {
  const normalized: ActionLogEntrySummary = {
    type: entry.type,
  }
  if (entry.card !== undefined) {
    normalized.card = entry.card
  }
  if (entry.operations) {
    normalized.operations = entry.operations
  }
  if (entry.eventId) {
    normalized.eventId = entry.eventId
  }
  if (entry.animationBatches && entry.animationBatches.length > 0) {
    const mergedBatches = mergeMemoryCardOnlyBatches(entry.animationBatches)
    normalized.animationBatches = mergedBatches.map((batch) => ({
      batchId: batch.batchId,
      snapshot: undefined,
      patch: sanitizePatch(batch.patch),
      instructions: batch.instructions.map((instruction) => ({
        waitMs: instruction.waitMs,
        metadata: instruction.metadata,
      })),
    }))
  }
  if (entry.animations) {
    normalized.animations = entry.animations.map((instruction) => ({
      batchId: instruction.batchId,
      waitMs: instruction.waitMs,
      metadata: instruction.metadata,
      snapshot: undefined,
    }))
  }
  return normalized
}

function deepClone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function sanitizePatch<T>(patch: T | undefined): T | undefined {
  if (!patch) {
    return patch
  }
  const clone = deepClone(patch)
  const changes = (clone as { changes?: Record<string, unknown> }).changes
  if (changes && typeof changes === 'object') {
    delete changes.events
    delete changes.log
    if (changes.player && typeof changes.player === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (changes.player as any).relics
    }
  }
  return clone
}

function mergeMemoryCardOnlyBatches(
  batches: ActionLogEntrySummary['animationBatches'],
): AnimationBatchSummary[] {
  const normalized = batches ?? []
  if (normalized.length === 0) {
    return []
  }
  const merged: AnimationBatchSummary[] = []
  normalized.forEach((batch) => {
    const instructions = batch.instructions ?? []
    const isMemoryOnly =
      instructions.length > 0 && instructions.every((instruction) => readStage(instruction.metadata) === 'memory-card')
    if (isMemoryOnly && merged.length > 0) {
      const last = merged[merged.length - 1]!
      const lastInstructions = last.instructions ?? []
      // 旧remember-enemy-attackバッチをenemy-actionバッチへ統合して構造差分を吸収する
      last.instructions = [...lastInstructions, ...instructions.map((instruction) => ({ ...instruction }))]
    } else {
      merged.push({
        ...batch,
        instructions: instructions.map((instruction) => ({ ...instruction })),
      })
    }
  })
  return merged
}

function readStage(metadata: AnimationBatchSummary['instructions'][number]['metadata']): string | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined
  }
  if ('stage' in metadata) {
    return (metadata as { stage?: string }).stage
  }
  return undefined
}
