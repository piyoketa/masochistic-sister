<!--
Componentの責務: Battle画面共通の枠組み（ヘッダー/プレイヤーカード/コンテンツスロット）を提供し、個別のビューはmainスロットに戦闘固有UIのみを描く。
責務ではないこと: バトル進行ロジックや表示データの計算（プレイヤー状態は props が優先、未指定時のみ store から取得する）。
主な通信相手: 親(BattleViewなど)。ヘッダー右側のボタン群はactionsスロット経由で親から注入し、overlaysスロットでオーバーレイを重ねる。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import PlayerCardComponent from '@/components/PlayerCardComponent.vue'
import PlayerStatusHeader from '@/components/battle/PlayerStatusHeader.vue'
import { usePlayerStore } from '@/stores/playerStore'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import type { DamageOutcome } from '@/domain/entities/Damages'
import type { CardInfo, StateSnapshot } from '@/types/battle'
import type { RelicDisplayEntry } from '@/view/relicDisplayMapper'
import type {
  FaceExpressionLevel,
  PlayerDamageExpressionId,
} from '@/domain/progress/PlayerStateProgressManager'
import { useRelicCardOverlay } from '@/composables/relicCardOverlay'
import { usePlayerDeckOverlayStore } from '@/stores/playerDeckOverlayStore'
import { CardRepository } from '@/domain/repository/CardRepository'
import { createCardFromBlueprint } from '@/domain/library/Library'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'

const props = withDefaults(defineProps<{
  playerCardKey?: string | number
  playerPreHp?: { current: number; max: number }
  playerPostHp?: { current: number; max: number }
  playerOutcomes?: DamageOutcome[]
  playerSelectionTheme?: EnemySelectionTheme
  playerStates?: string[]
  playerStateSnapshots?: StateSnapshot[]
  playerStateProgressCount?: number
  playerDamageExpressions?: PlayerDamageExpressionId[]
  playerFaceExpressionLevel?: FaceExpressionLevel
  playerPredictedHp?: number | null
  playerSpeechText?: string | null
  playerSpeechKey?: string | number | null
  relicGlow?: boolean
  relics?: RelicDisplayEntry[]
  /** battle 以外でヘッダーから詳細オーバーレイを開くかどうか。battle 側は false 推奨。 */
  enableHeaderOverlay?: boolean
}>(), {
  // battle 以外ではヘッダーからのデッキ/レリック詳細を既定で開けるよう true に寄せる。
  enableHeaderOverlay: true,
})

const emit = defineEmits<{
  (eventName: 'contextmenu'): void
  (eventName: 'relic-hover', relic: RelicDisplayEntry, ev: MouseEvent | FocusEvent): void
  (eventName: 'relic-leave'): void
  (eventName: 'relic-click', relic: RelicDisplayEntry): void
  (eventName: 'deck-click'): void
}>()

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const playerDeckOverlayStore = usePlayerDeckOverlayStore()
const { show: showRelicOverlay, hide: hideRelicOverlay } = useRelicCardOverlay()

const playerCardRef = ref<InstanceType<typeof PlayerCardComponent> | null>(null)

const playerStatus = computed(() => ({
  hp: playerStore.hp,
  maxHp: playerStore.maxHp,
}))

const resolvedPreHp = computed(() => props.playerPreHp ?? { current: playerStatus.value.hp, max: playerStatus.value.maxHp })
const resolvedPostHp = computed(() => props.playerPostHp ?? { current: playerStatus.value.hp, max: playerStatus.value.maxHp })
const resolvedSelectionTheme = computed<EnemySelectionTheme>(() => props.playerSelectionTheme ?? 'default')
const resolvedOutcomes = computed<DamageOutcome[]>(() => props.playerOutcomes ?? [])
const resolvedStates = computed<string[]>(() => props.playerStates ?? [])
const resolvedStateSnapshots = computed<StateSnapshot[]>(() => props.playerStateSnapshots ?? [])
const resolvedStateProgressCount = computed(() => props.playerStateProgressCount ?? playerStore.stateProgressCount)
const resolvedDamageExpressions = computed<PlayerDamageExpressionId[]>(() =>
  props.playerDamageExpressions ?? playerStore.appliedDamageExpressions.map((entry) => entry.id),
)
const resolvedFaceExpressionLevel = computed<FaceExpressionLevel>(() =>
  props.playerFaceExpressionLevel ?? playerStore.faceExpressionLevel,
)
// 設計判断: バトル画面ではレリッククリックがアクティブ使用になるため、詳細オーバーレイを無効化できるようにする。
const headerOverlayEnabled = computed(() => props.enableHeaderOverlay !== false)
const deckCardInfos = computed<CardInfo[]>(() => {
  // battle 以外の画面でも並びが安定するよう、タイプ順に固定して表示する。
  const repository = new CardRepository()
  const sorted = [...playerStore.deck].sort((a, b) => a.type.localeCompare(b.type))
  return sorted
    .map((blueprint, index) => createCardFromBlueprint(blueprint, repository))
    .map((card, index) =>
      buildCardInfoFromCard(card, {
        id: `player-deck-${card.id ?? index}`,
        affordable: true,
        disabled: true,
      }),
    )
    .filter((info): info is CardInfo => info !== null)
})

function resolveOverlayPosition(event: MouseEvent | FocusEvent): { x: number; y: number } {
  // フォーカス経由でも位置を計算できるよう、ターゲットの矩形中心を使う。
  if ('clientX' in event) {
    return { x: event.clientX, y: event.clientY }
  }
  if (event.target instanceof HTMLElement) {
    const rect = event.target.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top }
  }
  return { x: 0, y: 0 }
}

function handleHeaderRelicHover(relic: RelicDisplayEntry, event: MouseEvent | FocusEvent): void {
  if (headerOverlayEnabled.value) {
    const position = resolveOverlayPosition(event)
    showRelicOverlay(relic, position)
  }
  emit('relic-hover', relic, event)
}

function handleHeaderRelicLeave(): void {
  if (headerOverlayEnabled.value) {
    hideRelicOverlay()
  }
  emit('relic-leave')
}

function handleHeaderRelicClick(relic: RelicDisplayEntry): void {
  emit('relic-click', relic)
}

function handleHeaderDeckClick(): void {
  if (headerOverlayEnabled.value) {
    playerDeckOverlayStore.open(deckCardInfos.value)
  }
  emit('deck-click')
}

function getPlayerCardRect(): DOMRect | null {
  const el = playerCardRef.value?.$el as HTMLElement | undefined
  return el?.getBoundingClientRect() ?? null
}

defineExpose({ getPlayerCardRect })
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="battle-layout" @contextmenu.prevent="emit('contextmenu')">
        <slot name="overlays" />
        <PlayerStatusHeader
          :enable-glow="props.relicGlow !== false"
          :battle-relics="props.relics"
          @relic-hover="handleHeaderRelicHover"
          @relic-leave="handleHeaderRelicLeave"
          @relic-click="handleHeaderRelicClick"
          @deck-click="handleHeaderDeckClick"
        >
          <template #actions>
            <slot name="actions" />
          </template>
        </PlayerStatusHeader>
        <div class="battle-body">
          <aside class="battle-sidebar">
            <div class="portrait">
              <PlayerCardComponent
                :key="playerCardKey ?? 'player-card'"
                ref="playerCardRef"
                :pre-hp="resolvedPreHp"
                :post-hp="resolvedPostHp"
                :outcomes="resolvedOutcomes"
                :selection-theme="resolvedSelectionTheme"
                :states="resolvedStates"
                :state-snapshots="resolvedStateSnapshots"
                :state-progress-count="resolvedStateProgressCount"
                :damage-expressions="resolvedDamageExpressions"
                :face-expression-level="resolvedFaceExpressionLevel"
                :predicted-hp="playerPredictedHp ?? undefined"
                :speech-text="playerSpeechText ?? null"
                :speech-key="playerSpeechKey ?? null"
              />
            </div>
          </aside>
          <slot />
        </div>
      </div>
    </template>
    <template #instructions>
      <slot name="instructions" />
    </template>
  </GameLayout>
</template>

<style scoped>
.battle-layout {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top left, rgba(48, 48, 72, 0.9), rgba(12, 12, 16, 0.95));
  border-radius: 0;
  border: none;
  overflow: hidden;
}

.battle-body {
  display: grid;
  grid-template-columns: 240px 1fr;
  flex: 1;
  min-height: 0;
  position: relative;
}

.battle-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  box-sizing: border-box;
  min-height: 0;
  overflow: visible;
}

.portrait {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
  overflow: visible;
}
</style>
