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
import { buildTestDeck } from '@/domain/entities/decks'
import { TestEnemyTeam } from '@/domain/entities/enemyTeams'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
import { requireEnemyId } from './utils/scenarioEntityUtils'
import {
  buildOperationLog,
  type OperationLogEntryConfig,
} from './utils/battleLogTestUtils'

const battleFactory = () => {
  const cardRepository = new CardRepository()
  const deckPreset = buildTestDeck(cardRepository)
  return new Battle({
    id: 'battle-1',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new TestEnemyTeam(),
    deck: new Deck(deckPreset.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

const references = collectScenarioReferences(battleFactory().getSnapshot())
const operationEntries: OperationLogEntryConfig[] = [{ type: 'end-player-turn' }]

describe('敵行動予測のSnapshot固定', () => {
  it('ターン1開始時点でオークの予測が「殴打」になる', () => {
    const entries = buildActionLogEntries(-1)
    const startTurnEntries = entries.filter((entry) => entry.type === 'start-player-turn')
    expect(startTurnEntries.length).toBeGreaterThan(0)
    const firstTurnAnimations = flattenEntryAnimations(startTurnEntries[0])
    const firstTurnSnapshot = firstTurnAnimations[0]?.snapshot
    expect(extractNextActionTitles(firstTurnSnapshot, references.enemyIds.orc)).toEqual([
      '殴打',
    ])
  })

  it('最初のターン終了後、かたつむりの行動中でもオークの予測は変化しない', () => {
    const entries = buildActionLogEntries(0)
    const endTurnIndex = entries.findIndex((entry) => entry.type === 'end-player-turn')
    expect(endTurnIndex).toBeGreaterThanOrEqual(0)
    const snailHighlightSnapshot = findEnemyHighlightSnapshotAfter(
      entries,
      references.enemyIds.snail,
      endTurnIndex,
    )
    expect(snailHighlightSnapshot).toBeDefined()
    expect(
      extractNextActionTitles(snailHighlightSnapshot, references.enemyIds.orc),
    ).toEqual(['殴打'])
  })

  it('かたつむりの行動完了後、ターン2開始でオークの予測が「ビルドアップ」に更新される', () => {
    const entries = buildActionLogEntries(0)
    const startTurnEntries = entries.filter((entry) => entry.type === 'start-player-turn')
    expect(startTurnEntries.length).toBeGreaterThanOrEqual(2)
    const secondTurnAnimations = flattenEntryAnimations(startTurnEntries[1])
    const secondTurnSnapshot = secondTurnAnimations[0]?.snapshot
    expect(extractNextActionTitles(secondTurnSnapshot, references.enemyIds.orc)).toEqual([
      'ビルドアップ',
    ])
  })
})

function buildActionLogEntries(lastOperationIndex: number) {
  const operationLog = buildOperationLog(operationEntries, lastOperationIndex)
  const replayer = new OperationLogReplayer({
    createBattle: battleFactory,
    operationLog,
  })
  const { actionLog } = replayer.buildActionLog()
  return actionLog.toArray()
}

function extractNextActionTitles(snapshot: BattleSnapshot | undefined, enemyId: number): string[] {
  if (!snapshot) {
    return []
  }
  const enemy = snapshot.enemies.find((candidate) => candidate.id === enemyId)
  if (!enemy) {
    return []
  }
  return (enemy.nextActions ?? []).map((action) => action.title)
}

function findEnemyHighlightSnapshotAfter(
  entries: ReturnType<typeof buildActionLogEntries>,
  enemyId: number,
  afterIndex: number,
): BattleSnapshot {
  for (let index = afterIndex + 1; index < entries.length; index += 1) {
    const entry = entries[index]
    if (!entry || entry.type !== 'enemy-act') {
      continue
    }
    const highlight = flattenEntryAnimations(entry).find(
      ({ instruction }) =>
        instruction.metadata?.stage === 'enemy-highlight' && instruction.metadata?.enemyId === enemyId,
    )
    if (highlight) {
      return highlight.snapshot
    }
  }
  throw new Error(`enemyId=${enemyId} のハイライトSnapshotが見つかりません`)
}

function flattenEntryAnimations(
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

function collectScenarioReferences(snapshot: Awaited<ReturnType<Battle['getSnapshot']>>) {
  return {
    enemyIds: {
      orc: requireEnemyId(snapshot.enemies, 'オーク'),
      orcDancer: requireEnemyId(snapshot.enemies, 'オークダンサー'),
      tentacle: requireEnemyId(snapshot.enemies, '触手'),
      snail: requireEnemyId(snapshot.enemies, 'かたつむり'),
    },
  }
}
