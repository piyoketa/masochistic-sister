/**
 * EnemyCard
 * =========
 * 敵ステータスを表示し、次の行動予測や付与ステートの詳細を description overlay に流すコンポーネント。
 * このカードは親ビュー(BattleView)から敵情報を受け取り、hoverイベントで description overlay を更新する。
 * - props.enemy: 表示する敵情報 (EnemyInfo)
 * - emits hover-start/hover-end: 親に現在の hover 状態を伝搬
 * - useDescriptionOverlay: ツールチップ用のグローバルオーバーレイと連携
 */
<script setup lang="ts">
import { computed } from 'vue'
import HpGauge from '@/components/HpGauge.vue'
import type { EnemyInfo, EnemySkill, EnemyTrait } from '@/types/battle'
import { formatEnemyActionLabel } from '@/components/enemyActionFormatter.ts'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'

const props = defineProps<{
  enemy: EnemyInfo
  selectable?: boolean
  selected?: boolean
  hovered?: boolean
}>()

const emit = defineEmits<{
  (event: 'hover-start'): void
  (event: 'hover-end'): void
}>()

const { state: descriptionOverlay, show: showOverlay, hide: hideOverlay, updatePosition } =
  useDescriptionOverlay()

let activeTooltip: { key: string; text: string } | null = null

interface ActionChipEntry {
  key: string
  icon: string
  segments: Array<{ text: string; highlighted?: boolean }>
  label: string
  description: string
  tooltips: Partial<Record<number, string>>
  tooltipKey: string
}

const classes = computed(() => ({
  'enemy-card--selectable': props.selectable ?? false,
  'enemy-card--selected': props.selected ?? false,
  'enemy-card--hovered': props.hovered ?? false,
}))

const displayName = computed(() => props.enemy.name.replace('（短剣）', '')) // TODO: 削除

const formattedActions = computed<ActionChipEntry[]>(() => {
  const next = props.enemy.nextActions ?? []
  if (next.length > 0) {
    return next.map((action, index) => {
      const formatted = formatEnemyActionLabel(action)
      const tooltips: Partial<Record<number, string>> = {}
      const descriptionText = action.description ?? action.title ?? formatted.label
      if (formatted.segments.length > 0 && descriptionText) {
        tooltips[0] = descriptionText
      }

      const stateDescription = action.status?.description ?? action.selfState?.description
      if (stateDescription && formatted.segments.length > 0) {
        tooltips[formatted.segments.length - 1] = stateDescription
      }

      return {
        key: `${action.title}-${index}`,
        icon: action.icon ?? '',
        label: formatted.label,
        segments: formatted.segments,
        description: descriptionText,
        tooltips,
        tooltipKey: `enemy-action-${props.enemy.id}-${index}`,
      }
    })
  }

  return (props.enemy.skills ?? []).map((skill, index) => ({
    key: `${skill.name}-${index}`,
    icon: selectLegacyIcon(skill.detail),
    label: formatLegacyLabel(skill),
    segments: [{ text: formatLegacyLabel(skill) }],
    tooltips: { 0: skill.detail },
    description: skill.detail,
    tooltipKey: `enemy-skill-${props.enemy.id}-${index}`,
  }))
})

const stateChips = computed(() => (props.enemy.states ?? []).map(formatStateChip))

function handleEnter(): void {
  emit('hover-start')
}

function handleLeave(): void {
  emit('hover-end')
  if (activeTooltip && descriptionOverlay.text === activeTooltip.text) {
    hideOverlay()
  }
  activeTooltip = null
}

function showTooltip(event: MouseEvent, text: string | undefined, key: string): void {
  if (!text) {
    return
  }
  activeTooltip = { key, text }
  showOverlay(text, { x: event.clientX, y: event.clientY })
}

function updateTooltipPosition(event: MouseEvent, key: string, text?: string): void {
  if (!text) {
    return
  }
  if (
    !descriptionOverlay.visible ||
    !activeTooltip ||
    activeTooltip.key !== key ||
    activeTooltip.text !== text
  ) {
    return
  }
  updatePosition({ x: event.clientX, y: event.clientY })
}

function hideTooltip(key: string): void {
  if (
    !activeTooltip ||
    activeTooltip.key !== key ||
    descriptionOverlay.text !== activeTooltip.text
  ) {
    return
  }
  hideOverlay()
  activeTooltip = null
}

function formatStatus(name: string, magnitude?: number): string {
  if (magnitude === undefined) {
    return `+ ${name}`
  }
  return `+ ${name}(${magnitude})`
}

function formatLegacyLabel(skill: EnemySkill): string {
  const damage = extractLegacyDamage(skill.detail)
  const status = extractLegacyStatus(skill.detail)
  const magnitude = extractLegacyMagnitude(skill.detail)
  const statusText = status ? formatStatus(status, magnitude) : ''
  return [damage, statusText.trim()].filter((part) => part.length > 0).join(' ')
}

function selectLegacyIcon(detail: string): string {
  if (detail.includes('×') || detail.includes('回攻撃')) {
    return '⚔️'
  }
  if (detail.includes('ダメージ')) {
    return '💥'
  }
  return '✨'
}

function extractLegacyDamage(detail: string): string {
  const multi = detail.match(/(\d+)\s*[×x]\s*(\d+)/)
  if (multi) {
    return `${multi[1]}×${multi[2]}`
  }
  const single = detail.match(/(\d+)\s*ダメージ/)
  if (single) {
    return single[1] ?? ''
  }
  const numeric = detail.match(/\d+/)
  return numeric ? numeric[0] ?? '' : ''
}

function extractLegacyStatus(detail: string): string | undefined {
  const statusMatch = detail.match(/[＋+]\s*([^付与]+)付与/)
  if (statusMatch) {
    return statusMatch[1]?.trim()
  }
  return undefined
}

function extractLegacyMagnitude(detail: string): number | undefined {
  const match = detail.match(/([+-]?\d+)/)
  if (!match) {
    return undefined
  }
  const value = Number(match[1])
  return Number.isFinite(value) ? value : undefined
}

function formatStateChip(trait: EnemyTrait): { key: string; label: string; description: string } {
  const magnitude = extractLegacyMagnitude(trait.detail)
  const label = magnitude !== undefined ? `${trait.name}(${magnitude})` : trait.name
  return {
    key: `${trait.name}-${trait.detail}`,
    label,
    description: trait.detail,
  }
}
</script>

<template>
  <article class="enemy-card" :class="classes" role="button" @mouseenter="handleEnter" @mouseleave="handleLeave">
    <header class="enemy-card__header">
      <div class="enemy-card__title">{{ displayName }}</div>
      <HpGauge :current="props.enemy.hp.current" :max="props.enemy.hp.max" />
    </header>

    <section v-if="formattedActions.length" class="enemy-card__section">
      <h5 class="enemy-card__label">Next Action</h5>
      <ul class="enemy-card__list enemy-card__list--chips">
        <li
          v-for="action in formattedActions"
          :key="action.key"
          class="enemy-card__chip"
          @mouseleave="() => hideTooltip(action.tooltipKey)"
        >
          <span v-if="action.icon" class="enemy-card__chip-icon">{{ action.icon }}</span>
          <span class="enemy-card__chip-text">
            <span
              v-for="(segment, segmentIndex) in action.segments"
              :key="segmentIndex"
              :class="{ 'value--boosted': segment.highlighted }"
              @mouseenter="(event) => showTooltip(event, action.tooltips[segmentIndex], action.tooltipKey)"
              @mousemove="(event) => updateTooltipPosition(event, action.tooltipKey, action.tooltips[segmentIndex])"
              @mouseleave="() => hideTooltip(action.tooltipKey)"
            >
              {{ segment.text }}
            </span>
          </span>
        </li>
      </ul>
    </section>

    <section v-if="stateChips.length" class="enemy-card__section">
      <h5 class="enemy-card__label">States</h5>
      <ul class="enemy-card__list enemy-card__list--chips">
        <li
          v-for="state in stateChips"
          :key="state.key"
          class="enemy-card__chip enemy-card__chip--plain"
          @mouseenter="(event) => showTooltip(event, state.description, `enemy-state-${state.key}`)"
          @mousemove="(event) => updateTooltipPosition(event, `enemy-state-${state.key}`, state.description)"
          @mouseleave="() => hideTooltip(`enemy-state-${state.key}`)"
        >
          {{ state.label }}
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.enemy-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 180px;
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(18, 22, 40, 0.9), rgba(10, 12, 24, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
  cursor: default;
  overflow: hidden;
}

.enemy-card--selectable {
  cursor: pointer;
  border-color: rgba(255, 116, 116, 0.45);
}

.enemy-card--hovered.enemy-card--selectable {
  transform: translateY(-6px);
  box-shadow: 0 24px 48px rgba(255, 116, 116, 0.45);
}

.enemy-card--selected {
  border-color: rgba(255, 116, 116, 0.9);
  box-shadow: 0 20px 42px rgba(255, 116, 116, 0.5);
}

.enemy-card__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.enemy-card__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.2;
}

.enemy-card__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.enemy-card__label {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.enemy-card__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.enemy-card__list--chips {
  gap: 8px;
}

.enemy-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.88);
  position: relative;
}

.enemy-card__chip--plain {
  background: rgba(255, 255, 255, 0.05);
}

.enemy-card__chip-icon {
  font-size: 13px;
}

.enemy-card__chip-text {
  display: inline-flex;
  gap: 2px;
}

.value--boosted {
  color: #4cff9f;
}
</style>
