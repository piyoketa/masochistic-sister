<script setup lang="ts">
import { computed } from 'vue'
import HpGauge from '@/components/HpGauge.vue'
import type { EnemyInfo, EnemyActionHint, EnemySkill, EnemyTrait } from '@/types/battle'

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

const classes = computed(() => ({
  'enemy-card--selectable': props.selectable ?? false,
  'enemy-card--selected': props.selected ?? false,
  'enemy-card--hovered': props.hovered ?? false,
}))

const formattedSkills = computed(() => {
  const nextHints = props.enemy.nextActions ?? []
  if (nextHints.length > 0) {
    return nextHints.map((action, index) => ({
      key: `${action.title}-${index}`,
      label: formatActionHint(action),
      description: action.description ?? action.title,
      icon: selectIcon(action),
    }))
  }

  return (props.enemy.skills ?? []).map((skill) => ({
    key: `${skill.name}-${skill.detail}`,
    label: formatLegacySkill(skill),
    description: skill.detail,
    icon: '✨',
  }))
})
const traitItems = computed(() => (props.enemy.traits ?? []).map((trait) => formatTrait(trait)))
const stateItems = computed(() => (props.enemy.states ?? []).map((state) => formatTrait(state)))

function handleEnter() {
  emit('hover-start')
}

function handleLeave() {
  emit('hover-end')
}

function formatActionHint(action: EnemyActionHint): string {
  if (action.type === 'skip') {
    return action.icon ?? '⛓'
  }

  const icon = selectIcon(action)
  const damage = formatDamage(action)
  const status = action.status ? formatStatus(action.status.name, action.status.magnitude) : ''
  return `${icon}${damage}${status}`.trim()
}

function selectIcon(action: EnemyActionHint): string {
  if (action.icon) {
    return action.icon
  }
  if (action.pattern?.type === 'multi' || (action.pattern?.count ?? 1) > 1) {
    return '⚔️'
  }
  if (action.pattern && action.pattern.amount > 0) {
    return '💥'
  }
  return '✨'
}

function formatDamage(action: EnemyActionHint): string {
  const pattern = action.pattern
  if (!pattern) {
    return ''
  }

  const amount = Math.max(0, Math.floor(pattern.amount))
  const count = Math.max(0, Math.floor(pattern.count ?? 1))

  if (pattern.type === 'multi' || count > 1) {
    return `${amount}×${count}`
  }

  return `${amount}`
}

function formatStatus(status: string, magnitude?: number): string {
  if (magnitude === undefined) {
    return ` + ${status}`
  }
  return ` + ${status}(${magnitude})`
}

function formatLegacySkill(skill: EnemySkill): string {
  const detail = skill.detail
  const icon = selectLegacyIcon(detail)
  const damage = extractLegacyDamage(detail)
  const status = extractLegacyStatus(detail)
  const magnitude = extractLegacyMagnitude(detail)
  const statusText = status ? formatStatus(status, magnitude) : ''
  return `${icon}${damage}${statusText}`.trim()
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

function formatTrait(trait: EnemyTrait): {
  key: string
  label: string
  description: string
} {
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
      <div class="enemy-card__title">{{ props.enemy.name }}</div>
      <HpGauge :current="props.enemy.hp.current" :max="props.enemy.hp.max" />
    </header>

    <section v-if="formattedSkills.length" class="enemy-card__section">
      <h5 class="enemy-card__label">Next Action</h5>
      <ul class="enemy-card__list enemy-card__list--skills">
        <li
          v-for="skill in formattedSkills"
          :key="skill.key"
          class="enemy-card__chip"
          @mouseenter="showTooltip(skill.description)"
          @mouseleave="hideTooltip"
        >
          <span class="enemy-card__chip-icon">{{ skill.icon }}</span>
          <span>{{ skill.label }}</span>
        </li>
      </ul>
    </section>

    <section v-if="traitItems.length" class="enemy-card__section">
      <h5 class="enemy-card__label">Traits</h5>
      <ul class="enemy-card__list enemy-card__list--chips">
        <li
          v-for="trait in traitItems"
          :key="trait.key"
          class="enemy-card__chip enemy-card__chip--plain"
          @mouseenter="showTooltip(trait.description)"
          @mouseleave="hideTooltip"
        >
          {{ trait.label }}
        </li>
      </ul>
    </section>

    <section v-if="stateItems.length" class="enemy-card__section">
      <h5 class="enemy-card__label">States</h5>
      <ul class="enemy-card__list enemy-card__list--chips">
        <li
          v-for="state in stateItems"
          :key="state.key"
          class="enemy-card__chip enemy-card__chip--plain"
          @mouseenter="showTooltip(state.description)"
          @mouseleave="hideTooltip"
        >
          {{ state.label }}
        </li>
      </ul>
    </section>

    <transition name="tooltip">
      <div v-if="tooltip.visible" class="enemy-card__tooltip">
        {{ tooltip.text }}
      </div>
    </transition>
  </article>
</template>

<style scoped>
.enemy-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 230px;
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
}

.enemy-card__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
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

.enemy-card__list--skills {
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

.enemy-card__tooltip {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(10, 12, 26, 0.92);
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  line-height: 1.4;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
  text-align: center;
  letter-spacing: 0.04em;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
