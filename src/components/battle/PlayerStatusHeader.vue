<!--
Componentの責務: プレイヤーの基本情報（レリック・所持金・デッキ枚数）をヘッダーとして表示し、右側のアクションスロットを親から受け取る。
責務ではないこと: バトル状態やターン情報の表示、バトル進行の制御。表示データはstoreから取得し、BattleSnapshotには依存しない。
主な通信相手: 親コンポーネント（BattleView/FieldViewなど）。relic hover/clickイベントを親へ伝搬し、アクションボタン群はactionsスロットで注入する。
-->
<script setup lang="ts">
import { computed } from 'vue'
import RelicList from '@/components/RelicList.vue'
import { usePlayerStore } from '@/stores/playerStore'
import { mapClassNamesToDisplay, type RelicDisplayEntry } from '@/view/relicDisplayMapper'

const props = withDefaults(
  defineProps<{
    sticky?: boolean
    enableGlow?: boolean
  }>(),
  {
    enableGlow: true,
  },
)

const emit = defineEmits<{
  (event: 'relic-hover', relic: RelicDisplayEntry, ev: MouseEvent | FocusEvent): void
  (event: 'relic-leave'): void
  (event: 'relic-click', relic: RelicDisplayEntry): void
  (event: 'deck-click'): void
}>()

const playerStore = usePlayerStore()
playerStore.ensureInitialized()

const playerRelics = computed<RelicDisplayEntry[]>(() => mapClassNamesToDisplay(playerStore.relics))
const playerStatus = computed(() => ({
  gold: playerStore.gold,
  deckCount: playerStore.deck.length,
}))
</script>

<template>
  <header class="player-header" :class="{ 'player-header--sticky': sticky !== false }">
    <div class="header-relics">
      <span class="relic-label">レリック</span>
      <RelicList
        class="relic-icon-list"
        :relics="playerRelics"
        :enable-glow="props.enableGlow"
        @hover="(relic: RelicDisplayEntry, ev: MouseEvent | FocusEvent) => emit('relic-hover', relic, ev)"
        @leave="emit('relic-leave')"
        @click="(relic: RelicDisplayEntry) => emit('relic-click', relic)"
      />
    </div>
    <div class="header-player">
      <div class="player-info">
        <span class="player-info__item">所持金: {{ playerStatus.gold }}</span>
        <button class="player-info__item player-info__item--link" type="button" @click="emit('deck-click')">
          デッキ: {{ playerStatus.deckCount }}枚
        </button>
      </div>
    </div>
    <div class="header-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.player-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
  height: 56px;
  background: linear-gradient(90deg, rgba(120, 97, 190, 0.22), rgba(70, 69, 122, 0.35));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
  z-index: 900;
}

.player-header--sticky {
  position: sticky;
  top: 0;
}

.header-relics {
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.relic-icon-list {
  display: flex;
  gap: 4px;
}

.relic-label {
  opacity: 0.65;
}

.header-player {
  flex: 1;
  display: flex;
  align-items: center;
}

.player-info {
  display: flex;
  gap: 14px;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.player-info__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.player-info__item--link {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.9);
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  letter-spacing: 0.04em;
  transition: background 120ms ease, border-color 120ms ease;
}

.player-info__item--link:hover,
.player-info__item--link:focus-visible {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.5);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
