import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { BattleActionLogEntry, AnimationInstruction } from '@/domain/battle/ActionLog'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'
import { ActionLogReplayer } from '@/domain/battle/ActionLogReplayer'
import { buildTestDeck } from '@/domain/entities/decks'
import { TestEnemyTeam } from '@/domain/entities/enemyTeams'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
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
  findStatusCardId,
  requireCardId,
  requireEnemyId,
} from './utils/scenarioEntityUtils'
import { buildEnemyActionHintsForView, formatEnemyActionChipsForView } from '@/view/enemyActionHintsForView'
import { useHandPresentation } from '@/components/battle/composables/useHandPresentation'
import type { ViewManager } from '@/view/ViewManager'

const battleFactory = () => {
  const cardRepository = new CardRepository()
  const defaultDeck = buildTestDeck(cardRepository)
  return new Battle({
    id: 'battle-1',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new TestEnemyTeam(),
    deck: new Deck(defaultDeck.deck),
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

const EXPECTED_ACTION_LOG_SUMMARY: ActionLogEntrySummary[] = buildExpectedActionLogSummary()

const OPERATION_EXPECTATIONS = [
  { name: '被虐のオーラでかたつむりの攻撃を即時発生', lastActionIndex: 3 },
  { name: '日課でデッキトップから2枚を補充', lastActionIndex: 4 },
  { name: '戦いの準備で次ターンのマナを予約', lastActionIndex: 5 },
  { name: 'ターン終了 → 敵行動と次ターン開始まで', lastActionIndex: 12 },
  { name: '殴打(記憶)でかたつむりへ反撃', lastActionIndex: 13 },
  { name: '溶かす(記憶)で触手へ腐食付与', lastActionIndex: 14 },
  { name: '体液をかける(記憶)で触手を撃破', lastActionIndex: 15 },
  { name: '腐食カードを使用', lastActionIndex: 16 },
  { name: 'ターン終了 → 敵行動第2セット', lastActionIndex: 20 },
  { name: '疼きで突き刺す(5×5)を選択', lastActionIndex: 21 },
  { name: '突き刺す(10×4)でオークを撃破', lastActionIndex: 22 },
  { name: '突き刺す(被弾記憶)連打で勝利', lastActionIndex: 24 },
] as const

if (process.env.LOG_BATTLE_SAMPLE1_SUMMARY === '1') {
  const fullOperationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
  const replayer = new OperationLogReplayer({
    createBattle: battleFactory,
    operationLog: fullOperationLog,
  })
  const { actionLog } = replayer.buildActionLog()
  const summary = actionLog.toArray().map(summarizeActionLogEntry)
  // eslint-disable-next-line no-console
  console.log('BATTLE_SAMPLE1_ACTION_LOG_SUMMARY', JSON.stringify(summary, null, 2))
  operationEntries.forEach((_, index) => {
    const partialLog = buildOperationLog(operationEntries, index)
    const partialReplayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog: partialLog,
    })
    const { actionLog: partialActionLog } = partialReplayer.buildActionLog()
    // eslint-disable-next-line no-console
    console.log(
      'BATTLE_SAMPLE1_OPERATION',
      index + 1,
      'lastActionIndex',
      partialActionLog.toArray().length - 1,
    )
  })
}

describe('シナリオ1: OperationLog → ActionLog + AnimationInstruction', () => {
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
      const expectedComparable = EXPECTED_ACTION_LOG_SUMMARY.slice(0, lastActionIndex + 1).map(
        normalizeEntryForComparison,
      )
      expect(actualComparable).toEqual(expectedComparable)
    })
  })

  it('敵行動で生成される状態／記憶カードアニメーションのcardIdsが手札差分と一致する', () => {
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()
    const entries = actionLog.toArray()
    let lastAppliedSnapshot = battleFactory().getSnapshot()
    let creationBaseline: BattleSnapshot | undefined
    const processedCreateIds = new Set<number>()

    entries.forEach((entry) => {
      const animationSnapshots = expandEntryAnimations(entry)
      animationSnapshots.forEach(({ instruction, snapshot }) => {
        const metadata = instruction.metadata
        const isCreationStage =
          metadata?.stage === 'create-state-card' || metadata?.stage === 'memory-card'
        if (isCreationStage) {
          if (!creationBaseline) {
            creationBaseline = lastAppliedSnapshot
          }
          const metadataIds = Array.isArray(metadata?.cardIds) ? metadata.cardIds : []
          const baselineIds = collectSnapshotCardIds(creationBaseline)
          metadataIds.forEach((id) => {
            if (baselineIds.has(id)) {
              return
            }
            expect(processedCreateIds.has(id)).toBe(false)
            processedCreateIds.add(id)
          })
        } else {
          creationBaseline = undefined
          processedCreateIds.clear()
        }
        lastAppliedSnapshot = snapshot
      })
      if (entry.postEntrySnapshot) {
        lastAppliedSnapshot = entry.postEntrySnapshot
      }
    })
  })

  it('lastActionIndex:13 時点の手札では腐食カードのタイトルにスタック点数が付く', () => {
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()
    const entries = actionLog.toArray()
    const targetEntry = entries[13]
    expect(targetEntry?.postEntrySnapshot).toBeTruthy()
    const snapshot = targetEntry?.postEntrySnapshot as BattleSnapshot

    const viewManagerStub = { battle: undefined } as unknown as ViewManager
    const { cardTitleMap } = useHandPresentation({
      props: {
        snapshot,
        hoveredEnemyId: null,
        viewManager: viewManagerStub,
      },
      interactionState: { selectedCardKey: null, isAwaitingEnemy: false },
    })

    const corrosionCard = snapshot.hand.find((card) => card.title === '腐食')
    expect(corrosionCard).toBeTruthy()
    const magnitude = corrosionCard?.state?.magnitude ?? 0
    const corrosionTitle = cardTitleMap.value.get(corrosionCard?.id as number)
    expect(corrosionTitle).toBe(`腐食(${magnitude}点)`)
  })

  it('lastActionIndex:3 時点でかたつむりの行動チップがacted扱いになる', () => {
    // 1つ目のOperation（被虐のオーラ）だけを適用し、行動ログから「かたつむりが行動済みになった」スナップショットを特定する。
    const operationLog = buildOperationLog(operationEntries, 0)
    const operationReplayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = operationReplayer.buildActionLog()

    const actionReplayer = new ActionLogReplayer({
      createBattle: battleFactory,
      actionLog,
    })
    const snailId = references.enemyIds.snail

    const targetIndex = actionLog
      .toArray()
      .findIndex((entry) =>
        entry.postEntrySnapshot?.enemies.some((enemy) => enemy.id === snailId && enemy.hasActedThisTurn),
      )

    expect(targetIndex).toBeGreaterThanOrEqual(0)

    const { battle } = actionReplayer.run(targetIndex)
    const snapshot = actionLog.at(targetIndex)?.postEntrySnapshot as BattleSnapshot

    const hintsMap = buildEnemyActionHintsForView({ battle, snapshot })
    const snailHints = hintsMap.get(snailId) ?? []
    const [chip] = formatEnemyActionChipsForView(snailId, snailHints)

    expect(chip?.acted).toBe(true)
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
    acheId: requireCardId(snapshot.deck.find((card) => card.title === '疼き')),
    enemyIds: {
      orc: requireEnemyId(snapshot.enemies, 'オーク'),
      orcDancer: requireEnemyId(snapshot.enemies, 'オークダンサー'),
      tentacle: requireEnemyId(snapshot.enemies, '触手'),
      snail: requireEnemyId(snapshot.enemies, 'かたつむり'),
    },
  }
}

function buildOperationEntries(references: ReturnType<typeof collectScenarioReferences>) {
  const entries: OperationLogEntryConfig[] = []
  entries.push({
    type: 'play-card',
    card: references.masochisticAuraIds[0],
    operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
  })
  entries.push({
    type: 'play-card',
    card: references.dailyRoutineId,
  })
  entries.push({
    type: 'play-card',
    card: references.battlePrepId,
  })
  entries.push({ type: 'end-player-turn' })
  entries.push({
    type: 'play-card',
    card: (battle: Battle) => findMemoryCardId(battle, '殴打'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '溶かす'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '体液をかける'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findStatusCardId(battle, '腐食'),
  })
  entries.push({ type: 'end-player-turn' })
  entries.push({
    type: 'play-card',
    card: references.acheId,
    operations: [
      {
        type: 'select-hand-card',
        payload: (battle: Battle) => findMemoryCardId(battle, '突き刺す'),
      },
    ],
  })
  entries.push({
    type: 'play-card',
    card: (battle: Battle) => findMemoryCardId(battle, '突き刺す'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orc }],
  })
  entries.push({
    type: 'play-card',
    card: (battle: Battle) => findMemoryCardId(battle, '突き刺す'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orcDancer }],
  })
  return entries
}

function collectSnapshotCardIds(snapshot?: BattleSnapshot): Set<number> {
  const ids = new Set<number>()
  const zones = [snapshot?.hand ?? [], snapshot?.discardPile ?? [], snapshot?.exilePile ?? []]
  zones.forEach((cards) => {
    cards
      .map((card) => card.id)
      .filter((id): id is number => typeof id === 'number')
      .forEach((id) => ids.add(id))
  })
  return ids
}

function expandEntryAnimations(
  entry: BattleActionLogEntry | undefined,
): Array<{ instruction: AnimationInstruction; snapshot: BattleSnapshot }> {
  if (!entry) {
    return []
  }
  const batches = entry.animationBatches ?? []
  return batches.flatMap((batch) =>
    (batch.instructions ?? []).map((instruction) => ({
      instruction,
      snapshot: batch.snapshot,
    })),
  )
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
    stripRuntimeFlags(changes, 'deck')
    stripRuntimeFlags(changes, 'hand')
    stripRuntimeFlags(changes, 'discardPile')
    stripRuntimeFlags(changes, 'exilePile')
  }
  return clone
}

function stripRuntimeFlags(
  changes: Record<string, unknown>,
  key: 'deck' | 'hand' | 'discardPile' | 'exilePile',
) {
  const zone = changes[key]
  if (!Array.isArray(zone)) {
    return
  }
  zone.forEach((card) => {
    if (card && typeof card === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (card as any).runtimeActive
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (card as any).runtimeCost
    }
  })
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
      // 旧remember-enemy-attackバッチをenemy-actionバッチへ吸収して差分を無視する
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

function buildExpectedActionLogSummary(): ActionLogEntrySummary[] {
  const fullOperationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
  const replayer = new OperationLogReplayer({
    createBattle: battleFactory,
    operationLog: fullOperationLog,
  })
  const { actionLog } = replayer.buildActionLog()
  return actionLog.toArray().map(summarizeActionLogEntry)
}
