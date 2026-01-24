<!--
PlayerImageComponent の責務:
- プレイヤーの現在HPに応じた立ち絵画像を表示し、ImageHub が事前にプリロードした画像を重ね描画する。
- TargetEnemyOperation 中の表情差分（Arcane/Sacred など）と、HP変化・状態差分を合成する。
- プレイヤーの状態（腐食/粘液など）や表情差分を指定数だけ重ね描画する。
- 後半パートのダメージ表現と表情差分を、立ち絵の上に重ねて描画する。
- 環境変数によって、HP依存の立ち絵切替と「状態進行カウント」依存の切替を切り替える。

責務ではないこと:
- 戦闘ロジックやHP計算の決定は行わない（渡された currentHp/maxHp に従う）。
- 画像のプリロード制御は行わない（ImageHub に委譲）。ダメージ演出の制御や操作受付は持たず、slot 経由で渡されたオーバーレイを重ねるのみ。
- TargetEnemyOperation 中の背景色強調は行わない（PlayerCardComponent に委譲）。

主な通信相手とインターフェース:
- BattleView / PlayerCardComponent: props で HP・テーマ色・プレイヤー状態を受け取り、差分表示を同期する。背景色強調は PlayerCardComponent 側で行い、ダメージ演出などは slot を通じて子要素として受ける。
- PlayerCardComponent: 新ロジック時は stateProgressCount を受け取り、対応する画像へ切替する。
- PlayerCardComponent: damageExpressions / faceExpressionLevel を受け取り、後半パートの表現を重ねる。
-->
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { useImageHub } from '@/composables/imageHub'
import type { FaceExpressionLevel, PlayerDamageExpressionId } from '@/domain/progress/PlayerStateProgressManager'
import {
  PLAYER_DAMAGE_EXPRESSION_IDS,
  PLAYER_FACE_EXPRESSION_IDS,
} from '@/domain/progress/PlayerStateProgressManager'

const props = defineProps<{
  currentHp: number
  maxHp: number
  isSelectingEnemy?: boolean
  selectionTheme?: EnemySelectionTheme
  faceDiffOverride?: 'damaged-arcane' | 'damaged-normal' | null
  states?: string[]
  stateProgressCount?: number
  damageExpressions?: PlayerDamageExpressionId[]
  faceExpressionLevel?: FaceExpressionLevel
}>()

const newImageLogicEnabled =
  String(import.meta.env?.VITE_NEW_PLAYER_IMAGE_LOGIC ?? '').toLowerCase() === 'true' ||
  String(import.meta.env?.VITE_NEW_PLAYER_IMAGE_LOGIC ?? '') === '1'
const LEGACY_PLAYER_FRAME_VALUES = [0, 30, 60, 90, 120, 150]
const NEW_PLAYER_FRAME_VALUES = [1, 2, 3, 4, 5, 6]
// 設計判断: 切替後も描画処理を共通化できるよう、参照先を PLAYER_FRAME_VALUES に揃える。
const PLAYER_FRAME_VALUES = newImageLogicEnabled ? NEW_PLAYER_FRAME_VALUES : LEGACY_PLAYER_FRAME_VALUES

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
const DAMAGE_EXPRESSION_SOURCES = PLAYER_DAMAGE_EXPRESSION_IDS.map((id) => buildDamageExpressionSrc(id))
const FACE_EXPRESSION_SOURCES: Partial<Record<FaceExpressionLevel, string>> = {
  2: buildDamageExpressionSrc(PLAYER_FACE_EXPRESSION_IDS[0]),
  3: buildDamageExpressionSrc(PLAYER_FACE_EXPRESSION_IDS[1]),
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
  if (newImageLogicEnabled) {
    const progressValue = resolveStateProgressValue(props.stateProgressCount)
    const frame = resolveFrameValue(progressValue)
    const src = buildNewImageSrc(frame)
    return imageHub.getElement(src)
  }
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

const damageOverlayElements = computed(() => {
  const ids = props.damageExpressions ?? []
  const collected: HTMLImageElement[] = []
  for (const id of ids) {
    const src = buildDamageExpressionSrc(id)
    const resolved = imageHub.getElement(src)
    if (resolved) {
      collected.push(resolved)
    }
  }
  return collected
})

const faceExpressionElement = computed(() => {
  // HP0 のときは表情差分を表示しない。
  if (props.currentHp <= 0) {
    return null
  }
  const level = props.faceExpressionLevel ?? 0
  const src = FACE_EXPRESSION_SOURCES[level]
  return src ? imageHub.getElement(src) ?? null : null
})

onMounted(() => {
  const frameSrcs = PLAYER_FRAME_VALUES.map((value) =>
    newImageLogicEnabled ? buildNewImageSrc(value) : buildImageSrc(value),
  )
  const faceDiffs = Object.values(FACE_DIFF_SOURCES).filter(Boolean) as string[]
  const statusDiffs = Object.values(STATUS_DIFF_SOURCES).filter(Boolean) as string[]
  const faceExpressionDiffs = Object.values(FACE_EXPRESSION_SOURCES).filter(Boolean) as string[]
  const damageDiffs = [...DAMAGE_EXPRESSION_SOURCES, ...faceExpressionDiffs]
  void imageHub.preloadAll([...frameSrcs, ...faceDiffs, ...statusDiffs, ...damageDiffs]).catch((error) => {
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
    props.stateProgressCount ?? 1,
    baseImage.value?.src ?? '',
    faceDiffElement.value?.src ?? '',
    statusDiffElements.value.map((img) => img.src).join('|'),
    damageOverlayElements.value.map((img) => img.src).join('|'),
    faceExpressionElement.value?.src ?? '',
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

function resolveFrameValue(value: number): number {
  // 設計判断: 状態進行とHPの両方で同じ丸めルールを使い、範囲外は最大値に吸収する。
  const candidates = PLAYER_FRAME_VALUES.filter((candidate) => candidate >= value)
  if (candidates.length > 0) {
    return Math.min(...candidates)
  }
  return Math.max(...PLAYER_FRAME_VALUES)
}

function buildImageSrc(frameValue: number): string {
  const normalized = Math.max(0, frameValue)
  return `/assets/players/${normalized}.png`
}

function buildNewImageSrc(frameValue: number): string {
  const normalized = Math.max(1, frameValue)
  return `/assets/players/new_images/${normalized}.png`
}

function buildFaceDiffSrc(fileName: string): string {
  return `/assets/players/face_diffs/${fileName}`
}

function buildStatusDiffSrc(fileName: string): string {
  return `/assets/players/diffs/${fileName}`
}

function buildDamageExpressionSrc(fileName: string): string {
  return `/assets/players/damages/${fileName}.png`
}

function resolveStateProgressValue(raw: number | undefined): number {
  // 設計判断: 未指定時は初期値1を使い、1〜10の範囲に収める。
  const base = Number.isFinite(raw) ? Math.floor(raw ?? 1) : 1
  return Math.min(10, Math.max(1, base))
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
  // 設計上の決定: ダメージ表現は FACE_DIFF_SOURCES より下に重ねる。
  layers.push(...damageOverlayElements.value)
  if (faceExpressionElement.value) {
    layers.push(faceExpressionElement.value)
  }
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
  <div class="player-image">
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
  height: 590px;
  border-radius: 0;
  overflow: visible;
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
  height: 590px;
  z-index: 1;
}

.player-image__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
