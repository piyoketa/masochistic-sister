<!--
PlayerCardComponent の責務:
- プレイヤー立ち絵・HPバー・ダメージ演出を一体化し、表示用HPの更新を一元管理する。
- ダメージ演出(DamageEffects)の開始と完了に合わせて displayHp を制御し、HpGauge/PlayerImageComponent の表示を同期させる。
- 表情差分: 受傷中は damaged を最優先し、完了後に selectionTheme に応じた差分（Arcane/Sacredなど）を表示。プレイヤー状態による差分も重ねる。
- EnemyTargetOperation 中の背景色強調を `.player-card__image` に適用し、選択テーマの視覚表現を担う。
- HPバー直下で EnemyStateChip 形式のステート一覧を描画し、手札では表現されないプレイヤー状態を可視化する。
- プレイヤーの頭上に表示する発話テキストを受け取り、演出表示と同期する。

非責務:
- 戦闘ロジックやダメージ計算は扱わない。pre/post HP は親から渡される値を信頼する。
- AnimationInstruction などの再生順管理は親（BattleView）側で行う。

主なインターフェース:
- props:
  - preHp / postHp: { current, max } 事前/適用後のHP。受傷アニメの開始値と終了値に利用する。
  - outcomes: DamageOutcome[] （DamageEffectsへそのまま渡す）
  - selectionTheme: 表情差分選択用
  - states?: string[] プレイヤーに付与されている状態のID（差分表示用）
  - stateSnapshots?: StateSnapshot[] HPバー直下に EnemyStateChip 形式で表示するステート一覧
  - stateProgressCount?: number 立ち絵の状態進行度（前半パート: 1〜6想定）
  - damageExpressions?: string[] 後半パートのダメージ表現ID一覧
  - faceExpressionLevel?: number 表情差分の段階（0/2/3）
  - speechText?: string | null 頭上に表示する発話テキスト
  - speechKey?: number | string | null 同じ文言でも再生できるようにするためのキー
  - showHpGauge?: HPゲージ表示を切り替えるフラグ（デフォルト true）
  - show: 表示の有無（外部リセット時の切替を許容）
- emits: なし（内部で完結）
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import DamageEffects from '@/components/DamageEffects.vue'
import HpGauge from '@/components/HpGauge.vue'
import PlayerImageComponent from '@/components/PlayerImageComponent.vue'
import EnemyStateChip from '@/components/EnemyStateChip.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import type { StateSnapshot } from '@/types/battle'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { SELECTION_THEME_COLORS } from '@/types/selectionTheme'

const debugEnabled = false;

const props = withDefaults(
  defineProps<{
    preHp: { current: number; max: number }
    postHp: { current: number; max: number }
    outcomes: DamageOutcome[]
    selectionTheme?: EnemySelectionTheme
    states?: string[]
    stateSnapshots?: StateSnapshot[]
    stateProgressCount?: number
    damageExpressions?: string[]
    faceExpressionLevel?: number
    predictedHp?: number | null
    speechText?: string | null
    speechKey?: number | string | null
    showHpGauge?: boolean
    show?: boolean
  }>(),
  {
    predictedHp: null,
    speechText: null,
    speechKey: null,
    showHpGauge: true,
    show: true,
  },
)

const damageRef = ref<InstanceType<typeof DamageEffects> | null>(null)
const displayHp = reactive<{ current: number; max: number }>({ current: 0, max: 0 })
const isTakingDamage = ref(false)
const stateChips = computed(() =>
  (props.stateSnapshots ?? []).map((state) => {
    const label = state.stackable ? `${state.name}(${state.magnitude ?? 0}点)` : state.name
    return {
      key: state.id,
      label,
      description: state.description ?? state.name,
      isImportant: state.isImportant,
      icon: state.icon,
    }
  }),
)

const faceDiffOverride = computed<'damaged-arcane' | 'damaged-normal' | null>(() => {
  if (!isTakingDamage.value) {
    return null
  }
  return props.selectionTheme === 'arcane' ? 'damaged-arcane' : 'damaged-normal'
})

// 設計判断: default テーマは背景強調を行わず、これまでの見た目を維持する。
const selectionThemeActive = computed(
  () => props.selectionTheme !== undefined && props.selectionTheme !== 'default',
)
const selectionThemeVars = computed(() => {
  // 設計判断: 背景色強調は PlayerImageComponent ではなく外枠で制御し、画像描画の責務を分離する。
  const theme = props.selectionTheme ?? 'default'
  const palette = SELECTION_THEME_COLORS[theme] ?? SELECTION_THEME_COLORS.default
  return {
    '--player-accent-strong': palette.strong,
    '--player-accent-soft': palette.background,
  }
})

const baseHpStart = computed(() => sanitizeHp(props.preHp))
const baseHpEnd = computed(() => sanitizeHp(props.postHp))
const speechDisplayText = computed(() => (props.speechText ?? '').trim())
// 設計判断: 同一文言でも再生できるよう、外部キーがあれば優先して描画キーに使う。
const speechRenderKey = computed(() => props.speechKey ?? speechDisplayText.value)
const resolvedStateProgressCount = computed(() => props.stateProgressCount ?? 1)
const resolvedDamageExpressions = computed(() => props.damageExpressions ?? [])
const resolvedFaceExpressionLevel = computed(() => props.faceExpressionLevel ?? 0)

watch(
  () => props.preHp,
  () => resetDisplayHp(),
  { deep: true },
)

watch(
  () => props.outcomes,
  (next) => {
    if (!next || next.length === 0) {
      isTakingDamage.value = false
      displayHp.current = baseHpEnd.value.current
      displayHp.max = baseHpEnd.value.max
      return
    }
    startDamageSequence()
  },
  { deep: true },
)

function sanitizeHp(hp: { current: number; max: number }): { current: number; max: number } {
  const max = Math.max(0, Math.floor(hp?.max ?? 0))
  const current = Math.min(max, Math.max(0, Math.floor(hp?.current ?? 0)))
  return { current, max }
}

function resetDisplayHp(): void {
  const safe = baseHpStart.value
  displayHp.current = safe.current
  displayHp.max = safe.max
  // ダメージ演出中に Snapshot が更新されても表情差分を途切れさせないため、
  // outcomes が空の場合のみダメージフラグを落とす。
  if (!props.outcomes || props.outcomes.length === 0) {
    isTakingDamage.value = false
  }
  if (debugEnabled) {
    // eslint-disable-next-line no-console
    console.info('[PlayerCard] resetDisplayHp', { pre: props.preHp, post: props.postHp, displayHp: { ...displayHp } })
  }
}

function startDamageSequence(): void {
  const pre = baseHpStart.value
  const post = baseHpEnd.value
  displayHp.current = pre.current
  displayHp.max = pre.max
  isTakingDamage.value = true
  if (debugEnabled) {
    // eslint-disable-next-line no-console
    console.info('[PlayerCard] startDamageSequence', {
      pre,
      post,
      displayHp: { ...displayHp },
    })
  }
  nextTick(() => damageRef.value?.play())
}

function handleSequenceEnd(): void {
  // 演出完了後、postHp に揃える（段階的なヒット完了イベントは扱わない）
  displayHp.current = baseHpEnd.value.current
  displayHp.max = baseHpEnd.value.max
  isTakingDamage.value = false
  if (debugEnabled) {
    // eslint-disable-next-line no-console
    console.info('[PlayerCard] sequence-end', { displayHp: { ...displayHp }, post: props.postHp })
  }
}

onMounted(() => {
  resetDisplayHp()
  if (debugEnabled) {
    // eslint-disable-next-line no-console
    console.info('[PlayerCard] mounted', { pre: props.preHp, post: props.postHp, outcomes: props.outcomes })
  }
})
</script>

<template>
  <div class="player-card" v-if="props.show">
    <div
      class="player-card__image"
      :class="{ 'player-card__image--selecting': selectionThemeActive }"
      :style="selectionThemeVars"
    >
      <Transition name="player-caption" mode="out-in">
        <p
          v-if="speechDisplayText"
          class="player-card__caption"
          :key="speechRenderKey"
        >
          {{ speechDisplayText }}
        </p>
      </Transition>
      <PlayerImageComponent
        :current-hp="displayHp.current"
        :max-hp="displayHp.max"
        :selection-theme="selectionTheme"
        :states="states"
        :face-diff-override="faceDiffOverride"
        :state-progress-count="resolvedStateProgressCount"
        :damage-expressions="resolvedDamageExpressions"
        :face-expression-level="resolvedFaceExpressionLevel"
      >
      </PlayerImageComponent>
    </div>
    <div class="player-card__hp">
      <HpGauge
        v-if="showHpGauge"
        :current="displayHp.current"
        :max="displayHp.max"
        :predicted="props.predictedHp ?? null"
      />
      <DamageEffects
        ref="damageRef"
        class="damage-overlay damage-overlay--player"
        :outcomes="outcomes"
        @sequence-start="isTakingDamage = true"
        @sequence-end="handleSequenceEnd"
      />
      <TransitionGroup
        v-if="stateChips.length"
        tag="ul"
        name="player-state"
        class="player-card__states"
      >
        <EnemyStateChip
          v-for="state in stateChips"
          :key="state.key"
          :chip="state"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.player-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 255px;
  height: auto;
  align-items: flex-start;
}

.player-card__image {
  position: relative;
  display: flex;
  top: 60px;
  padding-top: 60px;
  margin-top: -60px;
  transition: background 160ms ease, box-shadow 180ms ease;
}

.player-card__image--selecting {
  background: radial-gradient(circle at 40% 30%, var(--player-accent-soft, rgba(255, 116, 116, 0.2)), rgba(8, 8, 18, 0.92));
  box-shadow: inset 0 0 24px var(--player-accent-soft, rgba(255, 116, 116, 0.18));
}

.player-card__caption {
  position: absolute;
    left: 70px;
    top: 20px;
  z-index: 3;
  margin: 0;
    width: 200px;
    height: 40px;
    display: flex;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
    font-size: 18px;
    font-weight: 400;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: #f7f1e7;
  text-shadow: 1px 1px 2px black, 0 0 1em pink, 0 0 0.1em pink;
  pointer-events: none;
  white-space: pre-line;
  align-items: center;
  justify-content: center;
}

.player-caption-enter-active,
.player-caption-leave-active {
  transition: transform 260ms ease, opacity 260ms ease;
}

.player-caption-enter-from {
  transform: translateY(10px);
  opacity: 0;
}

.player-caption-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.player-caption-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.player-caption-leave-to {
  transform: translateY(-12px);
  opacity: 0;
}

.player-card__hp {
  width: 100%;
  position: absolute;
  bottom: 120px;
  z-index: 2;
}

.player-card__states {
  margin-top: 8px;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  list-style: none;
}
</style>
