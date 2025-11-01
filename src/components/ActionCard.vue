<script setup lang="ts">
import { computed } from 'vue'
import type { CardType, AttackStyle } from '@/types/battle'

const props = defineProps<{
  title: string
  type: CardType
  cost: number
  illustration?: string
  description: string
  notes?: string[]
  attackStyle?: AttackStyle
  selected?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'hover-start'): void
  (event: 'hover-end'): void
}>()

const typeClass = computed(() => `action-card--${props.type}`)
const stateClasses = computed(() => ({
  'action-card--selected': props.selected ?? false,
  'action-card--disabled': props.disabled ?? false,
}))
const tabIndex = computed(() => (props.disabled ? -1 : 0))

const attackBadge = computed(() => {
  if (props.type !== 'attack' || !props.attackStyle) return null
  return props.attackStyle === 'single'
    ? { icon: '⚔️', label: '単撃' }
    : { icon: '💥', label: '連撃' }
})

const handleEnter = () => {
  if (props.disabled) {
    return
  }
  emit('hover-start')
}

const handleLeave = () => {
  emit('hover-end')
}
</script>

<template>
  <article
    class="action-card"
    :class="[typeClass, stateClasses]"
    :tabindex="tabIndex"
    role="button"
    :aria-disabled="props.disabled ? 'true' : 'false'"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
    @focusin="handleEnter"
    @focusout="handleLeave"
  >
    <span class="card-cost">{{ props.cost }}</span>

    <header class="card-header">
      <h4>{{ props.title }}</h4>
    </header>

    <section class="card-body">
      <p class="card-description">{{ props.description }}</p>
      <div v-if="attackBadge" class="attack-style">
        <span class="attack-icon">{{ attackBadge.icon }}</span>
        <span>{{ attackBadge.label }}</span>
      </div>
    </section>
  </article>
</template>

<style scoped>
.action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 94px;
  min-height: 140px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(31, 29, 44, 0.9), rgba(18, 18, 24, 0.95));
  border: 5px solid transparent;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.45);
  transition: transform 140ms ease, box-shadow 140ms ease;
  cursor: pointer;
  outline: none;
  z-index: 1;
}

.action-card:hover,
.action-card:focus-visible {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 20px 32px rgba(0, 0, 0, 0.55);
  z-index: 10;
}

.action-card:focus-visible {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25), 0 24px 36px rgba(0, 0, 0, 0.55);
}

.action-card--attack {
  border-color: #d3333f;
  background: linear-gradient(180deg, rgba(211, 51, 63, 0.16), rgba(18, 18, 24, 0.95));
}

.action-card--skill {
  border-color: #2c6fe1;
  background: linear-gradient(180deg, rgba(44, 111, 225, 0.16), rgba(18, 18, 24, 0.95));
}

.action-card--status {
  border-color: #29292d;
  background: linear-gradient(180deg, rgba(90, 90, 98, 0.4), rgba(34, 34, 42, 0.92));
}

.action-card--selected {
  box-shadow: 0 18px 36px rgba(255, 74, 109, 0.5);
  border-color: #ff4d6d;
}

.action-card--selected .card-header h4 {
  color: #ff4d6d;
}

.action-card--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.card-cost {
  position: absolute;
  top: -10px;
  left: -6px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(255, 227, 115, 0.92);
  color: #402510;
  font-weight: 700;
  letter-spacing: 0.06em;
  font-size: 11px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.card-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

.card-header h4 {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: #f5f5f5;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(245, 245, 245, 0.92);
}

.card-description {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  white-space: pre-line;
}

.attack-style {
  align-self: center;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 9px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.85);
}

.attack-icon {
  font-size: 12px;
}
</style>
