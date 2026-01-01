/**
 * EnemyCard
 * =========
 * 責務: 敵のHP/ステート/被ダメージ演出を描画し、付与ステートの説明を description overlay に伝えるUI層。UIの選択状態やハイライト状態を受け取り、見た目のみを制御する。
 * 非責務: 戦闘ロジックの変更・敵AI・プレイヤー入力処理。戦闘状態の更新は行わず、ViewModelから渡されたスナップショットを表示するだけ。
 * 主な通信相手とインターフェース:
 * - 親ビュー(BattleViewなど)からの props: enemy(EnemyInfo) と selectable/selected/hovered/acting/highlighted/blockedReason/selectionTheme で表示状態を受け取る。
 * - useDescriptionOverlay: EnemyStateChip の enter/move/leave に合わせて show/hide/updatePosition を呼び出し、StateSnapshot の description 文字列を提示する。activeTooltip で { key: string; text: string } を管理する。
 * - DamageEffects 子コンポーネント: playDamage を経由して DamageOutcome[] を渡し、受けたダメージの視覚効果のみを担当させる。
 * - AudioStore: playEnemySound から defeat/escape 時の効果音再生を委譲する。音源は ENEMY_AUDIO_CUES に限定。
 * 類似型との差異: EnemyInfo.states は StateSnapshot[] で、stackable=true の場合はラベルで「名称(点数)」を必ず表示し、category==='trait' の場合だけ isImportant を尊重する。
 */
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import HpGauge from '@/components/HpGauge.vue'
import type { EnemyInfo, EnemySkill, StateSnapshot } from '@/types/battle'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import DamageEffects from '@/components/DamageEffects.vue'
import EnemyStateChip from '@/components/EnemyStateChip.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { SELECTION_THEME_COLORS } from '@/types/selectionTheme'
import { useAudioStore } from '@/stores/audioStore'

const props = defineProps<{
  enemy: EnemyInfo
  selectable?: boolean
  selected?: boolean
  hovered?: boolean
  acting?: boolean
  highlighted?: boolean
  blockedReason?: string
  selectionTheme?: EnemySelectionTheme
}>()

const emit = defineEmits<{
  (event: 'hover-start'): void
  (event: 'hover-end'): void
}>()

const { state: descriptionOverlay, show: showOverlay, hide: hideOverlay, updatePosition } =
  useDescriptionOverlay()
const audioStore = useAudioStore()

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
  segments: Array<{
    text: string
    highlighted?: boolean
    change?: 'up' | 'down'
    showOverlay?: boolean
    iconPath?: string
    tooltip?: string
  }>
  label: string
  description: string
  tooltips: Partial<Record<number, string>>
  tooltipKey: string
  disabled: boolean
  cardInfo?: import('@/types/battle').CardInfo
}

const classes = computed(() => ({
  'enemy-card--selectable': props.selectable ?? false,
  'enemy-card--selected': props.selected ?? false,
  'enemy-card--hovered': props.hovered ?? false,
  'enemy-card--acting': props.acting ?? false,
  'enemy-card--highlighted': props.highlighted ?? false,
  // escape でも defeat と同等の消失演出を適用する
  'enemy-card--defeated': props.enemy.status === 'defeated' || props.enemy.status === 'escaped',
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

const rootStyleVars = computed(() => ({
  ...selectionStyleVars.value,
  '--enemy-bg-image': `url(${props.enemy.image})`,
}))

const displayName = computed(() => props.enemy.name.replace('（短剣）', '')) // TODO: 削除

const traitChips = computed(() =>
  (props.enemy.states ?? [])
    .filter((state) => state.category === 'trait')
    .map((state) => formatStateChip(state, state.id)),
)

const stateChips = computed(() =>
  (props.enemy.states ?? [])
    .filter((state) => state.category !== 'trait')
    .map((state) => formatStateChip(state, state.id)),
)

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

function formatStateChip(
  state: StateSnapshot,
  key: string,
): {
  key: string
  label: string
  description: string
  isImportant?: boolean
  icon?: string
} {
  const label = state.stackable ? `${state.name}(${state.magnitude ?? 0}点)` : state.name
  const description = state.description ?? state.name
  return {
    key,
    label,
    description,
    isImportant: state.category === 'trait' ? state.isImportant : undefined,
    icon: state.icon,
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
  audioStore.playSe(ENEMY_AUDIO_CUES[effect])
}

defineExpose({ playDamage, playEnemySound })
</script>

<template>
  <article
    class="enemy-card"
    :class="classes"
    :style="rootStyleVars"
    role="button"
    :aria-disabled="!props.selectable || props.enemy.status === 'defeated' ? 'true' : undefined"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <div class="enemy-card__overlay">
      <div class="enemy-card__spacer" />

      <section v-if="traitChips.length" class="enemy-card__section enemy-card__section--traits">
        <TransitionGroup
          tag="ul"
          name="enemy-state"
          class="enemy-card__list enemy-card__list--chips enemy-card__list--traits"
        >
          <EnemyStateChip
            v-for="state in traitChips"
            :key="state.key"
            :chip="state"
            @enter="(event) => showTooltip(event, state.description, `enemy-state-${state.key}`)"
            @move="(event) => updateTooltipPosition(event, `enemy-state-${state.key}`, state.description)"
            @leave="() => hideTooltip(`enemy-state-${state.key}`)"
          />
        </TransitionGroup>
      </section>

      <section v-if="stateChips.length" class="enemy-card__section enemy-card__section--states">
        <TransitionGroup tag="ul" name="enemy-state" class="enemy-card__list enemy-card__list--chips">
          <EnemyStateChip
            v-for="state in stateChips"
            :key="state.key"
            :chip="state"
            @enter="(event) => showTooltip(event, state.description, `enemy-state-${state.key}`)"
            @move="(event) => updateTooltipPosition(event, `enemy-state-${state.key}`, state.description)"
            @leave="() => hideTooltip(`enemy-state-${state.key}`)"
          />
        </TransitionGroup>
      </section>

      <div class="enemy-card__name">{{ displayName }}</div>

      <div class="enemy-card__hp">
        <HpGauge :current="props.enemy.hp.current" :max="props.enemy.hp.max" />
        <DamageEffects
          ref="damageEffectsRef"
          class="enemy-card__damage-effects"
          :outcomes="damageOutcomes"
        />
      </div>
    </div>

    <div v-if="props.blockedReason && !props.selectable && props.hovered" class="enemy-card__blocked-overlay">
      {{ props.blockedReason }}
    </div>
  </article>
</template>

<style scoped>
.enemy-card {
  --enemy-card-scale: 1;
  --enemy-card-translate-y: 0;
  position: relative;
  top: -30px; /* 背景を上方向に広げつつ、下端の表示位置を据え置くために相殺用のオフセットを与える */
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 250px; /* 背景画像の上側が欠けないように高さを拡張する */
  margin-bottom: 0; /* スロット全体の縦寸を変えずに上方向への拡張量を吸収する */
  padding: 12px;
  border-radius: 16px;
  background-image: var(--enemy-bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.35);
  transform: translateY(var(--enemy-card-translate-y)) scale(var(--enemy-card-scale));
  transition:
    transform 200ms ease,
    box-shadow 140ms ease,
    border-color 140ms ease,
    opacity 400ms ease,
    filter 400ms ease;
  cursor: default;
  overflow: hidden;
  --enemy-selection-border: rgba(255, 116, 116, 0.45);
  --enemy-selection-strong: #ff4d6d;
  --enemy-selection-shadow: rgba(255, 116, 116, 0.45);
  --enemy-selection-shadow-strong: rgba(255, 116, 116, 0.5);
}

.enemy-card--selectable {
  cursor: pointer;
  box-shadow: 0 18px 36px var(--enemy-selection-shadow);
}

.enemy-card--hovered.enemy-card--selectable {
  --enemy-card-translate-y: -6px;
  box-shadow: 0 24px 48px var(--enemy-selection-shadow);
}

.enemy-card--selected {
  box-shadow: 0 20px 42px var(--enemy-selection-shadow-strong);
}

.enemy-card--highlighted {
  /* scale を transform のみで行い、translate との競合を避けるため CSS 変数経由で合成する */
  --enemy-card-scale: 1.035;
  transition:
    transform 200ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease,
    opacity 400ms ease,
    filter 400ms ease;
}

.enemy-card--defeated {
  opacity: 0.35;
  filter: grayscale(0.65);
  cursor: default;
  pointer-events: none;
}

.enemy-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(4, 5, 12, 0.0), rgba(4, 5, 12, 0.3));
  pointer-events: none;
  z-index: 0;
}

.enemy-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
  z-index: 1;
}

.enemy-card__spacer {
  flex: 1;
}

.enemy-card__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.enemy-card__name {
  font-size: 13px;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65);
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

.enemy-card__hp {
  position: relative;
}

.enemy-card__damage-effects {
  position: absolute;
  top: -12px;
  right: -6px;
  width: 82px;
  height: 60px;
  pointer-events: none;
  z-index: 2;
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
