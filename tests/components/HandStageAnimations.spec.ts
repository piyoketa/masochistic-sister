import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BattleHandArea from '@/components/battle/BattleHandArea.vue'
import { Card } from '@/domain/entities/Card'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import type { StageEventMetadata, StageEventPayload } from '@/types/animation'
import { ACTION_LOG_ENTRY_12_START_PLAYER_TURN } from '../fixtures/battleSampleExpectedActionLog'
import {
  actionCardStub,
  createSnapshot,
  createBattleStub,
  createViewManagerStub,
} from './__helpers__/battleHandTestUtils'

type StageName = StageEventMetadata['stage']

describe('BattleHandArea: 手札あふれオーバーレイ', () => {
  it('ACTION_LOG_ENTRY_12_START_PLAYER_TURN の deck-draw(handOverflow) で「手札が満杯です！」が表示される', async () => {
    const initialCards = [createNamedCard(1, '手札A')]
    const wrapper = mountHandArea(initialCards)
    const overflowEvent = buildStageEventFromEntry(
      ACTION_LOG_ENTRY_12_START_PLAYER_TURN,
      'deck-draw',
    )
    await wrapper.setProps({ stageEvent: overflowEvent })
    await flushAll(wrapper)

    const emitted = wrapper.emitted('error') ?? []
    const messages = emitted.flat().map((args) => args as unknown[]).flat()
    expect(messages.includes('手札が満杯です！')).toBe(true)
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
      requestEnemyTarget: () => {},
      cancelEnemySelection: () => {},
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
