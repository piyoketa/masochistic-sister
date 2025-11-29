import { defineComponent } from 'vue'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { Card } from '@/domain/entities/Card'
import type { ViewManager } from '@/view/ViewManager'
/**
 * BattleHandArea 周辺テストで共有するスタブ群。
 * - ActionCard を簡略表示する Vue コンポーネント
 * - Snapshot / ViewManager の軽量生成ユーティリティ
 */
export const actionCardStub = defineComponent({
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

export function createSnapshot(hand: Card[]): BattleSnapshot {
  return {
    id: 'battle',
    player: {
      id: 'player',
      name: 'プレイヤー',
      currentHp: 30,
      maxHp: 40,
      currentMana: 5,
      maxMana: 5,
      relics: [],
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

export function createBattleStub(hand: Card[]): {
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

export function createViewManagerStub(battle?: ReturnType<typeof createBattleStub>): ViewManager {
  return {
    battle,
  } as unknown as ViewManager
}
