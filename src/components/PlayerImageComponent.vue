<!--
PlayerImageComponent の責務:
- プレイヤーの現在HPに応じた立ち絵画像を表示し、TargetEnemyOperation 中は背景色をテーマ色（Arcane/Sacred/Default）で強調する。
- 立ち絵画像をコンポーネント初期化時にプリロードし、以降の状態変化でリロードさせない。

責務ではないこと:
- 戦闘ロジックやHP計算の決定は行わない（渡された currentHp/maxHp に従う）。
- ダメージ演出の制御や操作受付は持たず、スロット経由で渡されたオーバーレイを重ねるだけに留める。

主な通信相手とインターフェース:
- BattleView: props で HP・選択状態・テーマ色を受け取り、背景色を同期する。ダメージ演出などは slot を通じて子要素として受ける。
-->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { SELECTION_THEME_COLORS } from '@/types/selectionTheme'

const props = defineProps<{
  currentHp: number
  maxHp: number
  isSelectingEnemy?: boolean
  selectionTheme?: EnemySelectionTheme
  faceDiffOverride?: 'damaged' | null
}>()

const PLAYER_FRAME_VALUES = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100, 105, 110, 120, 130, 140, 145, 150,
]

const preloadedSrcs = new Set<string>()
let preloadPromise: Promise<void> | null = null
const FACE_DIFF_SOURCES: Partial<Record<EnemySelectionTheme | 'damaged', string>> = {
  arcane: buildFaceDiffSrc('ArcaneCardTag.png'),
  sacred: buildFaceDiffSrc('SacredCardTag.png'),
  damaged: buildFaceDiffSrc('damaged.png'),
}
const debugEnabled =
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) ||
  import.meta.env?.VITE_DEBUG_PLAYER_IMAGE === 'true'

const resolvedImageSrc = computed(() => {
  const boundedHp = Math.max(0, Math.floor(props.currentHp ?? 0))
  const clampedHp =
    typeof props.maxHp === 'number' && Number.isFinite(props.maxHp)
      ? Math.min(props.maxHp, boundedHp)
      : boundedHp
  const frame = resolveFrameValue(clampedHp)
  return buildImageSrc(frame)
})

const selectionThemeActive = computed(
  () => props.isSelectingEnemy || (props.selectionTheme !== undefined && props.selectionTheme !== 'default'),
)

const faceDiffSrc = computed(() => {
  if (props.faceDiffOverride === 'damaged') {
    const damaged = FACE_DIFF_SOURCES.damaged
    return damaged ?? null
  }
  if (!selectionThemeActive.value) {
    return null
  }
  const theme = props.selectionTheme ?? 'default'
  return FACE_DIFF_SOURCES[theme] ?? null
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
  void preloadAllFrames()
  Object.values(FACE_DIFF_SOURCES)
    .filter(Boolean)
    .forEach((src) => void preloadImage(src as string).catch(() => undefined))
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
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  return `${normalizedBase}/assets/players/${normalized}.png`
}

function buildFaceDiffSrc(fileName: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  return `${normalizedBase}/assets/players/face_diffs/${fileName}`
}

function preloadAllFrames(): Promise<void> {
  if (preloadPromise) {
    return preloadPromise
  }
  preloadPromise = Promise.all(
    PLAYER_FRAME_VALUES.map((value) => {
      const src = buildImageSrc(value)
      if (preloadedSrcs.has(src)) {
        return Promise.resolve()
      }
      preloadedSrcs.add(src)
      return preloadImage(src)
    }),
  )
    .then(() => undefined)
    .catch((error) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[PlayerImageComponent] preload failed', error)
      }
      return undefined
    })
  return preloadPromise
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    if (img.complete) {
      resolve()
      return
    }
    img.onload = () => resolve()
    img.onerror = (event) => reject(event instanceof ErrorEvent ? event.error : event)
  })
}

function handleImageError(src: string): void {
  if (!debugEnabled) {
    return
  }
  // eslint-disable-next-line no-console
  console.warn('[PlayerImageComponent] 画像の読み込みに失敗しました', src)
}

function handleImageLoad(src: string): void {
  if (!debugEnabled) {
    return
  }
  // eslint-disable-next-line no-console
  console.info('[PlayerImageComponent] 画像を読み込みました', src)
}
</script>

<template>
  <div class="player-image" :class="{ 'player-image--selecting': selectionThemeActive }" :style="styleVars">
    <div class="player-image__frame">
      <img
        class="player-image__img"
        :src="resolvedImageSrc"
        alt="聖女の立ち絵"
        decoding="async"
        @load="handleImageLoad(resolvedImageSrc)"
        @error="handleImageError(resolvedImageSrc)"
      />
      <img
        v-if="faceDiffSrc"
        class="player-image__img player-image__img--face"
        :src="faceDiffSrc"
        alt="聖女の表情差分"
        decoding="async"
        @load="handleImageLoad(faceDiffSrc)"
        @error="handleImageError(faceDiffSrc)"
      />
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
  height: 665px;
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

.player-image__img {
  position: absolute;
  top: 0;
  left: 0;
  width: 800px;
  height: 1300px;
  object-fit: none;
  object-position: top left;
  transform-origin: top left;
  transform: translate(-100px, -75px) scale(0.58);
  display: block;
  z-index: 1;
}

.player-image__img--face {
  z-index: 2;
  pointer-events: none;
  /* ベース画像と同じクロップ・スケールで重ねる */
}

.player-image__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
