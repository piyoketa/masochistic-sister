<!--
Componentの責務: Battle画面共通の枠組み（ヘッダー/プレイヤーカード/コンテンツスロット）を提供し、個別のビューはmainスロットに戦闘固有UIのみを描く。
責務ではないこと: バトル進行ロジックや表示データの計算（プレイヤー状態はstoreから取得し、バトルスナップショットは扱わない）。
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
import type { StateSnapshot } from '@/types/battle'
import type { RelicDisplayEntry } from '@/view/relicDisplayMapper'

const props = defineProps<{
  playerCardKey?: string | number
  playerPreHp?: { current: number; max: number }
  playerPostHp?: { current: number; max: number }
  playerOutcomes?: DamageOutcome[]
  playerSelectionTheme?: EnemySelectionTheme
  playerStates?: string[]
  playerStateSnapshots?: StateSnapshot[]
  playerPredictedHp?: number | null
  relicGlow?: boolean
}>()

const emit = defineEmits<{
  (eventName: 'contextmenu'): void
  (eventName: 'relic-hover', relic: RelicDisplayEntry, ev: MouseEvent | FocusEvent): void
  (eventName: 'relic-leave'): void
  (eventName: 'relic-click', relic: RelicDisplayEntry): void
  (eventName: 'deck-click'): void
}>()

const playerStore = usePlayerStore()
playerStore.ensureInitialized()

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
          @relic-hover="(relic, event) => emit('relic-hover', relic, event)"
          @relic-leave="emit('relic-leave')"
          @relic-click="(relic) => emit('relic-click', relic)"
          @deck-click="emit('deck-click')"
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
                :predicted-hp="playerPredictedHp ?? undefined"
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
  border-right: 1px solid rgba(255, 255, 255, 0.08);
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
  padding: 12px 0 0 0;
  position: relative;
  overflow: visible;
}
</style>
