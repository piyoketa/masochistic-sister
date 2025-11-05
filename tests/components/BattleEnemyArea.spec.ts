import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import BattleEnemyArea from '@/components/battle/BattleEnemyArea.vue'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { Battle } from '@/domain/battle/Battle'

const enemyCardStub = defineComponent({
  props: ['enemy', 'selectable', 'hovered', 'selected'],
  emits: ['hover-start', 'hover-end', 'click', 'contextmenu'],
  template: `
    <div
      class="enemy-card-stub"
      @mouseenter="$emit('hover-start', enemy.id)"
      @mouseleave="$emit('hover-end', enemy.id)"
      @click="$emit('click', enemy)"
      @contextmenu.prevent="$emit('contextmenu', $event)"
    >
      {{ enemy.name }}
    </div>
  `,
})

function createSnapshot(withEnemy = false): BattleSnapshot | undefined {
  if (!withEnemy) {
    return undefined
  }

  return {
    id: 'battle-test',
    player: {
      id: 'player',
      name: 'プレイヤー',
      currentHp: 30,
      maxHp: 40,
      currentMana: 3,
      maxMana: 3,
    },
    enemies: [
      {
        id: 1,
        name: 'オーク',
        currentHp: 10,
        maxHp: 10,
        traits: [],
        states: [],
        hasActedThisTurn: false,
      },
    ],
    deck: [],
    hand: [],
    discardPile: [],
    exilePile: [],
    events: [],
    turn: {
      turnCount: 1,
      activeSide: 'player',
      phase: 'player-draw',
    },
    log: [],
  }
}

function createBattleStub(): Battle {
  const enemyEntity = {
    id: 1,
    name: 'オーク',
    image: '/assets/enemies/orc.jpg',
    actions: [],
    queuedActions: [],
    getStates: () => [],
    hasActedThisTurn: false,
  }

  return {
    enemyTeam: {
      findEnemy: vi.fn(() => enemyEntity),
    },
    player: {
      getStates: vi.fn(() => []),
    },
  } as unknown as Battle
}

describe('BattleEnemyArea コンポーネント', () => {
  it('読み込み中メッセージを表示する', () => {
    const wrapper = mount(BattleEnemyArea, {
      props: {
        snapshot: createSnapshot(false),
        battle: undefined,
        isInitializing: true,
        errorMessage: null,
        isSelectingEnemy: false,
        hoveredEnemyId: null,
      },
      global: {
        stubs: {
          EnemyCard: enemyCardStub,
          TransitionGroup: false,
        },
      },
    })

    expect(wrapper.text()).toContain('読み込み中...')
  })

  it('敵カード操作のイベントを発火する', () => {
    const wrapper = mount(BattleEnemyArea, {
      props: {
        snapshot: createSnapshot(true),
        battle: createBattleStub(),
        isInitializing: false,
        errorMessage: null,
        isSelectingEnemy: true,
        hoveredEnemyId: null,
      },
      global: {
        stubs: {
          EnemyCard: enemyCardStub,
          TransitionGroup: false,
        },
      },
    })

    const card = wrapper.get('.enemy-card-stub')
    card.trigger('mouseenter')
    card.trigger('mouseleave')
    card.trigger('click')
    card.trigger('contextmenu')

    const hoverStart = wrapper.emitted('hover-start')
    const hoverEnd = wrapper.emitted('hover-end')
    const enemyClick = wrapper.emitted('enemy-click')
    const cancelSelection = wrapper.emitted('cancel-selection')

    expect(hoverStart?.[0]).toEqual([1])
    expect(hoverEnd?.[0]).toEqual([1])
    expect(enemyClick?.[0]?.[0]).toMatchObject({ id: 1, name: 'オーク' })
    expect(cancelSelection).toHaveLength(1)
  })
})
