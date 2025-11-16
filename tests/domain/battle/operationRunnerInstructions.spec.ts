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

  it('乱れ突きのplay-cardエントリが3つのAnimationInstructionに分解される', () => {
    const scenario = createBattleScenario2()
    const entryIndex = scenario.steps.playFlurryOnIronBloom
    const actionLog = scenario.replayer.getActionLog()
    const entry = actionLog.at(entryIndex)

    expect(entry?.type).toBe('play-card')
    const animations = flattenEntryAnimations(entry)
    expect(animations).toBeDefined()
    expect(animations).toHaveLength(4)
    if (animations.length < 4) {
      throw new Error('play-card のアニメーション数が期待より少ないためテストを継続できません')
    }
    const ensureAnimation = <T>(value: T | undefined, label: string): T => {
      if (!value) {
        throw new Error(`${label} アニメーションが検証対象から欠落しています`)
      }
      return value
    }
    const cardTrashAnimation = ensureAnimation(animations[0], 'card-trash')
    const damageAnimation = ensureAnimation(animations[2], 'enemy-damage')
    const defeatAnimation = ensureAnimation(animations[3], 'defeat')
    expect(animations.map((payload) => payload.instruction.metadata?.stage)).toEqual([
      'card-trash',
      'mana',
      'enemy-damage',
      'defeat',
    ])
    expect(animations.map((payload) => payload.instruction.waitMs)).toEqual([0, 0, 800, 1000])

    const { battle } = scenario.replayer.run(entryIndex)
    const resolvedCardId = actionLog.resolveValue(
      (entry as Extract<typeof entry, { type: 'play-card' }>).card,
      battle,
    )

    const cardStillInHand = cardTrashAnimation.snapshot.hand.some((card) => card.id === resolvedCardId)
    expect(cardStillInHand).toBe(false)
    const cardInDiscard = cardTrashAnimation.snapshot.discardPile.some((card) => card.id === resolvedCardId)
    expect(cardInDiscard).toBe(true)

    const ironBloomId = scenario.references.enemyIds.ironBloom
    const damageStageEnemy = damageAnimation.snapshot.enemies.find((enemy) => enemy.id === ironBloomId)
    const defeatStageEnemy = defeatAnimation.snapshot.enemies.find((enemy) => enemy.id === ironBloomId)
    expect(damageStageEnemy?.status).not.toBe('defeated')
    expect(defeatStageEnemy?.status).toBe('defeated')

    const damageMetadata = damageAnimation.instruction.metadata ?? {}
    const damageOutcomes = Array.isArray(
      (damageMetadata as { damageOutcomes?: { damage: number }[] }).damageOutcomes,
    )
      ? ((damageMetadata as { damageOutcomes?: { damage: number; effectType: string }[] }).damageOutcomes ?? [])
      : []
    expect(damageOutcomes.length).toBe(5)
  })

  it('敵行動で状態／記憶カードアニメーションが発生する場合は手札差分とcardIdsが一致する', () => {
    const scenario = createBattleSampleScenario()
    const actionLog = scenario.replayer.getActionLog()
    const entries = actionLog.toArray()
    let lastAppliedSnapshot = scenario.createBattle().getSnapshot()
    let creationBaseline: BattleSnapshot | undefined
    const processedCreateIds = new Set<number>()

    entries.forEach((entry) => {
      const animations = flattenEntryAnimations(entry)
      animations.forEach(({ instruction, snapshot }) => {
        const metadata = instruction.metadata
        const isCreationStage = metadata?.stage === 'create-state-card' || metadata?.stage === 'memory-card'
        if (isCreationStage) {
          if (!creationBaseline) {
            creationBaseline = lastAppliedSnapshot
          }
          const metadataIds = Array.isArray(metadata?.cardIds) ? metadata.cardIds : []
          const baselineIds = collectSnapshotCardIds(creationBaseline)
          metadataIds.forEach((id) => {
            expect(baselineIds.has(id)).toBe(false)
            expect(processedCreateIds.has(id)).toBe(false)
            processedCreateIds.add(id)
          })
        } else {
          creationBaseline = undefined
          processedCreateIds.clear()
        }
        lastAppliedSnapshot = snapshot
      })
      if (animations.length === 0 && entry.postEntrySnapshot) {
        lastAppliedSnapshot = entry.postEntrySnapshot
      } else if (entry.postEntrySnapshot) {
        lastAppliedSnapshot = entry.postEntrySnapshot
      }
    })

    const flattenedEnemyAnimations = entries
      .filter((entry) => entry.type === 'enemy-act')
      .flatMap((entry) => flattenEntryAnimations(entry))
    expect(flattenedEnemyAnimations.some(({ instruction }) => instruction.metadata?.stage === 'create-state-card')).toBe(
      true,
    )
    expect(flattenedEnemyAnimations.some(({ instruction }) => instruction.metadata?.stage === 'memory-card')).toBe(true)
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
