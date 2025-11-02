<script setup lang="ts">
import { computed } from 'vue'
import type { CardType, AttackStyle } from '@/types/battle'

const props = defineProps<{
  title: string
  type: CardType
  cost: number
  illustration?: string
  description: string
  descriptionSegments?: Array<{ text: string; highlighted?: boolean }>
  notes?: string[]
  attackStyle?: AttackStyle
  cardTags?: string[]
  operations?: string[]
  selected?: boolean
  disabled?: boolean
  affordable?: boolean
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
const costClasses = computed(() => [
  'card-cost',
  { 'card-cost--unavailable': props.affordable === false },
])

const tagList = computed(() => {
  const tags: string[] = []
  const operations = props.operations ?? []

  if (props.type === 'status') {
    tags.push('[状態異常]')
  } else if (operations.includes('target-enemy')) {
    tags.push('[敵１体]')
  } else {
    tags.push('[自身]')
  }

  for (const name of props.cardTags ?? []) {
    tags.push(`[${name}]`)
  }

  return tags
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
    <span :class="costClasses">{{ props.cost }}</span>

    <header class="card-header">
      <h4>{{ props.title }}</h4>
    </header>

    <div v-if="tagList.length" class="tag-list">
      <span v-for="tag in tagList" :key="tag">{{ tag }}</span>
    </div>

    <section class="card-body">
      <p class="card-description">
        <template v-if="props.descriptionSegments && props.descriptionSegments.length">
          <span
            v-for="(segment, index) in props.descriptionSegments"
            :key="index"
            :class="{ 'value--boosted': segment.highlighted }"
          >
            {{ segment.text }}
          </span>
        </template>
        <template v-else>
          {{ props.description }}
        </template>
      </p>
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

.card-cost--unavailable {
  background: rgba(112, 112, 118, 0.65);
  color: rgba(235, 235, 235, 0.85);
  box-shadow: none;
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

.tag-list {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0 6px;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: rgba(245, 245, 245, 0.75);
}

.tag-list span {
  background: rgba(255, 255, 255, 0.08);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: rgba(245, 245, 245, 0.92);
}

.card-description .value--boosted {
  color: #4cff9f;
}

.card-description {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  white-space: pre-line;
}

</style>
