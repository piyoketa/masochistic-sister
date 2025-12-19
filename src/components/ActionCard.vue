<script setup lang="ts">
import { computed } from 'vue'
import type { CardType, AttackStyle, CardTagInfo, DescriptionSegment } from '@/types/battle'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { SELECTION_THEME_COLORS } from '@/types/selectionTheme'

const CARD_TYPE_THEMES: Record<
  CardType,
  {
    bgStart: string
    bgEnd: string
    text: string
    accent: string
    muted: string
    background?: string
  }
> = {
  attack: {
    bgStart: '#fff3d2',
    bgEnd: '#f6783a',
    text: '#2f1506',
    muted: 'rgba(20, 24, 24, 0.75)',
    accent: '#f5c46b',
    background:
      'radial-gradient(circle at 50% 40%, rgba(255, 140, 64, 0.55), transparent 55%), linear-gradient(0deg, #fff3d2 0%, #ffd87a 55%, #f6783a 100%)',
  },
  skill: {
    bgStart: '#f0d09b',
    bgEnd: '#fff3d0',
    text: '#2f1506',
    muted: 'rgba(60, 33, 12, 0.7)',
    accent: '#f5c46b',
    background: 'linear-gradient(180deg, #f0d09b 0%, #fff3d0 100%)',
  },
  status: {
    bgStart: '#5c0f12',
    bgEnd: '#2b0609',
    text: '#ffe5e5',
    muted: 'rgba(255, 226, 226, 0.75)',
    accent: '#ff7b7b',
    background:
      'radial-gradient(circle at 20% 20%, rgba(255, 64, 128, 0.45), transparent 52%), radial-gradient(circle at 80% 15%, rgba(140, 0, 255, 0.35), transparent 55%), linear-gradient(185deg, #4b003a 0%, #1b0013 100%)',
  },
  skip: {
    bgStart: '#7d6ead',
    bgEnd: '#2f1a3b',
    text: '#fff5ff',
    muted: 'rgba(255, 255, 255, 0.65)',
    accent: '#b69af8',
    background:
      'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.35), transparent 45%), linear-gradient(180deg, #7d6ead 0%, #2f1a3b 100%)',
  },
}

const BORDER_COLORS = {
  playable: '#ffe27a',
  blocked: '#6e6a72',
}

const props = defineProps<{
  title: string
  type: CardType
  cost: number
  /**
   * 攻撃カードでは省略されることがあるため optional にする。
   */
  description?: string
  descriptionSegments?: DescriptionSegment[]
  attackStyle?: AttackStyle
  primaryTags?: CardTagInfo[]
  effectTags?: CardTagInfo[]
  destinationTags?: CardTagInfo[]
  categoryTags?: CardTagInfo[]
  operations?: string[]
  selected?: boolean
  selectionTheme?: EnemySelectionTheme
  disabled?: boolean
  affordable?: boolean
  damageAmount?: number
  damageCount?: number
  damageAmountReduced?: boolean
  damageCountReduced?: boolean
  damageAmountBoosted?: boolean
  damageCountBoosted?: boolean
  variant?: 'default' | 'frame'
  subtitle?: string
}>()

const emit = defineEmits<{
  (event: 'hover-start'): void
  (event: 'hover-end'): void
}>()

const typeClass = computed(() => `action-card--${props.type}`)
const variant = computed(() => props.variant ?? 'default')
const isFrameVariant = computed(() => variant.value === 'frame')
const isPlayable = computed(() => {
  if (isFrameVariant.value) {
    return props.affordable !== false
  }
  return !props.disabled && props.affordable !== false
})
const stateClasses = computed(() => ({
  'action-card--selected': props.selected ?? false,
  'action-card--disabled': props.disabled ?? false,
  'action-card--frame': isFrameVariant.value,
}))
const tabIndex = computed(() => (props.disabled || isFrameVariant.value ? -1 : 0))
const cardRole = computed(() => (isFrameVariant.value ? undefined : 'button'))
const costClasses = computed(() => [
  'card-cost',
  // コスト不足だけでなく、カード自体が disabled の場合もグレー表示にする
  { 'card-cost--unavailable': props.affordable === false || props.disabled === true },
])
const subtitleText = computed(() => {
  const raw = props.subtitle ?? ''
  const trimmed = raw.trim()
  if (trimmed.length > 0) {
    return trimmed
  }
  if (props.type === 'attack') {
    return '被虐の記憶'
  }
  if (props.type === 'status') {
    return '状態異常'
  }
  return ''
})
const cardStyleVars = computed(() => {
  const theme = CARD_TYPE_THEMES[props.type] ?? CARD_TYPE_THEMES.skill
  const tagBg =
    props.type === 'status' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'
  const selectionTheme = props.selectionTheme ?? 'default'
  const palette = SELECTION_THEME_COLORS[selectionTheme] ?? SELECTION_THEME_COLORS.default
  const vars: Record<string, string> = {
    '--card-bg-start': theme.bgStart,
    '--card-bg-end': theme.bgEnd,
    '--card-text-color': theme.text,
    '--card-muted-color': theme.muted,
    '--card-accent-color': theme.accent,
    '--card-border-color': isPlayable.value ? BORDER_COLORS.playable : BORDER_COLORS.blocked,
    '--card-tag-bg': tagBg,
    '--card-selection-accent': palette.strong,
    '--card-selection-shadow': palette.shadowStrong,
  }
  if (theme.background) {
    vars['--card-background'] = theme.background
  }
  return vars
})

const primaryTagList = computed(() => props.primaryTags ?? [])
const effectTagList = computed(() => props.effectTags ?? [])
const destinationTagList = computed(() => props.destinationTags ?? [])
const categoryTagList = computed(() => props.categoryTags ?? [])
const primaryTagText = computed(() =>
  primaryTagList.value.length > 0 ? primaryTagList.value.map((tag) => tag.label).join('/') : '',
)

const { state: descriptionOverlay, show: showOverlay, hide: hideOverlay, updatePosition } =
  useDescriptionOverlay()

const DEBUFF_ICON_SRC = '/assets/icons/debuff.png'
const MAGNITUDE_HIGHLIGHT_CLASS = 'text-magnitude'

function isDebuffSegment(segment: DescriptionSegment): boolean {
  return segment.text.startsWith('🌀')
}

function stripDebuffEmoji(text: string): string {
  return text.replace(/^🌀/, '')
}

const showDamagePanel = computed(() => typeof props.damageAmount === 'number' && props.damageAmount >= 0)
const damageAmountClass = computed(() => {
  if (!showDamagePanel.value || typeof props.damageAmount !== 'number') {
    return null
  }
  const amount = props.damageAmount
  if (amount > 40) {
    return 'damage-amount--150'
  }
  if (amount > 30) {
    return 'damage-amount--130'
  }
  if (amount > 20) {
    return 'damage-amount--120'
  }
  if (amount > 10) {
    return 'damage-amount--110'
  }
  return 'damage-amount--100'
})

const damageAmountClasses = computed(() => [
  'damage-amount',
  damageAmountClass.value,
  { 'damage-value--boosted': props.damageAmountBoosted, 'damage-value--reduced': props.damageAmountReduced },
])

const damageCountClass = computed(() => {
  if (typeof props.damageCount !== 'number' || props.damageCount <= 1) {
    return null
  }
  const count = props.damageCount
  if (count >= 5) {
    return 'damage-count--130'
  }
  if (count === 4) {
    return 'damage-count--120'
  }
  if (count === 3) {
    return 'damage-count--110'
  }
  return 'damage-count--100'
})

const damageCountClasses = computed(() => [
  'damage-count',
  damageCountClass.value,
  { 'damage-value--boosted': props.damageCountBoosted, 'damage-value--reduced': props.damageCountReduced },
])

function renderRichText(text: string): string {
  // オーバーレイと同様に<magnitude>タグを緑色で強調し、それ以外はエスケープする
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  return escaped.replace(
    /&lt;magnitude&gt;(.*?)&lt;\/magnitude&gt;/g,
    `<span class="${MAGNITUDE_HIGHLIGHT_CLASS}">$1</span>`,
  )
}

let activeTag: { id: string; description: string } | null = null
let activeSegment: { key: string; tooltip: string } | null = null

const handleEnter = () => {
  if (props.disabled || isFrameVariant.value) {
    return
  }
  emit('hover-start')
}

const handleLeave = () => {
  emit('hover-end')
  if (activeTag && descriptionOverlay.text === activeTag.description) {
    hideOverlay()
  }
  activeTag = null
  if (activeSegment && descriptionOverlay.text === activeSegment.tooltip) {
    hideOverlay()
  }
  activeSegment = null
}

function handleTagEnter(event: MouseEvent, tag: CardTagInfo): void {
  if (isFrameVariant.value) {
    return
  }
  if (!tag.description) {
    activeTag = null
    return
  }
  activeTag = { id: tag.id, description: tag.description }
  showOverlay(tag.description, { x: event.clientX, y: event.clientY })
}

function handleTagMove(event: MouseEvent, tag: CardTagInfo): void {
  if (isFrameVariant.value) {
    return
  }
  if (!tag.description) {
    return
  }
  if (
    !descriptionOverlay.visible ||
    !activeTag ||
    activeTag.id !== tag.id ||
    descriptionOverlay.text !== tag.description
  ) {
    return
  }
  updatePosition({ x: event.clientX, y: event.clientY })
}

function handleTagLeave(tag: CardTagInfo): void {
  if (isFrameVariant.value) {
    return
  }
  if (!tag.description) {
    return
  }
  if (!activeTag || activeTag.id !== tag.id || descriptionOverlay.text !== tag.description) {
    return
  }
  hideOverlay()
  activeTag = null
}

function handleSegmentEnter(event: MouseEvent, key: string, tooltip?: string): void {
  if (isFrameVariant.value) {
    return
  }
  if (!tooltip) {
    activeSegment = null
    return
  }
  activeSegment = { key, tooltip }
  showOverlay(tooltip, { x: event.clientX, y: event.clientY })
}

function handleSegmentMove(event: MouseEvent, key: string, tooltip?: string): void {
  if (isFrameVariant.value || !tooltip) {
    return
  }
  if (
    !descriptionOverlay.visible ||
    !activeSegment ||
    activeSegment.key !== key ||
    activeSegment.tooltip !== tooltip
  ) {
    return
  }
  updatePosition({ x: event.clientX, y: event.clientY })
}

function handleSegmentLeave(key: string, tooltip?: string): void {
  if (!tooltip || isFrameVariant.value) {
    return
  }
  if (
    !activeSegment ||
    activeSegment.key !== key ||
    activeSegment.tooltip !== tooltip ||
    descriptionOverlay.text !== tooltip
  ) {
    return
  }
  hideOverlay()
  activeSegment = null
}
</script>

<template>
  <div class="action-card-shell">
    <article
      class="action-card"
      :class="[typeClass, stateClasses]"
      :style="cardStyleVars"
      :tabindex="tabIndex"
      :role="cardRole"
      :aria-disabled="props.disabled || isFrameVariant ? 'true' : 'false'"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
      @focusin="handleEnter"
      @focusout="handleLeave"
    >
      <template v-if="true">
        <span :class="costClasses">{{ props.cost }}</span>

        <header class="card-header">
          <h4>{{ props.title }}</h4>
          <span v-if="subtitleText" class="card-subtitle">{{ subtitleText }}</span>
        </header>

        <section class="card-body">
          <div v-if="showDamagePanel" class="damage-panel">
            <span v-if="typeof props.damageAmount === 'number'" :class="damageAmountClasses">
              {{ props.damageAmount }}
              <span class="damage-unit">ダメージ</span>
            </span>
            <span v-if="typeof props.damageCount === 'number'" :class="damageCountClasses">
              ×{{ props.damageCount }}
            </span>
          </div>
          <p v-if="props.type === 'attack'" class="card-description">
            <template v-if="props.descriptionSegments && props.descriptionSegments.length">
              <template v-for="(segment, index) in props.descriptionSegments" :key="index">
                <br v-if="segment.text === '\n'" />
                <span
                  v-else-if="isDebuffSegment(segment)"
                  class="debuff-segment"
                  :class="{ 'value--boosted': segment.highlighted }"
                  @mouseenter="(event) => handleSegmentEnter(event, `segment-${index}`, segment.tooltip)"
                  @mousemove="(event) => handleSegmentMove(event, `segment-${index}`, segment.tooltip)"
                  @mouseleave="() => handleSegmentLeave(`segment-${index}`, segment.tooltip)"
                >
                  <v-icon class="debuff-icon" size="14">
                    <img :src="DEBUFF_ICON_SRC" alt="デバフ" />
                  </v-icon>
                  <span class="debuff-text" v-html="renderRichText(stripDebuffEmoji(segment.text))" />
                </span>
                <span
                  v-else
                  :class="{ 'value--boosted': segment.highlighted }"
                  @mouseenter="(event) => handleSegmentEnter(event, `segment-${index}`, segment.tooltip)"
                  @mousemove="(event) => handleSegmentMove(event, `segment-${index}`, segment.tooltip)"
                  @mouseleave="() => handleSegmentLeave(`segment-${index}`, segment.tooltip)"
                >
                  <span v-html="renderRichText(segment.text)" />
                </span>
              </template>
            </template>
            <span
              v-for="tag in effectTagList"
              :key="`effect-${tag.id}`"
              @mouseenter="(event) => handleTagEnter(event, tag)"
              @mousemove="(event) => handleTagMove(event, tag)"
              @mouseleave="() => handleTagLeave(tag)"
            >
              <v-icon v-if="tag.iconPath" class="effect-tag-icon" size="14">
                <img :src="tag.iconPath" alt="効果" />
              </v-icon>
              <template v-else>💛</template>
              <span class="effect-tag-text">{{ tag.label }}</span>
            </span>
          </p>
          <p v-if="props.type !== 'attack'" class="card-description">
            <span v-html="renderRichText(props.description ?? '')" />
          </p>
        <div v-if="primaryTagText" class="primary-tag-text">
          {{ primaryTagText }}
        </div>
      </section>
          <div v-if="destinationTagList.length" class="tag-list tag-list--destination">
            <span
              v-for="tag in destinationTagList"
              :key="tag.id"
              @mouseenter="(event) => handleTagEnter(event, tag)"
              @mousemove="(event) => handleTagMove(event, tag)"
              @mouseleave="() => handleTagLeave(tag)"
            >
              {{ tag.label }}
            </span>
          </div>
        <div v-if="categoryTagList.length || effectTagList.length" class="category-tag-list">
          <span
            v-for="tag in categoryTagList"
            :key="tag.id"
            @mouseenter="(event) => handleTagEnter(event, tag)"
            @mousemove="(event) => handleTagMove(event, tag)"
            @mouseleave="() => handleTagLeave(tag)"
          >
            {{ tag.label }}
          </span>
        </div>
      </template>
    </article>
  </div>
</template>

<style scoped>
.action-card-shell {
  --card-shell-width: var(--action-card-width, 120px);
  --card-shell-height: var(--action-card-height, 170px);
  --card-shell-pad-top: var(--action-card-shell-pad-top, 12px);
  --card-shell-pad-side: var(--action-card-shell-pad-side, 8px);
  --card-shell-pad-bottom: var(--action-card-shell-pad-bottom, 8px);
  position: relative;
  display: inline-flex;
  width: var(--card-shell-width);
  height: var(--card-shell-height);
  padding: var(--card-shell-pad-top) var(--card-shell-pad-side) var(--card-shell-pad-bottom);
  margin-top: calc(var(--card-shell-pad-top) * -1);
  margin-bottom: calc(var(--card-shell-pad-bottom) * -1);
  margin-left: calc(var(--card-shell-pad-side) * -1);
  margin-right: calc(var(--card-shell-pad-side) * -1);
  box-sizing: content-box;
  overflow: visible;
  pointer-events: none;
}

.action-card-shell > .action-card {
  pointer-events: auto;
  width: 100%;
  height: 100%;
}

.action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 5px 12px 12px;
  border-radius: 12px;
  background: var(
    --card-background,
    linear-gradient(180deg, var(--card-bg-start, #1f1d2c), var(--card-bg-end, #121218))
  );
  border: 2px solid var(--card-border-color, #ffe27a);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.45);
  transition: transform 140ms ease, box-shadow 140ms ease;
  cursor: pointer;
  outline: none;
  z-index: 1;
  color: var(--card-text-color, #f5f5f5);   
  text-align: center;
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

.action-card--selected {
  box-shadow: 0 18px 36px var(--card-selection-shadow, rgba(255, 74, 109, 0.5));
  border-color: var(--card-selection-accent, #ff4d6d);
}

.action-card--selected .card-header h4 {
  color: var(--card-selection-accent, #ff4d6d);
}

.action-card--disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.action-card--frame {
  cursor: default;
  pointer-events: none;
}

.card-cost {
  position: absolute;
  top: -10px;
  left: -8px;
  padding: 2px 8px;
  border-radius: 14px;
  background: rgba(255, 227, 115, 1);
  color: #402510;
  font-weight: 700;
  letter-spacing: 0.06em;
  font-size: 14px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  font-family: 'Zen Old Mincho', 'Hina Mincho', serif;
    text-shadow:
    -0.5px -0.5px 0 #fdfdfc,
    0.5px -0.5px 0 #fdfdfc,
    -0.5px 0.5px 0 #fdfdfc,
    0.5px 0.5px 0 #fdfdfc;  
}

.card-cost--unavailable {
  background: rgba(112, 112, 118, 1);
  box-shadow: none;
}

.card-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  min-height: 42px;
  font-family: 'Zen Old Mincho', 'Hina Mincho', serif;
}

.card-header h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #2f1506;
  text-shadow:
    -1px -0.5px 0 hsl(35, 43%, 95%),
    1px -0.5px 0 hsl(35, 43%, 95%),
    -1px 0.5px 0 hsl(35, 43%, 95%),
    1px 0.5px 0 hsl(35, 43%, 95%);
}

/* アタックと状態異常は従来の白抜き+暗赤シャドウを維持 */
.action-card--attack .card-header h4,
.action-card--status .card-header h4 {
  color: #fdfdfc;
  text-shadow:
    -2px -0.5px 0 #6b060f,
    0.5px -0.5px 0 #6b060f,
    -0.5px 0.5px 0 #6b060f,
    0.5px 0.5px 0 #6b060f;
}

.card-subtitle {
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.12em;
  padding: 0px 10px;
  background: linear-gradient(90deg, rgba(20, 20, 20, 0), rgba(20, 20, 20, 0.7) 20%, rgba(20, 20, 20, 0.7) 80%, rgba(20, 20, 20, 0) 100%);
  color: #fdfdfc;
}

.primary-tag-text {
  margin-top: 6px;
  margin-bottom: 0;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: var(--card-muted-color, rgba(245, 245, 245, 0.75));
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.35);
}
.action-card--attack .primary-tag-text {
  color: rgba(0, 33, 33, 0.75);
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
}

.action-card--attack .primary-tag-text{
  color: rgb(0, 33, 33, 0.75);
}

.tag-list {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0 6px;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--card-muted-color, rgba(245, 245, 245, 0.75));
}

.tag-list span {
  background: var(--card-tag-bg, rgba(0, 0, 0, 0.08));
  padding: 0 6px;
  border-radius: 10px;
  color: var(--card-text-color, inherit);
}

.tag-list--effect {
  margin-top: 6px;
  justify-content: center;
}

.tag-list--destination {
  margin-top: 6px;
  justify-content: center;
}

.tag-list--effect span {
  background: rgba(255, 255, 255, 0.16);
  color: var(--card-text-color, inherit);
  font-weight: 700;
}

.tag-list--destination span {
  background: var(--card-tag-bg, rgba(0, 0, 0, 0.08));
  padding: 0 6px;
  border-radius: 10px;
  color: var(--card-text-color, inherit);
}

.category-tag-list {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: auto;
  font-size: 8px;
  letter-spacing: 0.08em;
  color: var(--card-muted-color, rgba(235, 235, 240, 0.6));
  align-self: flex-end;
}

.category-tag-list span {
  background: none;
  padding: 0;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  color: var(--card-text-color, rgba(245, 245, 245, 0.92));
}

.card-description {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--card-text-color, rgba(245, 245, 245, 0.92));
}
.action-card--attack .card-description {
  font-size: 14px;
  font-weight: 700;
  padding-right: 8px;
}
.text-magnitude {
  color: #31d39e;
  font-weight: 700;
}

.damage-panel {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
  color: var(--card-text-color, #2f1b08);
}

.damage-amount,
.damage-count {
  font-weight: 800;
  color: var(--card-text-color, #2f1b08);
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  display: inline-flex;
  flex-direction: column;
}

.damage-count {
  font-weight: 700;
  opacity: 0.85;
}

.damage-amount--100 {
  font-size: 22px;
}

.damage-amount--110 {
  font-size: 24px;
}

.damage-amount--120 {
  font-size: 26px;
}

.damage-amount--130 {
  font-size: 28px;
}

.damage-amount--150 {
  font-size: 30px;
}

.damage-count--100 {
  font-size: 14px;
}

.damage-count--110 {
  font-size: 15px;
}

.damage-count--120 {
  font-size: 16px;
}

.damage-count--130 {
  font-size: 17px;
}

.damage-unit {
  font-size: 7px;
  line-height: 1.1;
  letter-spacing: 0.08em;
  opacity: 0.85;
  display: block;
  margin-top: -2px;
}

.damage-value--boosted,
.card-description .value--boosted {
  color: #1f8c68;
  text-shadow:
    0 0 6px rgba(31, 140, 104, 0.35),
    0 0 1px rgba(0, 0, 0, 0.6);
}

.damage-value--reduced {
  color: #ff6b6b;
  text-shadow:
    0 0 6px rgba(255, 107, 107, 0.3),
    0 0 1px rgba(0, 0, 0, 0.6);
}

.debuff-segment {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.debuff-icon {
  display: inline-flex;
}

.debuff-icon img {
  width: 14px;
  height: 14px;
}

.effect-tag-icon {
  display: inline-flex;
}

.effect-tag-icon img {
  width: 14px;
  height: 14px;
}

.effect-tag-text {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
</style>
