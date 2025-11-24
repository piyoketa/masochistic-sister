<!--
BattleHandArea の責務:
- 戦闘スナップショットをもとに手札カードを描画し、カード選択〜使用までのインタラクションを管理する。
- 敵ターゲットを要求するカード操作では、親コンポーネントへ非同期に対象取得を依頼する。
- 手札表示に必要な説明文・タグ情報など UI 向けデータを整形する。

責務ではないこと:
- ViewManager へのカード使用リクエスト送信、敵エリアの選択状態管理は行わず、emit で親へ委譲する。
- 戦闘の進行状態（ターン管理やログ更新）の制御は担当しない。

主な通信相手とインターフェース:
- BattleView（親）: props で Snapshot や入力ロック状態、target 選択用の関数を受取り、`play-card` / `update-footer` / `reset-footer` / `error` / `hide-overlay` を emit。
  フッターメッセージ更新などの UI 全体制御を親へ委譲する。
- ActionCard: 各カードのレンダリングを担当する既存コンポーネント。`CardInfo` と操作情報を渡し、クリックイベントで選択を検知する。
-->
<script setup lang="ts">
import { computed, reactive, ref, onBeforeUnmount, watch } from 'vue'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import ActionCard from '@/components/ActionCard.vue'
import type {
  CardOperation,
  TargetEnemyAvailabilityEntry,
} from '@/domain/entities/operations'
import type { ViewManager } from '@/view/ViewManager'
import type { StageEventPayload } from '@/types/animation'
import { useHandPresentation, type HandEntry } from './composables/useHandPresentation'
import { useHandInteraction } from './composables/useHandInteraction'
import { useHandAnimations } from './composables/useHandAnimations'
import { useHandStageEvents } from './composables/useHandStageEvents'
import type { EnemySelectionTheme } from '@/types/selectionTheme'

const props = defineProps<{
  snapshot: BattleSnapshot | undefined
  hoveredEnemyId: number | null
  isInitializing: boolean
  isPlayerTurn: boolean
  isInputLocked: boolean
  viewManager: ViewManager
  requestEnemyTarget: (theme: EnemySelectionTheme) => Promise<number>
  cancelEnemySelection: () => void
  stageEvent: StageEventPayload | null
}>()

const emit = defineEmits<{
  (event: 'play-card', payload: { cardId: number; operations: CardOperation[] }): void
  (event: 'update-footer', message: string): void
  (event: 'reset-footer'): void
  (event: 'error', message: string): void
  (event: 'hide-overlay'): void
  (event: 'show-enemy-selection-hints', hints: TargetEnemyAvailabilityEntry[]): void
  (event: 'clear-enemy-selection-hints'): void
}>()

const interactionState = reactive<{
  selectedCardKey: string | null
  selectedCardId: number | null
  isAwaitingEnemy: boolean
  selectionTheme: EnemySelectionTheme
}>({
  selectedCardKey: null,
  selectedCardId: null,
  isAwaitingEnemy: false,
  selectionTheme: 'default',
})

const handZoneRef = ref<HTMLElement | null>(null)
const deckCounterRef = ref<HTMLElement | null>(null)
const discardCounterRef = ref<HTMLElement | null>(null)

const {
  handEntries,
  cardTitleMap,
  buildOperationContext,
  findHandEntryByCardId,
} = useHandPresentation({
  props,
  interactionState,
})
const hasCards = computed(() => handEntries.value.length > 0)
const handCount = computed(() => props.snapshot?.hand.length ?? 0)
const handLimit = computed(() => props.viewManager.battle?.hand.maxSize() ?? 10)
const deckCount = computed(() => props.snapshot?.deck.length ?? 0)
const discardCount = computed(() => props.snapshot?.discardPile.length ?? 0)

const {
  floatingCards,
  isCardHidden,
  isCardVisible,
  registerCardElement,
  startDeckDrawAnimation,
  startCardCreateAnimation,
  startCardRemovalAnimation,
  cleanup: cleanupAnimations,
  markCardsVisible,
  isCardInCreateAnimation,
} = useHandAnimations({
  handZoneRef,
  deckCounterRef,
  discardCounterRef,
  findHandEntryByCardId,
})
markCardsVisible(
  handEntries.value
    .map((entry) => entry.id)
    .filter((id): id is number => typeof id === 'number'),
)

watch(
  () =>
    handEntries.value
      .map((entry) => entry.id)
      .filter((id): id is number => typeof id === 'number'),
  (ids) => markCardsVisible(ids),
)

const { dispose: disposeStageEvents } = useHandStageEvents({
  stageEvent: () => props.stageEvent,
  snapshot: () => props.snapshot,
  cardTitleMap,
  findHandEntryByCardId,
  startDeckDrawAnimation,
  startCardCreateAnimation,
  startCardRemovalAnimation,
  notifyError: (message: string) => emit('error', message),
})

watch(
  () => props.stageEvent,
  (event) => {
    if ((event?.metadata as { stage?: string } | undefined)?.stage === 'card-eliminate') {
      resetSelection()
    }
  },
)

const {
  hoveredCardKey,
  handSelectionRequest,
  handleCardHoverStart,
  handleCardHoverEnd,
  handleCardClick,
  handleHandContextMenu,
  isCardDisabled,
  isHandSelectionCandidate,
  handSelectionBlockedReason,
  selectionWrapperClass,
  resetSelection,
  cancelSelection,
  cancelHandSelectionRequest,
} = useHandInteraction({
  props,
  emit,
  interactionState,
  buildOperationContext,
})

onBeforeUnmount(() => {
  cleanupAnimations()
  disposeStageEvents()
  cancelHandSelectionRequest()
})

const hoveredCardIndex = computed(() =>
  hoveredCardKey.value
    ? handEntries.value.findIndex((entry) => entry.key === hoveredCardKey.value)
    : -1,
)

function cardWrapperClasses(index: number): Record<string, boolean> {
  const hoveredIndex = hoveredCardIndex.value
  return {
    'hand-card-wrapper--hovered': hoveredIndex === index,
    'hand-card-wrapper--adjacent-left': hoveredIndex !== -1 && index === hoveredIndex - 1,
    'hand-card-wrapper--adjacent-right': hoveredIndex !== -1 && index === hoveredIndex + 1,
  }
}

defineExpose({ resetSelection, cancelSelection })

</script>

<template>
  <section ref="handZoneRef" class="hand-zone" @contextmenu="handleHandContextMenu">
    <div v-if="isInitializing" class="zone-message">カード情報を読み込み中...</div>
    <div v-else-if="!hasCards" class="zone-message">手札は空です</div>
    <transition name="hand-selection-banner">
      <div v-if="handSelectionRequest" class="hand-selection-banner">
        {{ handSelectionRequest.message }}
      </div>
    </transition>
    <TransitionGroup name="hand-card" tag="div" class="hand-track">
      <div
        v-for="(entry, index) in handEntries"
        :key="entry.key"
        class="hand-card-wrapper"
        :class="[
          cardWrapperClasses(index),
          isCardHidden(entry) ? 'hand-card-wrapper--hidden' : '',
          isCardInCreateAnimation(entry) ? 'hand-card-wrapper--create' : '',
          selectionWrapperClass(entry),
        ]"
        :data-card-id="entry.id ?? ''"
        :ref="(el) => registerCardElement(entry.id, entry.info.title, el)"
      >
        <ActionCard
          v-if="isCardVisible(entry)"
          v-bind="entry.info"
          :operations="entry.operations"
          :affordable="entry.affordable"
          :selected="interactionState.selectedCardKey === entry.key"
          :selection-theme="interactionState.selectionTheme"
          :disabled="isCardDisabled(entry)"
          @click="handleCardClick(entry)"
          @mouseenter="() => handleCardHoverStart(entry)"
          @mouseleave="handleCardHoverEnd"
        />
        <div
          v-if="handSelectionRequest && !isHandSelectionCandidate(entry)"
          class="hand-card-blocked-reason"
        >
          {{ handSelectionBlockedReason(entry) ?? '選択不可' }}
        </div>
      </div>
    </TransitionGroup>
    <div class="hand-floating-layer" aria-hidden="true">
      <div
        v-for="ghost in floatingCards"
        :key="ghost.key"
        class="hand-floating-card"
        :class="[
          `hand-floating-card--${ghost.variant}`,
          ghost.active ? 'hand-floating-card--active' : '',
        ]"
        :style="ghost.style"
      >
        <ActionCard
          v-bind="ghost.info"
          :operations="ghost.operations"
          :affordable="ghost.affordable"
          :disabled="true"
          variant="frame"
        />
      </div>
    </div>
    <div ref="discardCounterRef" class="hand-counter hand-counter--discard hand-pile">
      <span class="pile-icon pile-icon--discard" aria-hidden="true"></span>
      <span class="pile-label">捨て札 {{ discardCount }}</span>
    </div>
    <div ref="deckCounterRef" class="hand-counter hand-counter--deck hand-pile">
      <span class="pile-icon pile-icon--deck" aria-hidden="true"></span>
      <span class="pile-label">山札 {{ deckCount }}</span>
    </div>
    <div class="hand-counter hand-counter--hand hand-pile hand-pile--hand">
      <span class="pile-label">手札 {{ handCount }} / {{ handLimit }}</span>
    </div>
  </section>
</template>

<style scoped>
.hand-zone {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px 32px 72px;
  min-height: 210px;
  position: relative;
}

.hand-counter {
  position: absolute;
  bottom: 10px;
  color: rgba(240, 235, 250, 0.9);
  font-size: 12px;
  letter-spacing: 0.05em;
  z-index: 4;
}

.hand-selection-banner {
  align-self: center;
  margin-bottom: 12px;
  padding: 8px 18px;
  border-radius: 12px;
  background: rgba(24, 16, 30, 0.92);
  color: #ffeae3;
  font-size: 13px;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.hand-selection-banner-enter-active,
.hand-selection-banner-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.hand-selection-banner-enter-from,
.hand-selection-banner-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.hand-counter--discard {
  left: 32px;
}

.hand-counter--deck {
  right: 32px;
}

.hand-counter--hand {
  left: 50%;
  transform: translateX(-50%);
}

.hand-pile {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hand-pile--hand .pile-label {
  font-weight: 600;
}

.pile-icon {
  position: relative;
  width: 20px;
  height: 26px;
  border-radius: 4px;
  background: rgba(90, 90, 110, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.pile-icon::after,
.pile-icon::before {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  height: 2px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 1px;
}

.pile-icon::after {
  top: 8px;
}

.pile-icon::before {
  bottom: 8px;
}

.pile-icon--deck {
  background: rgba(70, 110, 220, 0.4);
}

.pile-icon--discard {
  background: rgba(220, 90, 110, 0.35);
}

.hand-track {
  --card-width: 140px;
  --card-overlap: 48px;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-end;
  gap: 0;
  min-height: 170px;
  margin-top: -10px;
}

.hand-card-wrapper {
  position: relative;
  width: var(--card-width);
  margin-left: calc(-1 * var(--card-overlap));
  transition: transform 0.2s ease, z-index 0.2s ease;
  z-index: 1;
}

.hand-card-wrapper:first-child {
  margin-left: 0;
}

.hand-card-wrapper--hovered {
  z-index: 3;
  transform: translateY(-8px);
}

.hand-card-wrapper--adjacent-left {
  z-index: 1;
  transform: translateX(-27px);
}

.hand-card-wrapper--adjacent-right {
  z-index: 1;
  transform: translateX(27px);
}

.hand-card-wrapper--hidden {
  visibility: hidden;
}

.hand-card-wrapper--selection-candidate {
  z-index: 4;
  filter: drop-shadow(0 0 12px rgba(255, 191, 134, 0.45));
}

.hand-card-wrapper--selection-blocked {
  opacity: 0.4;
  pointer-events: none;
}

.hand-card-blocked-reason {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  padding: 4px 8px;
  text-align: center;
  font-size: 11px;
  color: #ffd6de;
  background: rgba(24, 10, 16, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(255, 128, 158, 0.35);
  pointer-events: none;
}

.zone-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border-radius: 12px;
  background: rgba(24, 22, 26, 0.78);
  color: #f5f0f7;
  font-size: 14px;
  letter-spacing: 0.08em;
}
</style>
<style scoped src="./BattleHandArea.animations.css"></style>
