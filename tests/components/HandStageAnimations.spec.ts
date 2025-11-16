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
  it('ACTION_LOG_ENTRY_02_START_PLAYER_TURN の deck-draw stage で描画されたカードがDOMに出現する', async () => {
    /**
     * - 対象エントリ: ACTION_LOG_ENTRY_02_START_PLAYER_TURN
     * - 対象stage: batch turn-start → instruction stage:'deck-draw', cardIds:[4,7]
     * - 期待: deck-draw StageEvent を受けると pendingDraw に予約され、snapshot へカードID 4/7 を反映した時に
     *         hand-card-wrapper が非表示クラス無しで描画される。
     * - 想定課題: StageEvent より先に snapshot が更新された場合は pendingDrawId が噛み合わず、描画直後に
     *            hand-card-wrapper--hidden が残存する恐れがある。
     */
    const wrapper = mountHandArea([])
    const deckDrawEvent = buildStageEventFromEntry(ACTION_LOG_ENTRY_02_START_PLAYER_TURN, 'deck-draw')
    await wrapper.setProps({ stageEvent: deckDrawEvent })
    await flushAll(wrapper)

    const drawnCards = [createNamedCard(4, '被虐のオーラ'), createNamedCard(7, '日課')]
    await wrapper.setProps({
      snapshot: createSnapshot(drawnCards),
      viewManager: createViewManagerStub(createBattleStub(drawnCards)),
    })
    await flushAll(wrapper)

    const wrappers = wrapper.findAll('.hand-card-wrapper')
    expect(wrappers).toHaveLength(2)
    wrappers.forEach((handWrapper) => {
      expect(handWrapper.classes()).not.toContain('hand-card-wrapper--hidden')
    })
  })

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

  it('ACTION_LOG_ENTRY_03_PLAY_CARD の card-trash stage で浮遊カードが生成される', async () => {
    /**
     * - 対象エントリ: ACTION_LOG_ENTRY_03_PLAY_CARD
     * - 対象stage: batch player-action, stage:'card-trash', cardIds:[4], cardTitles:['被虐のオーラ']
     * - 期待: hand-floating-layer に hand-floating-card--trash 要素が追加され、Active クラスが付与される。
     * - 想定課題: DOMRect 取得に失敗するとアニメーションを諦めるため、要素未描画状態で stage を受けると
     *            ghost が生成されない恐れがある。
     */
    const auraCard = createNamedCard(4, '被虐のオーラ')
    const wrapper = mountHandArea([auraCard])
    const trashEvent = buildStageEventFromEntry(ACTION_LOG_ENTRY_03_PLAY_CARD, 'card-trash')
    await wrapper.setProps({ stageEvent: trashEvent })
    await flushAll(wrapper)

    const floatingCard = wrapper.find('.hand-floating-card--trash')
    expect(floatingCard.exists()).toBe(true)
  })

  it('ACTION_LOG_ENTRY_24_PLAY_CARD の card-eliminate stage で砂化オーバーレイが展開される', async () => {
    /**
     * - 対象エントリ: ACTION_LOG_ENTRY_24_PLAY_CARD
     * - 対象stage: batch player-action, stage:'card-eliminate', cardIds:[8], cardTitles:['疼き']
     * - 期待: HandCardEliminateOverlay が生成され、`.hand-eliminate-overlay` が active 状態になる。
     * - 想定課題: handZone / discard 要素の Rect が取得できない場合 overlay が spawn できず、カード除外が
     *            画面フィードバック無しになる懸念がある。
     */
    const acheCard = createNamedCard(8, '疼き')
    const wrapper = mountHandArea([acheCard])
    const eliminateEvent = buildStageEventFromEntry(ACTION_LOG_ENTRY_24_PLAY_CARD, 'card-eliminate')
    await wrapper.setProps({ stageEvent: eliminateEvent })
    await flushAll(wrapper)

    await waitForAnimationFrame()
    const overlay = wrapper.find('.hand-eliminate-overlay')
    expect(overlay.exists()).toBe(true)
    expect(overlay.classes()).toContain('hand-eliminate-overlay--active')
  })

  it('ACTION_LOG_ENTRY_04_ENEMY_ACT の memory-card stage で生成カードが hand-card-wrapper--create を経由する', async () => {
    /**
     * - 対象エントリ: ACTION_LOG_ENTRY_04_ENEMY_ACT
     * - 対象stage: batch enemy-action / remember-enemy-attack, stage:'memory-card', cardIds:[10]
     * - 期待: StageEvent → snapshot 更新で cardId 10 が `hand-card-wrapper--create` を付与された状態で描画され、
     *         アニメーション完了後はクラスが除去される。
     * - 想定課題: batch snapshot を待たずに別の stage を処理すると pendingCreateQueue が上書きされ、
     *            実カードが create フラグ無しで表示される恐れあり。
     */
    vi.useFakeTimers()
    const auraCard = createNamedCard(4, '被虐のオーラ')
    const wrapper = mountHandArea([auraCard])
    const memoryEvent = buildStageEventFromEntry(ACTION_LOG_ENTRY_04_ENEMY_ACT, 'memory-card')
    await wrapper.setProps({ stageEvent: memoryEvent })
    await flushAll(wrapper)

    const memoryCardId = memoryEvent.metadata?.cardIds?.[0] ?? 10
    const memoryCardTitle = memoryEvent.metadata?.cardTitles?.[0] ?? '記憶'
    const memoryCard = createNamedCard(memoryCardId, memoryCardTitle)
    await wrapper.setProps({
      snapshot: createSnapshot([auraCard, memoryCard]),
      viewManager: createViewManagerStub(createBattleStub([auraCard, memoryCard])),
    })
    await flushAll(wrapper)

    const createdWrapper = wrapper.find(`[data-card-id="${memoryCardId}"]`)
    expect(createdWrapper.exists()).toBe(true)
    expect(createdWrapper.classes()).toContain('hand-card-wrapper--create')

    await vi.advanceTimersByTimeAsync(2000)
    await flushAll(wrapper)
    expect(createdWrapper.classes()).not.toContain('hand-card-wrapper--create')
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
