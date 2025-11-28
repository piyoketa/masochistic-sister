import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BattleHandArea from '@/components/battle/BattleHandArea.vue'
import { Card } from '@/domain/entities/Card'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import type { StageEventMetadata, StageEventPayload } from '@/types/animation'
import {
  ACTION_LOG_ENTRY_02_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_03_PLAY_CARD,
  ACTION_LOG_ENTRY_04_ENEMY_ACT,
  ACTION_LOG_ENTRY_12_START_PLAYER_TURN,
  ACTION_LOG_ENTRY_24_PLAY_CARD,
} from '../fixtures/battleSampleExpectedActionLog'
import {
  actionCardStub,
  createSnapshot,
  createBattleStub,
  createViewManagerStub,
} from './__helpers__/battleHandTestUtils'

type StageName = StageEventMetadata['stage']

describe('BattleHandArea: Animation batches と手札演出の同期', () => {
  it('ACTION_LOG_ENTRY_12_START_PLAYER_TURN の deck-draw stage (handOverflow) で警告オーバーレイが表示される', async () => {
    /**
     * - 対象エントリ: ACTION_LOG_ENTRY_12_START_PLAYER_TURN
     * - 対象stage: stage:'deck-draw', cardIds:[5], handOverflow:true
     * - 期待: handOverflowOverlayMessage が即座に表示され、1200ms 後に自動消滅する。
     * - 想定課題: overlay が setTimeout 管理のため、テストやアプリで連続発火すると clearTimeout 漏れで
     *            表示が残留するリスクあり。
     */
    vi.useFakeTimers()
    const initialCards = [createNamedCard(1, '手札A')]
    const wrapper = mountHandArea(initialCards)
    const overflowEvent = buildStageEventFromEntry(
      ACTION_LOG_ENTRY_12_START_PLAYER_TURN,
      'deck-draw',
    )
    await wrapper.setProps({ stageEvent: overflowEvent })
    await flushAll(wrapper)
    expect(wrapper.find('.hand-overlay').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(1500)
    await flushAll(wrapper)
    expect(wrapper.find('.hand-overlay').exists()).toBe(false)
    vi.useRealTimers()
  })

})

function mountHandArea(handCards: Card[]) {
  return mount(BattleHandArea, {
    props: {
      snapshot: createSnapshot(handCards),
      hoveredEnemyId: null,
      isInitializing: false,
      errorMessage: null,
      isPlayerTurn: true,
      isInputLocked: false,
      viewManager: createViewManagerStub(createBattleStub(handCards)),
      requestEnemyTarget: vi.fn(),
      cancelEnemySelection: vi.fn(),
      stageEvent: null,
    },
    global: {
      stubs: {
        ActionCard: actionCardStub,
        TransitionGroup: false,
      },
    },
  })
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function createNamedCard(id: number, title: string): Card {
  const card = new Card({
    action: new BattlePrepAction(),
    definitionOverrides: {
      title,
    },
  })
  card.assignId(id)
  return card
}

function buildStageEventFromEntry(
  entry: { type: StageEventPayload['entryType']; animationBatches?: StageEventBatch[] },
  stage: StageName,
): StageEventPayload {
  for (const batch of entry.animationBatches ?? []) {
    for (const instruction of batch?.instructions ?? []) {
      if (instruction.metadata?.stage === stage) {
        return {
          entryType: entry.type,
          batchId: batch.batchId,
          issuedAt: Date.now(),
          metadata: deepClone(instruction.metadata),
        }
      }
    }
  }
  throw new Error(`stage ${stage} was not found in entry ${entry.type}`)
}

type StageEventBatch = {
  batchId: string
  instructions: Array<{
    metadata?: StageEventMetadata
  }>
}

async function flushAll(wrapper: ReturnType<typeof mountHandArea>): Promise<void> {
  await flushPromises()
  await wrapper.vm.$nextTick()
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
