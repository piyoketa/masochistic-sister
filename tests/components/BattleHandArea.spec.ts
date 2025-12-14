import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BattleHandArea from '@/components/battle/BattleHandArea.vue'
import { Card } from '@/domain/entities/Card'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { HandSwapAction } from '@/domain/entities/actions/HandSwapAction'
import type { ViewManager } from '@/view/ViewManager'
import type { CardOperation } from '@/domain/entities/operations'
import {
  actionCardStub,
  createSnapshot,
  createBattleStub,
  createViewManagerStub,
} from './__helpers__/battleHandTestUtils'
import { createActivatedTestingPinia } from './__helpers__/pinia'

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
        plugins: [createActivatedTestingPinia()],
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
        plugins: [createActivatedTestingPinia()],
      },
    })

    await wrapper.get('.action-card-stub').trigger('click')
    await flushPromises()

    const emitted = wrapper.emitted('play-card')
    expect(emitted).toHaveLength(1)
    expect((emitted?.[0]?.[0] as { cardId: number; operations: CardOperation[] }).cardId).toBe(1)
    expect(requestEnemyTarget).not.toHaveBeenCalled()
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
        plugins: [createActivatedTestingPinia()],
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
        plugins: [createActivatedTestingPinia()],
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
})
