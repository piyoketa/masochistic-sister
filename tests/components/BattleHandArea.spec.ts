import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import BattleHandArea from '@/components/battle/BattleHandArea.vue'
import { Card } from '@/domain/entities/Card'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { ViewManager } from '@/view/ViewManager'
import type { CardOperation } from '@/domain/entities/operations'

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
    'cardTags',
    'operations',
    'affordable',
    'selected',
    'disabled',
  ],
  emits: ['click'],
  template: `
    <button class="action-card-stub" :disabled="disabled" @click="$emit('click')">
      {{ title }}
    </button>
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

function createViewManagerStub(): ViewManager {
  return {
    battle: undefined,
  } as unknown as ViewManager
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
        viewManager: createViewManagerStub(),
        requestEnemyTarget: vi.fn(),
        cancelEnemySelection: vi.fn(),
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

    const requestEnemyTarget = vi.fn<[], Promise<number>>()

    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([simpleCard]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(),
        requestEnemyTarget,
        cancelEnemySelection: vi.fn(),
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

  it('敵ターゲットが必要なカードではrequestEnemyTargetを経由する', async () => {
    const targetCard = new Card({ action: new HeavenChainAction() })
    targetCard.assignId(42)

    const requestEnemyTarget = vi.fn<[], Promise<number>>(() => Promise.resolve(999))
    const cancelEnemySelection = vi.fn()

    const wrapper = mount(BattleHandArea, {
      props: {
        snapshot: createSnapshot([targetCard]),
        hoveredEnemyId: null,
        isInitializing: false,
        errorMessage: null,
        isPlayerTurn: true,
        isInputLocked: false,
        viewManager: createViewManagerStub(),
        requestEnemyTarget,
        cancelEnemySelection,
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
})
