import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import BattleHandArea from '@/components/battle/BattleHandArea.vue'
import { Card } from '@/domain/entities/Card'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { HandSwapAction } from '@/domain/entities/actions/HandSwapAction'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { ViewManager } from '@/view/ViewManager'
import type { CardOperation } from '@/domain/entities/operations'
import type { StageEventPayload, StageEventMetadata } from '@/types/animation'

const actionCardStub = defineComponent({
  inheritAttrs: false,
  props: [
    'id',
    'title',
    'type',
    'cost',
    'illustration',
    'description',
    'descriptionSegments',
    'attackStyle',
    'primaryTags',
    'effectTags',
    'categoryTags',
    'operations',
    'affordable',
    'selected',
    'disabled',
    'damageAmount',
    'damageCount',
    'variant',
  ],
  emits: ['click'],
  template: `
    <div class="action-card-shell">
      <article class="action-card" :class="{ 'action-card--disabled': disabled }">
        <button class="action-card-stub" :disabled="disabled" @click="$emit('click')">
          {{ title }}
        </button>
      </article>
    </div>
  `,
})

function createSnapshot(hand: Card[]): BattleSnapshot {
  return {
    id: 'battle',
    player: {
      id: 'player',
      name: 'プレイヤー',
      currentHp: 30,
      maxHp: 40,
      currentMana: 5,
      maxMana: 5,
    },
    enemies: [],
    deck: [],
    hand,
    discardPile: [],
    exilePile: [],
    events: [],
    turn: {
      turnCount: 1,
      activeSide: 'player',
      phase: 'player-draw',
    },
    log: [],
    status: 'in-progress',
  }
}

function createBattleStub(hand: Card[]): {
  player: { id: string; name: string }
  hand: { list: () => Card[]; maxSize: () => number }
  enemyTeam: { members: [] }
} {
  return {
    player: { id: 'player', name: 'プレイヤー' },
    hand: {
      list: () => [...hand],
      maxSize: () => 10,
    },
    enemyTeam: { members: [] },
  }
}

function createViewManagerStub(battle?: ReturnType<typeof createBattleStub>): ViewManager {
  return {
    battle,
  } as unknown as ViewManager
}

function createStageEvent(metadata: StageEventMetadata): StageEventPayload {
  return {
    entryType: 'player-event',
    batchId: `batch-${Math.random()}`,
    issuedAt: Date.now(),
    metadata,
  }
}

describe('BattleHandArea コンポーネント', () => {
  it('手札がない場合に空メッセージを表示する', () => {
    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(createBattleStub([])),
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

    expect(wrapper.text()).toContain('手札は空です')
  })

  it('操作不要のカードをクリックすると即座にplay-cardをemitする', async () => {
    const simpleCard = new Card({ action: new BattlePrepAction() })
    simpleCard.assignId(1)

    const requestEnemyTarget = vi.fn<() => Promise<number>>(async () => 0)

    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([simpleCard]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(createBattleStub([simpleCard])),
        requestEnemyTarget,
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

  await wrapper.get('.action-card-stub').trigger('click')
  await flushPromises()

    const emitted = wrapper.emitted('play-card')
    expect(emitted).toHaveLength(1)
    expect((emitted?.[0]?.[0] as { cardId: number; operations: CardOperation[] }).cardId).toBe(1)
    expect(requestEnemyTarget).not.toHaveBeenCalled()
  })

  it('card-eliminate stage で砂化アニメーション用クラスが付与される', async () => {
    const eliminateCard = new Card({ action: new HeavenChainAction() })
    eliminateCard.assignId(77)

    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([eliminateCard]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(createBattleStub([eliminateCard])),
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

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })

    const eliminateCardId = eliminateCard.id ?? -1
    await wrapper.setProps({
      stageEvent: createStageEvent({ stage: 'card-eliminate', cardIds: [eliminateCardId] }),
    })
    await flushPromises()

    const overlay = wrapper.find('.hand-eliminate-overlay')
    expect(overlay.exists()).toBe(true)
    expect(overlay.classes()).toContain('hand-eliminate-overlay--active')

    rafSpy.mockRestore()
  })

  it('敵ターゲットが必要なカードではrequestEnemyTargetを経由する', async () => {
    const targetCard = new Card({ action: new HeavenChainAction() })
    targetCard.assignId(42)

    const requestEnemyTarget = vi.fn<() => Promise<number>>(() => Promise.resolve(999))
    const cancelEnemySelection = vi.fn()

    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([targetCard]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(createBattleStub([targetCard])),
        requestEnemyTarget,
        cancelEnemySelection,
        stageEvent: null,
      },
      global: {
        stubs: {
          ActionCard: actionCardStub,
          TransitionGroup: false,
        },
      },
    })

    await wrapper.get('.action-card-stub').trigger('click')
    await flushPromises()

    expect(requestEnemyTarget).toHaveBeenCalledTimes(1)
    const emitted = wrapper.emitted('play-card')
    expect(emitted).toHaveLength(1)
    const payload = emitted?.[0]?.[0] as { cardId: number; operations: CardOperation[] }
    expect(payload.cardId).toBe(42)
    expect(payload.operations).toEqual([{ type: 'target-enemy', payload: 999 }])
    expect(cancelEnemySelection).not.toHaveBeenCalled()
  })

  it('select-hand-card オペレーションで候補カードを選択できる', async () => {
    const selectorCard = new Card({ action: new HandSwapAction() })
    selectorCard.assignId(101)
    const targetCard = new Card({ action: new BattlePrepAction() })
    targetCard.assignId(202)
    const snapshot = createSnapshot([selectorCard, targetCard])
    const battleStub = createBattleStub(snapshot.hand)

    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot,
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(battleStub),
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

    const cardButtons = wrapper.findAll('.action-card-stub')
    const firstCard = cardButtons.at(0)
    expect(firstCard).toBeDefined()
    await firstCard!.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('play-card')).toBeUndefined()

    const secondCard = cardButtons.at(1)
    expect(secondCard).toBeDefined()
    await secondCard!.trigger('click')
    await flushPromises()

    const emitted = wrapper.emitted('play-card')
    expect(emitted).toHaveLength(1)
    const payload = emitted?.[0]?.[0] as { cardId: number; operations: CardOperation[] }
    expect(payload.cardId).toBe(101)
    expect(payload.operations).toEqual([{ type: 'select-hand-card', payload: 202 }])
  })

  it('deck-draw stage eventで手札満杯オーバーレイを表示する', async () => {
    vi.useFakeTimers()
    const card = new Card({ action: new BattlePrepAction() })
    card.assignId(5)
    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([card]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(),
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

    await wrapper.setProps({
      stageEvent: {
        entryType: 'start-player-turn',
        batchId: 'card-move:test',
        metadata: { stage: 'deck-draw', cardIds: [card.id ?? 0], handOverflow: true },
        issuedAt: Date.now(),
      },
    })
    await flushPromises()
    expect(wrapper.find('.hand-overlay').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(1500)
    await flushPromises()
    expect(wrapper.find('.hand-overlay').exists()).toBe(false)
    vi.useRealTimers()
  })

  it('deck-draw ステージで追加されたカードが即座に手札へ表示される', async () => {
    const drawnCard = new Card({ action: new BattlePrepAction() })
    const drawnCardId = 77
    drawnCard.assignId(drawnCardId)
    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(createBattleStub([])),
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

    const flushAll = async () => {
      await flushPromises()
      await wrapper.vm.$nextTick()
    }

    await wrapper.setProps({
      stageEvent: createStageEvent({ stage: 'deck-draw', cardIds: [drawnCardId] }),
    })
    await flushAll()

    await wrapper.setProps({
      snapshot: createSnapshot([drawnCard]),
      viewManager: createViewManagerStub(createBattleStub([drawnCard])),
    })
    await flushAll()

    const handWrapper = wrapper.find('.hand-card-wrapper')
    expect(handWrapper.exists()).toBe(true)
    expect(handWrapper.classes()).not.toContain('hand-card-wrapper--hidden')
  })

  it('card-create ステージでカードが即座に手札へ追加される', async () => {
    vi.useFakeTimers()
    const newCard = new Card({ action: new BattlePrepAction() })
    newCard.assignId(555)

    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(createBattleStub([])),
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

    const flushAll = async () => {
      await flushPromises()
      await wrapper.vm.$nextTick()
    }

    await wrapper.setProps({
      stageEvent: createStageEvent({ stage: 'card-create', cardIds: [555] }),
    })
    await flushAll()

    await wrapper.setProps({
      snapshot: createSnapshot([newCard]),
      viewManager: createViewManagerStub(createBattleStub([newCard])),
    })
    await flushAll()

    const handWrapper = wrapper.find('.hand-card-wrapper')
    expect(handWrapper.exists()).toBe(true)
    expect(handWrapper.classes()).not.toContain('hand-card-wrapper--hidden')
    expect(handWrapper.classes()).not.toContain('hand-card-wrapper--recent')
    expect(handWrapper.classes()).toContain('hand-card-wrapper--create')

    await vi.advanceTimersByTimeAsync(2000)
    await flushAll()
    expect(handWrapper.classes()).not.toContain('hand-card-wrapper--create')
    vi.useRealTimers()
  })

  it('被虐のオーラ経由で敵の記憶カードが生成された場合でもcard-createアニメーションが発火する', async () => {
    vi.useFakeTimers()
    const auraCard = new Card({ action: new BattlePrepAction() })
    auraCard.assignId(1)
    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([auraCard]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(createBattleStub([auraCard])),
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

    const flushAll = async () => {
      await flushPromises()
      await wrapper.vm.$nextTick()
    }

    const memoryCardId = 999
    await wrapper.setProps({
      stageEvent: {
        entryType: 'enemy-act',
        batchId: 'enemy-act:create',
        issuedAt: Date.now(),
        metadata: {
          stage: 'card-create',
          cardIds: [memoryCardId],
          cardTitles: ['たいあたり'],
          cardCount: 1,
          durationMs: 1500,
        },
      },
    })
    await flushAll()

    const memoryCard = new Card({ action: new BattlePrepAction() })
    memoryCard.assignId(memoryCardId)
    await wrapper.setProps({
      snapshot: createSnapshot([auraCard, memoryCard]),
      viewManager: createViewManagerStub(createBattleStub([auraCard, memoryCard])),
    })
    await flushAll()

    const wrappers = wrapper.findAll('.hand-card-wrapper')
    const createdWrapper = wrappers.at(-1)
    expect(createdWrapper).toBeDefined()
    expect(createdWrapper!.classes()).toContain('hand-card-wrapper--create')

    await vi.advanceTimersByTimeAsync(2000)
    await flushAll()
    expect(createdWrapper!.classes()).not.toContain('hand-card-wrapper--create')
    vi.useRealTimers()
  })
})
