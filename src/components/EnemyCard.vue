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
import { computed, nextTick, ref } from 'vue'
import HpGauge from '@/components/HpGauge.vue'
import type { EnemyInfo, EnemySkill, EnemyTrait } from '@/types/battle'
import { formatEnemyActionLabel } from '@/components/enemyActionFormatter.ts'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import DamageEffects from '@/components/DamageEffects.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { SELECTION_THEME_COLORS } from '@/types/selectionTheme'
import { useAudioHub } from '@/composables/audioHub'

const props = defineProps<{
  enemy: EnemyInfo
  selectable?: boolean
  selected?: boolean
  hovered?: boolean
  acting?: boolean
  blockedReason?: string
  selectionTheme?: EnemySelectionTheme
}>()

const emit = defineEmits<{
  (event: 'hover-start'): void
  (event: 'hover-end'): void
}>()

const { state: descriptionOverlay, show: showOverlay, hide: hideOverlay, updatePosition } =
  useDescriptionOverlay()
const audioHub = useAudioHub()

let activeTooltip: { key: string; text: string } | null = null
const damageOutcomes = ref<DamageOutcome[]>([])
const damageEffectsRef = ref<InstanceType<typeof DamageEffects> | null>(null)
const ENEMY_AUDIO_CUES = {
  defeat: '/sounds/defeat/maou_se_battle18.mp3',
  escape: '/sounds/escape/kurage-kosho_esc01.mp3',
} as const

interface ActionChipEntry {
  key: string
  icon: string
  segments: Array<{ text: string; highlighted?: boolean }>
  label: string
  description: string
  tooltips: Partial<Record<number, string>>
  tooltipKey: string
  disabled: boolean
}

const classes = computed(() => ({
  'enemy-card--selectable': props.selectable ?? false,
  'enemy-card--selected': props.selected ?? false,
  'enemy-card--hovered': props.hovered ?? false,
  'enemy-card--acting': props.acting ?? false,
  'enemy-card--defeated': props.enemy.status === 'defeated',
}))

const selectionStyleVars = computed(() => {
  const theme = props.selectionTheme ?? 'default'
  const palette = SELECTION_THEME_COLORS[theme] ?? SELECTION_THEME_COLORS.default
  return {
    '--enemy-selection-border': palette.border,
    '--enemy-selection-strong': palette.strong,
    '--enemy-selection-shadow': palette.shadow,
    '--enemy-selection-shadow-strong': palette.shadowStrong,
  }
})

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
        disabled: Boolean(action.acted),
      }
    })
  }

  return [
    {
      key: `enemy-action-placeholder-${props.enemy.id}`,
      icon: '',
      label: '-',
      segments: [{ text: '-' }],
      description: '',
      tooltips: {},
      tooltipKey: `enemy-action-placeholder-${props.enemy.id}`,
      disabled: false,
    },
  ]
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

function formatStateChip(trait: EnemyTrait): { key: string; label: string; description: string } {
  const magnitude = trait.magnitude
  const label = magnitude !== undefined ? `${trait.name}(${magnitude})` : trait.name
  return {
    key: `${trait.name}-${trait.detail}`,
    label,
    description: trait.detail,
  }
}

async function playDamage(outcomes: readonly DamageOutcome[]): Promise<void> {
  if (!outcomes || outcomes.length === 0) {
    return
  }
  damageOutcomes.value = outcomes.map((outcome) => ({ ...outcome }))
  await nextTick()
  damageEffectsRef.value?.play()
}

function playEnemySound(effect: 'defeat' | 'escape'): void {
  audioHub.play(ENEMY_AUDIO_CUES[effect])
}

defineExpose({ playDamage, playEnemySound })
</script>

<template>
  <article
    class="enemy-card"
    :class="classes"
    :style="selectionStyleVars"
    role="button"
    :aria-disabled="!props.selectable || props.enemy.status === 'defeated' ? 'true' : undefined"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <header class="enemy-card__header">
      <div class="enemy-card__title">{{ displayName }}</div>
      <div class="enemy-card__hp">
        <HpGauge :current="props.enemy.hp.current" :max="props.enemy.hp.max" />
        <DamageEffects
          ref="damageEffectsRef"
          class="enemy-card__damage-effects"
          :outcomes="damageOutcomes"
        />
      </div>
    </header>

    <section v-if="formattedActions.length" class="enemy-card__section">
      <h5 class="enemy-card__label">Next Action</h5>
      <ul class="enemy-card__list enemy-card__list--chips">
        <li
          v-for="action in formattedActions"
          :key="action.key"
          :class="['enemy-card__chip', { 'enemy-card__chip--disabled': action.disabled }]"
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
      <TransitionGroup tag="ul" name="enemy-state" class="enemy-card__list enemy-card__list--chips">
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
      </TransitionGroup>
    </section>
    <div v-if="props.blockedReason && !props.selectable && props.hovered" class="enemy-card__blocked-overlay">
      {{ props.blockedReason }}
    </div>
  </article>
</template>

<style scoped>
.enemy-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 210px;
  padding: 10px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(18, 22, 40, 0.9), rgba(10, 12, 24, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
  cursor: default;
  overflow: hidden;
  --enemy-selection-border: rgba(255, 116, 116, 0.45);
  --enemy-selection-strong: #ff4d6d;
  --enemy-selection-shadow: rgba(255, 116, 116, 0.45);
  --enemy-selection-shadow-strong: rgba(255, 116, 116, 0.5);
}

.enemy-card--selectable {
  cursor: pointer;
  border-color: var(--enemy-selection-border);
}

.enemy-card--hovered.enemy-card--selectable {
  transform: translateY(-6px);
  box-shadow: 0 24px 48px var(--enemy-selection-shadow);
}

.enemy-card--selected {
  border-color: var(--enemy-selection-strong);
  box-shadow: 0 20px 42px var(--enemy-selection-shadow-strong);
}

.enemy-card--acting {
  border-color: rgba(255, 214, 111, 0.85);
  box-shadow: 0 0 24px rgba(255, 214, 111, 0.55);
  animation: enemy-card-acting 0.6s ease;
}

.enemy-card--defeated {
  opacity: 0.7;
  filter: grayscale(0.45);
  cursor: default;
  pointer-events: none;
}

@keyframes enemy-card-acting {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.04);
  }
  100% {
    transform: scale(1);
  }
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

.enemy-card__hp {
  position: relative;
}

.enemy-card__damage-effects {
  position: absolute;
  top: -12px;
  right: -6px;
  width: 80px;
  height: 60px;
  pointer-events: none;
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
  transition: opacity 0.5s ease, filter 0.5s ease;
}

.enemy-card__chip--plain {
  background: rgba(255, 255, 255, 0.05);
}

.enemy-card__chip--disabled {
  opacity: 0.45;
  filter: grayscale(0.5);
}

.enemy-card :deep(.enemy-state-enter-active),
.enemy-card :deep(.enemy-state-leave-active) {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.enemy-card :deep(.enemy-state-enter-from),
.enemy-card :deep(.enemy-state-leave-to) {
  opacity: 0;
  transform: translateY(-6px);
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

.enemy-card__blocked-overlay {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(20, 8, 12, 0.85);
  border: 1px solid rgba(255, 128, 149, 0.4);
  color: #ffd6de;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}
</style>
