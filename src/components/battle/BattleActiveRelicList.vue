<!--
BattleActiveRelicList の責務:
- battle-main__lower 内でアクティブレリック一覧を描画する。
- RelicList と同等の UI 状態判定を用いて、発動可能/不可の見た目を切り替える。

責務ではないこと:
- 所持レリックの取得やアクティブ判定などのデータ管理は扱わない。
- クリックや詳細表示などのインタラクション制御は親に委譲する。

主な通信相手とインターフェース:
- BattleView（親）: `activeRelics` / `disabled` を props で受け取り、`relic-hover` / `relic-leave` / `relic-click` を emit する。
-->
<script setup lang="ts">
import type { RelicDisplayEntry, RelicUiState } from '@/view/relicDisplayMapper'

const props = withDefaults(
  defineProps<{
    activeRelics?: RelicDisplayEntry[]
    disabled?: boolean
  }>(),
  {
    activeRelics: () => [] as RelicDisplayEntry[],
    disabled: false,
  },
)

const emit = defineEmits<{
  (event: 'relic-hover', relic: RelicDisplayEntry, ev: MouseEvent | FocusEvent): void
  (event: 'relic-leave'): void
  (event: 'relic-click', relic: RelicDisplayEntry): void
}>()

// RelicList と同じルールで UI 状態を解決し、表示一貫性を保つ。
function resolveUiState(relic: RelicDisplayEntry): RelicUiState {
  if (relic.uiState) return relic.uiState
  if (relic.usageType === 'field') return 'field-disabled'
  if (relic.usageType === 'passive') return relic.active ? 'passive-active' : 'passive-inactive'
  if (relic.usageType === 'active') return relic.usable ? 'active-ready' : 'disabled'
  return 'disabled'
}

function isCardDisabled(relic: RelicDisplayEntry): boolean {
  // 親が一覧全体をロックしたい場合も想定し、props.disabled を最優先する。
  if (props.disabled) return true
  const state = resolveUiState(relic)
  return relic.usageType !== 'active' || state !== 'active-ready'
}

// 表示文言を固定フォーマットに揃えて、UIの読み取りコストを下げる。
function resolveUsesRemainingLabel(relic: RelicDisplayEntry): string | null {
  if (relic.usageType !== 'active') return null
  if (relic.usesRemaining === undefined) return null
  const value = relic.usesRemaining === null ? '∞' : relic.usesRemaining
  return `あと${value}回`
}

function handleHover(relic: RelicDisplayEntry, ev: MouseEvent | FocusEvent): void {
  emit('relic-hover', relic, ev)
}

function handleLeave(): void {
  emit('relic-leave')
}

function handleClick(relic: RelicDisplayEntry): void {
  emit('relic-click', relic)
}
</script>

<template>
  <section class="active-relics" aria-label="アクティブレリック一覧">
    <div class="active-relics__row">
      <button
        v-for="relic in props.activeRelics"
        :key="relic.id"
        type="button"
        class="active-relics__card"
        :class="{ 'active-relics__card--disabled': isCardDisabled(relic) }"
        :style="{
          // ActionCard と同じく、使用可能/不可の境界色を変える。
          '--card-border-color': isCardDisabled(relic) ? '#6e6a72' : '#ffe27a',
        }"
        :disabled="isCardDisabled(relic)"
        :aria-label="relic.name"
        @mouseenter="(event) => handleHover(relic, event)"
        @focusin="(event) => handleHover(relic, event)"
        @mouseleave="handleLeave"
        @focusout="handleLeave"
        @click="() => handleClick(relic)"
      >
        <span class="active-relics__card-icon" aria-hidden="true">
          {{ relic.icon }}
        </span>
        <span class="active-relics__card-label">{{ relic.name }}</span>
        <span v-if="resolveUsesRemainingLabel(relic)" class="active-relics__card-badge">
          {{ resolveUsesRemainingLabel(relic) }}
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.active-relics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 40px;
  background: var(--battle-zone-bg);
  min-height: 68px;
  box-sizing: border-box;
  padding-left: 20px;
}

.active-relics__row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 2px;
  min-height: 60px;
}

.active-relics__card {
  --card-border-color: #ffe27a;
  width: 120px;
  height: 40px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  background: linear-gradient(180deg, #f0d09b 0%, #fff3d0 100%);
  border: 1px solid var(--card-border-color);
  border-radius: 10px;
  color: #2f1506;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-align: center;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.25);
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  appearance: none;
}

.active-relics__card--disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.active-relics__card:not(:disabled):hover {
  border-color: rgba(255, 168, 90, 0.95);
  box-shadow:
    0 0 10px rgba(255, 168, 90, 0.45),
    inset 0 0 12px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.03);
}

.active-relics__card-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
}

.active-relics__card-label {
  white-space: nowrap;
}

.active-relics__card-badge {
  position: absolute;
  right: 6px;
  bottom: -10px;
  min-width: 36px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: #e3404d;
  color: #fff5f5;
  font-size: 10px;
  line-height: 18px;
  font-weight: 700;
  box-shadow: 0 0 6px rgba(227, 64, 77, 0.45);
  text-align: center;
}
</style>
