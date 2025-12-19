<!--
PlayerImageComponent の責務:
- プレイヤーの現在HPに応じた立ち絵画像を表示し、TargetEnemyOperation 中は背景色をテーマ色（Arcane/Sacred/Default）で強調する。
- ImageHub が事前にプリロードした画像を利用し、HP変化・表情差分・状態差分を重ね描画する。
- プレイヤーの状態（腐食/粘液など）や表情差分を指定数だけ重ね描画する。

責務ではないこと:
- 戦闘ロジックやHP計算の決定は行わない（渡された currentHp/maxHp に従う）。
- 画像のプリロード制御は行わない（ImageHub に委譲）。ダメージ演出の制御や操作受付は持たず、slot 経由で渡されたオーバーレイを重ねるのみ。

主な通信相手とインターフェース:
- BattleView / PlayerCardComponent: props で HP・選択状態・テーマ色・プレイヤー状態を受け取り、背景色と差分表示を同期する。ダメージ演出などは slot を通じて子要素として受ける。
-->
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { SELECTION_THEME_COLORS } from '@/types/selectionTheme'
import { useImageHub } from '@/composables/imageHub'

const props = defineProps<{
  currentHp: number
  maxHp: number
  isSelectingEnemy?: boolean
  selectionTheme?: EnemySelectionTheme
  faceDiffOverride?: 'damaged-arcane' | 'damaged-normal' | null
  states?: string[]
}>()

const PLAYER_FRAME_VALUES = [
  0, 30, 60, 90, 120, 150,
]

const imageHub = useImageHub()
const FACE_DIFF_SOURCES: Partial<Record<EnemySelectionTheme | 'damaged-arcane' | 'damaged-normal', string>> = {
  arcane: buildFaceDiffSrc('ArcaneCardTag.png'),
  sacred: buildFaceDiffSrc('SacredCardTag.png'),
  'damaged-arcane': buildFaceDiffSrc('damaged_ArcaneCardTag.png'),
  'damaged-normal': buildFaceDiffSrc('damaged_normal.png'),
}
const STATUS_DIFF_SOURCES: Partial<Record<string, string>> = {
  // 'state-corrosion': buildStatusDiffSrc('CorrosionState.png'),
  'state-sticky': buildStatusDiffSrc('StickyState.png'),
}
const debugEnabled =
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) ||
  import.meta.env?.VITE_DEBUG_PLAYER_IMAGE === 'true'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = computed(() => canvasRef.value?.getContext('2d') ?? null)

const BASE_DRAW = {
  sx: 90,
  sy: 144,
  sw: 500,
  sh: 1121,
  dw: 255,
  dh: 665,
}

const baseImage = computed(() => {
  const boundedHp = Math.max(0, Math.floor(props.currentHp ?? 0))
  const clampedHp =
    typeof props.maxHp === 'number' && Number.isFinite(props.maxHp)
      ? Math.min(props.maxHp, boundedHp)
      : boundedHp
  const frame = resolveFrameValue(clampedHp)
  const src = buildImageSrc(frame)
  return imageHub.getElement(src)
})

const selectionThemeActive = computed(
  () => props.isSelectingEnemy || (props.selectionTheme !== undefined && props.selectionTheme !== 'default'),
)

const faceDiffElement = computed(() => {
  // HP0 のときは表情差分（ダメージ顔など）を表示しない
  if (props.currentHp <= 0) {
    return null
  }
  if (props.faceDiffOverride) {
    const damaged = FACE_DIFF_SOURCES[props.faceDiffOverride]
    return damaged ? imageHub.getElement(damaged) ?? null : null
  }
  if (!selectionThemeActive.value) {
    return null
  }
  const theme = props.selectionTheme ?? 'default'
  const src = FACE_DIFF_SOURCES[theme]
  return src ? imageHub.getElement(src) ?? null : null
})

const statusDiffElements = computed(() => {
  const ids = props.states ?? []
  const collected: HTMLImageElement[] = []
  for (const id of ids) {
    const src = STATUS_DIFF_SOURCES[id]
    if (src) {
      const resolved = imageHub.getElement(src)
      if (resolved) {
        collected.push(resolved)
      }
    }
  }
  return collected
})

const styleVars = computed(() => {
  const theme = props.selectionTheme ?? 'default'
  const palette = SELECTION_THEME_COLORS[theme] ?? SELECTION_THEME_COLORS.default
  return {
    '--player-accent-strong': palette.strong,
    '--player-accent-soft': palette.background,
  }
})

onMounted(() => {
  const frameSrcs = PLAYER_FRAME_VALUES.map((value) => buildImageSrc(value))
  const faceDiffs = Object.values(FACE_DIFF_SOURCES).filter(Boolean) as string[]
  const statusDiffs = Object.values(STATUS_DIFF_SOURCES).filter(Boolean) as string[]
  void imageHub.preloadAll([...frameSrcs, ...faceDiffs, ...statusDiffs]).catch((error) => {
    if (debugEnabled) {
      // eslint-disable-next-line no-console
      console.warn('[PlayerImageComponent] 画像プリロードに失敗しました', error)
    }
  })
})

watch(
  () => [
    props.currentHp,
    props.maxHp,
    faceDiffElement.value?.src ?? '',
    statusDiffElements.value.map((img) => img.src).join('|'),
  ],
  () => requestAnimationFrame(draw),
  { immediate: true },
)

onBeforeUnmount(() => {
  const context = ctx.value
  if (context) {
    context.clearRect(0, 0, BASE_DRAW.dw, BASE_DRAW.dh)
  }
})

function resolveFrameValue(currentHp: number): number {
  // HP以上で最も近いフレームを選択し、存在しない場合は最大値でフォールバックする。
  const candidates = PLAYER_FRAME_VALUES.filter((value) => value >= currentHp)
  if (candidates.length > 0) {
    return Math.min(...candidates)
  }
  return Math.max(...PLAYER_FRAME_VALUES)
}

function buildImageSrc(frameValue: number): string {
  const normalized = Math.max(0, frameValue)
  return `/assets/players/${normalized}.png`
}

function buildFaceDiffSrc(fileName: string): string {
  return `/assets/players/face_diffs/${fileName}`
}

function buildStatusDiffSrc(fileName: string): string {
  return `/assets/players/diffs/${fileName}`
}

function draw(): void {
  const context = ctx.value
  if (!context) {
    return
  }
  context.clearRect(0, 0, BASE_DRAW.dw, BASE_DRAW.dh)

  const layers: HTMLImageElement[] = []
  if (baseImage.value) {
    layers.push(baseImage.value)
  }
  layers.push(...statusDiffElements.value)
  if (faceDiffElement.value) {
    layers.push(faceDiffElement.value)
  }

  const drawLayer = (img: HTMLImageElement): void => {
    if (!img.complete) {
      img.onload = () => requestAnimationFrame(draw)
      return
    }
    context.drawImage(
      img,
      BASE_DRAW.sx,
      BASE_DRAW.sy,
      BASE_DRAW.sw,
      BASE_DRAW.sh,
      0,
      0,
      BASE_DRAW.dw,
      BASE_DRAW.dh,
    )
  }

  layers.forEach(drawLayer)
}
</script>

<template>
  <div class="player-image" :class="{ 'player-image--selecting': selectionThemeActive }" :style="styleVars">
    <div class="player-image__frame">
      <canvas ref="canvasRef" class="player-image__canvas" :width="BASE_DRAW.dw" :height="BASE_DRAW.dh"></canvas>
      <div class="player-image__overlay">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-image {
  position: relative;
  width: 255px;
  height: 630px;
  border-radius: 0;
  overflow: visible;
  /* background: linear-gradient(180deg, rgba(12, 12, 22, 0.95), rgba(8, 8, 18, 0.88)); */
  transition: background 160ms ease, box-shadow 180ms ease;
}

.player-image--selecting {
  background: radial-gradient(circle at 40% 30%, var(--player-accent-soft, rgba(255, 116, 116, 0.2)), rgba(8, 8, 18, 0.92));
  box-shadow: inset 0 0 24px var(--player-accent-soft, rgba(255, 116, 116, 0.18));
}

.player-image__frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.player-image__canvas {
  position: absolute;
  inset: 0;
  width: 265px;
  height: 630px;
  z-index: 1;
}

.player-image__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
