<!--
PlayerCardComponent の責務:
- プレイヤー立ち絵・HPバー・ダメージ演出を一体化し、表示用HPの更新を一元管理する。
- ダメージ演出(DamageEffects)の開始と完了に合わせて displayHp を制御し、HpGauge/PlayerImageComponent の表示を同期させる。
- 表情差分: 受傷中は damaged を最優先し、完了後に selectionTheme に応じた差分（Arcane/Sacredなど）を表示。
 - 表情差分: 受傷中は damaged を最優先し、完了後に selectionTheme に応じた差分（Arcane/Sacredなど）を表示。プレイヤー状態による差分も重ねる。

非責務:
- 戦闘ロジックやダメージ計算は扱わない。pre/post HP は親から渡される値を信頼する。
- AnimationInstruction などの再生順管理は親（BattleView）側で行う。

主なインターフェース:
- props:
  - preHp / postHp: { current, max } 事前/適用後のHP。受傷アニメの開始値と終了値に利用する。
  - outcomes: DamageOutcome[] （DamageEffectsへそのまま渡す）
  - selectionTheme: 表情差分選択用
  - states?: string[] プレイヤーに付与されている状態のID（差分表示用）
  - showHpGauge?: HPゲージ表示を切り替えるフラグ（デフォルト true）
  - show: 表示の有無（外部リセット時の切替を許容）
- emits: なし（内部で完結）
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import DamageEffects from '@/components/DamageEffects.vue'
import HpGauge from '@/components/HpGauge.vue'
import PlayerImageComponent from '@/components/PlayerImageComponent.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import type { EnemySelectionTheme } from '@/types/selectionTheme'

const debugEnabled = false;

const props = withDefaults(
  defineProps<{
    preHp: { current: number; max: number }
    postHp: { current: number; max: number }
    outcomes: DamageOutcome[]
    selectionTheme?: EnemySelectionTheme
    states?: string[]
    predictedHp?: number | null
    showHpGauge?: boolean
    show?: boolean
  }>(),
  {
    predictedHp: null,
    showHpGauge: true,
    show: true,
  },
)

const damageRef = ref<InstanceType<typeof DamageEffects> | null>(null)
const displayHp = reactive<{ current: number; max: number }>({ current: 0, max: 0 })
const isTakingDamage = ref(false)

const faceDiffOverride = computed<'damaged-arcane' | 'damaged-normal' | null>(() => {
  if (!isTakingDamage.value) {
    return null
  }
  return props.selectionTheme === 'arcane' ? 'damaged-arcane' : 'damaged-normal'
})

const baseHpStart = computed(() => sanitizeHp(props.preHp))
const baseHpEnd = computed(() => sanitizeHp(props.postHp))

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
  isTakingDamage.value = false
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
    <div class="player-card__image">
      <PlayerImageComponent
        :current-hp="displayHp.current"
        :max-hp="displayHp.max"
        :selection-theme="selectionTheme"
        :states="states"
        :face-diff-override="faceDiffOverride"
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
}

.player-card__hp {
  width: 100%;
  position: absolute;
  bottom: 120px;
  z-index: 2;
}
</style>
