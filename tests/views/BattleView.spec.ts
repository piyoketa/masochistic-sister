import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, reactive } from 'vue'
import BattleView from '@/views/BattleView.vue'
import type { ViewManager, AnimationCommand, AnimationScript } from '@/view/ViewManager'
import type { Battle } from '@/domain/battle/Battle'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { CardOperation } from '@/domain/entities/operations'

const BattleEnemyAreaStub = defineComponent({
  props: [
    'snapshot',
    'battle',
    'isInitializing',
    'errorMessage',
    'isSelectingEnemy',
    'hoveredEnemyId',
  ],
  emits: ['hover-start', 'hover-end', 'enemy-click', 'cancel-selection'],
  template: '<div class="enemy-area-stub" />',
})

const BattleHandAreaStub = defineComponent({
  props: [
    'snapshot',
    'hoveredEnemyId',
    'isInitializing',
    'errorMessage',
    'isPlayerTurn',
    'isInputLocked',
    'viewManager',
    'requestEnemyTarget',
    'cancelEnemySelection',
  ],
  emits: ['play-card', 'update-footer', 'reset-footer', 'error', 'hide-overlay'],
  template: `
    <div class="hand-area-stub">
      <button class="emit-play" @click="$emit('play-card', { cardId: 77, operations: [] })">
        play
      </button>
    </div>
  `,
})

const GameLayoutStub = defineComponent({
  template: '<div><slot name="window" /></div>',
})

const HpGaugeStub = defineComponent({
  props: ['current', 'max'],
  template: '<div class="hp-gauge-stub" />',
})

function createSnapshot(): BattleSnapshot {
  return {
    id: 'battle',
    player: {
      id: 'player',
      name: 'プレイヤー',
      currentHp: 30,
      maxHp: 40,
      currentMana: 3,
      maxMana: 3,
    },
    enemies: [],
    deck: [],
    hand: [],
    discardPile: [],
    exilePile: [],
    events: [],
    turn: {
      turnCount: 1,
      activeSide: 'player',
    },
    log: [],
  }
}

function createBattleStub(): Battle {
  return {
    enemyTeam: {
      findEnemy: vi.fn(),
    },
    player: {
      getStates: vi.fn(() => []),
    },
  } as unknown as Battle
}

describe('BattleView コンポーネント', () => {
  let queuePlayerAction: ReturnType<typeof vi.fn>
  let viewManagerStub: ViewManager

  beforeEach(() => {
    queuePlayerAction = vi.fn()
    const state = reactive({
      snapshot: createSnapshot(),
      previousSnapshot: undefined,
      lastResolvedEntry: undefined,
      actionLogLength: 0,
      executedIndex: 0,
      playback: {
        status: 'idle' as const,
        speed: 1,
        autoPlay: false,
        queue: [] as AnimationScript[],
        current: undefined,
      },
      input: {
        locked: false,
        queued: [] as unknown[],
      },
    })

    viewManagerStub = {
      state,
      battle: createBattleStub(),
      subscribe: vi.fn(() => () => {}),
      initialize: vi.fn(async () => {}),
      queuePlayerAction: queuePlayerAction as (input: { type: 'play-card'; cardId: number; operations?: CardOperation[] }) => void,
      canRetry: vi.fn(() => true),
      canUndo: vi.fn(() => false),
      hasUndoableAction: vi.fn(() => false),
      resetToInitialState: vi.fn(),
      undoLastPlayerAction: vi.fn(() => true),
      applyAnimationCommand: vi.fn((_: AnimationCommand) => {}),
      completeCurrentAnimation: vi.fn(() => {}),
    } as unknown as ViewManager
  })

  it('手札エリアからのplay-cardイベントでViewManagerへ指示を送る', async () => {
    const wrapper = mount(BattleView, {
      props: {
        viewManager: viewManagerStub,
      },
      global: {
        stubs: {
          BattleEnemyArea: BattleEnemyAreaStub,
          BattleHandArea: BattleHandAreaStub,
          GameLayout: GameLayoutStub,
          HpGauge: HpGaugeStub,
          TransitionGroup: false,
        },
      },
    })

    await flushPromises()

    await wrapper.get('.emit-play').trigger('click')
    await flushPromises()

    expect(queuePlayerAction).toHaveBeenCalledTimes(1)
    expect(queuePlayerAction).toHaveBeenCalledWith({ type: 'play-card', cardId: 77, operations: [] })
  })
})
