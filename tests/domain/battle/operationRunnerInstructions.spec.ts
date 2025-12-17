import { describe, it, expect } from 'vitest'

import { OperationLog } from '@/domain/battle/OperationLog'
import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'
import type { BattleActionLogEntry, AnimationInstruction } from '@/domain/battle/ActionLog'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import { createBattleSampleScenario } from '../../fixtures/battleSampleScenario'
import { createBattleScenario2 } from '../../fixtures/battleSampleScenario2'

function buildOperationLogSubset(source: OperationLog, indices: number[]): OperationLog {
  const entries = source.toArray()
  const picked = indices.map((index) => {
    const entry = entries[index]
    if (!entry) {
      throw new Error(`OperationLog entry not found at index ${index}`)
    }
    return entry
  })
  return new OperationLog(picked)
}

describe('OperationRunner ActionLog / wait metadata', () => {
  it('1ターン目のOperationLogから期待通りのActionLogシーケンスを生成する', () => {
    const scenario = createBattleSampleScenario()
    const subset = buildOperationLogSubset(scenario.operationLog, [0, 1, 2, 3])

    const replayer = new OperationLogReplayer({
      createBattle: scenario.createBattle,
      operationLog: subset,
    })

    const { actionLog } = replayer.buildActionLog()
    const actionTypes = actionLog.toArray().map((entry) => entry.type)

    expect(actionTypes.at(0)).toBe('battle-start')
    expect(actionTypes.at(1)).toBe('start-player-turn')
    expect(actionTypes).toContain('play-card')
    expect(actionTypes).toContain('end-player-turn')
    expect(actionTypes.filter((type) => type === 'enemy-act').length).toBeGreaterThan(0)

    const startEntries = actionLog
      .toArray()
      .filter(
        (entry): entry is Extract<BattleActionLogEntry, { type: 'start-player-turn' }> =>
          entry?.type === 'start-player-turn',
      )

    expect(startEntries).toHaveLength(2)
    startEntries.forEach((entry) => {
      expect(entry.draw).toBeDefined()
      expect(entry.draw).toBe(2)
    })

    const hasPlayerEvent = actionLog.toArray().some((entry) => entry.type === 'player-event')
    expect(hasPlayerEvent).toBe(true)
  })

  it('各ActionLogエントリ種別に応じたwaitメタデータを通知する', () => {
    const scenario = createBattleSampleScenario()
    const subset = buildOperationLogSubset(scenario.operationLog, [0, 1, 2, 3])

    const captured: Array<{ type: string; waitMs: number; groupId?: string }> = []

    const replayer = new OperationLogReplayer({
      createBattle: scenario.createBattle,
      operationLog: subset,
      onEntryAppended: (entry, context) => {
        captured.push({
          type: entry.type,
          waitMs: context.waitMs,
          groupId: context.groupId,
        })
      },
    })

    replayer.buildActionLog()

    const enemyActs = captured.filter((entry) => entry.type === 'enemy-act')
    expect(enemyActs.length).toBeGreaterThan(0)
    enemyActs.forEach((entry) => {
      expect(entry.waitMs).toBe(500)
      expect(entry.groupId).toMatch(/^enemy-act:/)
    })

    const playerEvents = captured.filter((entry) => entry.type === 'player-event')
    expect(playerEvents.length).toBeGreaterThan(0)
    playerEvents.forEach((entry) => {
      expect(entry.waitMs).toBe(200)
    })

    const zeroWaitTypes = ['battle-start', 'start-player-turn', 'play-card', 'end-player-turn']
    zeroWaitTypes.forEach((type) => {
      const entries = captured.filter((entry) => entry.type === type)
      expect(entries.length).toBeGreaterThan(0)
      entries.forEach((entry) => {
        expect(entry.waitMs).toBe(0)
      })
    })
  })
})

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
