<!--
CardAnimationLabView の責務:
- card-create / card-eliminate ワイプアニメーションを手軽に検証する実験ページを提供し、ActionCard の enter/leave 演出を単独で評価できるようにする。
- それぞれのトリガーボタンを持ち、カードの生成・消滅を Transition で制御する。

責務ではないこと:
- Battle や ViewManager への組み込み。実験で得た知見をどう本番へ反映するかの判断は別タスクとする。

主な通信相手:
- ActionCard: 実際に表示するカードコンポーネント。固定データを渡し、操作やダメージ計算は行わない。
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import ActionCard from '@/components/ActionCard.vue'

const sampleCard = {
  id: 'lab-card',
  title: 'ポイズンリース',
  type: 'skill',
  cost: 2,
  illustration: '🌿',
  description: '防御＋5\n次のターン、与ダメージ+3',
  descriptionSegments: [
    { text: '🌀守りの花びら(2)', tooltip: 'ターン開始時にシールド(2)を得る' },
    { text: '\n' },
    { text: '🌀毒の香り', tooltip: '攻撃時に敵へ毒(2)を付与する' },
  ],
  attackStyle: 'single',
  primaryTags: [{ id: 'tag-type-skill', label: '補助' }],
  effectTags: [{ id: 'tag-buff', label: '防御' }],
  categoryTags: [{ id: 'tag-memory', label: '記憶' }],
  damageAmount: 0,
  damageCount: 0,
}

type LabCardInfo = typeof sampleCard
type LabCard = { id: number; info: LabCardInfo }

const labCardCounter = ref(1)
function createLabCard(label: string): LabCard {
  const numericId = labCardCounter.value++
  const slug = label.toLowerCase().replace(/\s+/g, '-')
  return {
    id: numericId,
    info: {
      ...sampleCard,
      id: `${slug}-${numericId}`,
      title: `${label} #${numericId}`,
    },
  }
}

const enterCardVisible = ref(false)
const leaveCardVisible = ref(true)
const leaveAnimationMode = ref<'circle' | 'spiral' | 'burnout' | 'svg-burn' | 'ash' | 'ringburn'>('circle')
const enterAnimationMode = ref<'spawn' | 'reveal' | 'flip' | 'spark'>('spawn')
const leaveTransitionName = computed(() => {
  switch (leaveAnimationMode.value) {
    case 'circle':
      return 'card-wipe'
    case 'spiral':
      return 'card-spiral'
    case 'burnout':
      return 'card-burnout'
    case 'svg-burn':
      return 'card-svg-burn'
    case 'ash':
      return 'card-ash'
    case 'ringburn':
      return 'card-ringburn'
    default:
      return 'card-wipe'
  }
})

const playEnterAnimation = async () => {
  enterCardVisible.value = false
  await nextTick()
  requestAnimationFrame(() => {
    enterCardVisible.value = true
  })
}

const playLeaveAnimation = () => {
  leaveCardVisible.value = !leaveCardVisible.value
}

// ---- Hand flow simulation ----
type LabFloatingCard = {
  key: string
  info: typeof sampleCard
  style: {
    left: string
    top: string
    width: string
    height: string
    transform: string
  }
  active: boolean
}

const labSimulatorRef = ref<HTMLElement | null>(null)
const labCreateZoneRef = ref<HTMLElement | null>(null)

const labHandCards = ref<LabCard[]>([])
const labHiddenCardIds = ref<Set<number>>(new Set())
const labCreateOverlays = ref<Array<{ key: string; info: LabCardInfo; id: number }>>([])
const labFloatingCards = ref<LabFloatingCard[]>([])
const labRecentCardId = ref<number | null>(null)
const CARD_CREATE_DURATION_MS = 1000
const CARD_FLOAT_DURATION_MS = 500
const ACTION_CARD_WIDTH = 94
const ACTION_CARD_HEIGHT = 140
const labCreateTimers = new Map<string, ReturnType<typeof window.setTimeout>>()
const labRecentTimers = new Map<number, ReturnType<typeof window.setTimeout>>()
const labTransferRetryTimers = new Map<number, ReturnType<typeof window.setTimeout>>()
const labHandCardRefs = new Map<number, HTMLElement>()

const spawnLabCard = () => {
  const card = createLabCard('FixedOverlay')
  const key = `lab-create-${card.id}-${Date.now()}`
  labCreateOverlays.value = [...labCreateOverlays.value, { key, info: card.info, id: card.id }]
  const timer = window.setTimeout(() => {
    finishLabCreate(key, card)
  }, CARD_CREATE_DURATION_MS)
  labCreateTimers.set(key, timer)
}

const finishLabCreate = (key: string, card: LabCard) => {
  labCreateOverlays.value = labCreateOverlays.value.filter((entry) => entry.key !== key)
  labCreateTimers.delete(key)
  addHiddenCard(card.id)
  labHandCards.value = [...labHandCards.value, card]
  nextTick(() => startLabCardTransfer(card))
}

const addHiddenCard = (cardId: number) => {
  const next = new Set(labHiddenCardIds.value)
  next.add(cardId)
  labHiddenCardIds.value = next
}

const removeHiddenCard = (cardId: number) => {
  const next = new Set(labHiddenCardIds.value)
  next.delete(cardId)
  labHiddenCardIds.value = next
}

const startLabCardTransfer = (card: LabCard, attempt = 0) => {
  const simulator = labSimulatorRef.value
  const createZone = labCreateZoneRef.value
  const target = labHandCardRefs.get(card.id)
  if (!simulator || !createZone || !target) {
    if (attempt < 5) {
      const retry = window.setTimeout(() => startLabCardTransfer(card, attempt + 1), 80)
      labTransferRetryTimers.set(card.id, retry)
    } else {
      removeHiddenCard(card.id)
      highlightRecent(card.id)
    }
    return
  }
  const zoneRect = simulator.getBoundingClientRect()
  const createRect = createZone.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const fromRect = new DOMRect(
    createRect.left + createRect.width / 2 - ACTION_CARD_WIDTH / 2,
    createRect.top + createRect.height / 2 - ACTION_CARD_HEIGHT / 2,
    ACTION_CARD_WIDTH,
    ACTION_CARD_HEIGHT,
  )
  spawnLabFloatingCard({
    card,
    fromRect,
    toRect: targetRect,
    zoneRect,
    duration: CARD_FLOAT_DURATION_MS,
    onComplete: () => {
      removeHiddenCard(card.id)
      highlightRecent(card.id)
    },
  })
}

const spawnLabFloatingCard = (options: {
  card: LabCard
  fromRect: DOMRect
  toRect: DOMRect
  zoneRect: DOMRect
  duration: number
  onComplete: () => void
}) => {
  const startLeft = options.fromRect.left - options.zoneRect.left
  const startTop = options.fromRect.top - options.zoneRect.top
  const targetLeft = options.toRect.left - options.zoneRect.left
  const targetTop = options.toRect.top - options.zoneRect.top
  const deltaX = targetLeft - startLeft
  const deltaY = targetTop - startTop
  const card = reactive<LabFloatingCard>({
    key: `lab-floating-${Date.now()}-${Math.random()}`,
    info: options.card.info,
    style: {
      width: `${options.fromRect.width}px`,
      height: `${options.fromRect.height}px`,
      left: `${startLeft}px`,
      top: `${startTop}px`,
      transform: 'translate(0, 0)',
    },
    active: false,
  })
  labFloatingCards.value = [...labFloatingCards.value, card]
  requestAnimationFrame(() => {
    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`
    card.active = true
  })
  window.setTimeout(() => {
    labFloatingCards.value = labFloatingCards.value.filter((entry) => entry !== card)
    options.onComplete()
  }, options.duration)
}

const highlightRecent = (cardId: number) => {
  labRecentCardId.value = cardId
  if (labRecentTimers.has(cardId)) {
    window.clearTimeout(labRecentTimers.get(cardId))
  }
  const timer = window.setTimeout(() => {
    if (labRecentCardId.value === cardId) {
      labRecentCardId.value = null
    }
    labRecentTimers.delete(cardId)
  }, 550)
  labRecentTimers.set(cardId, timer)
}

const resetLabCards = () => {
  labHandCards.value = []
  labRecentCardId.value = null
  labCreateOverlays.value = []
  labFloatingCards.value = []
  labHiddenCardIds.value = new Set()
  labCreateTimers.forEach((timer) => window.clearTimeout(timer))
  labRecentTimers.forEach((timer) => window.clearTimeout(timer))
  labTransferRetryTimers.forEach((timer) => window.clearTimeout(timer))
  labCreateTimers.clear()
  labRecentTimers.clear()
  labTransferRetryTimers.clear()
}

const registerLabHandCard = (cardId: number, el: Element | null) => {
  if (el) {
    labHandCardRefs.set(cardId, el as HTMLElement)
  } else {
    labHandCardRefs.delete(cardId)
  }
}

const isLabCardHidden = (cardId: number): boolean => {
  return labHiddenCardIds.value.has(cardId)
}

onBeforeUnmount(() => {
  labCreateTimers.forEach((timer) => window.clearTimeout(timer))
  labRecentTimers.forEach((timer) => window.clearTimeout(timer))
  labTransferRetryTimers.forEach((timer) => window.clearTimeout(timer))
  labCreateTimers.clear()
  labRecentTimers.clear()
  labTransferRetryTimers.clear()
})

// ---- Method A: FLIP ----
const flipLocation = ref<'spawn' | 'hand'>('spawn')
const flipCard = ref<LabCard>(createLabCard('FLIP'))
const flipCardRef = ref<HTMLElement | null>(null)
const flipAnimating = ref(false)

const registerFlipCard = (el: Element | null) => {
  flipCardRef.value = el as HTMLElement | null
}

const moveFlipCard = async (target: 'spawn' | 'hand') => {
  if (flipLocation.value === target || flipAnimating.value) {
    flipLocation.value = target
    return
  }
  const currentEl = flipCardRef.value
  if (!currentEl) {
    flipLocation.value = target
    await nextTick()
    return
  }
  flipAnimating.value = true
  const first = currentEl.getBoundingClientRect()
  flipLocation.value = target
  await nextTick()
  const newEl = flipCardRef.value
  if (!newEl) {
    flipAnimating.value = false
    return
  }
  const last = newEl.getBoundingClientRect()
  const dx = first.left - last.left
  const dy = first.top - last.top
  const sx = first.width / last.width
  const sy = first.height / last.height
  newEl.style.willChange = 'transform'
  newEl.style.transformOrigin = 'top left'
  newEl.style.transition = 'none'
  newEl.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
  requestAnimationFrame(() => {
    newEl.style.transition = 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)'
    newEl.style.transform = 'translate(0, 0) scale(1, 1)'
  })
  const handleEnd = () => {
    newEl.style.transition = ''
    newEl.style.transform = ''
    newEl.style.willChange = ''
    flipAnimating.value = false
    newEl.removeEventListener('transitionend', handleEnd)
  }
  newEl.addEventListener('transitionend', handleEnd)
}

const resetFlipCard = () => {
  flipLocation.value = 'spawn'
  flipCard.value = createLabCard('FLIP')
}

// ---- Method B: View Transitions ----
const viewTransitionSupported =
  typeof document !== 'undefined' && 'startViewTransition' in document
const viewCard = ref<LabCard>(createLabCard('ViewTransition'))
const viewLocation = ref<'spawn' | 'hand'>('spawn')

const moveViewCard = async (target: 'spawn' | 'hand') => {
  if (viewLocation.value === target) {
    return
  }
  const update = () => {
    viewLocation.value = target
  }
  if (viewTransitionSupported && typeof document !== 'undefined') {
    try {
      const transition = (document as any).startViewTransition(update)
      await transition?.finished
    } catch {
      update()
    }
  } else {
    update()
  }
}

const resetViewCard = () => {
  viewLocation.value = 'spawn'
  viewCard.value = createLabCard('ViewTransition')
}

// ---- Method D: Teleport Overlay ----
const teleportHandCards = ref<LabCard[]>([])
const teleportRecentId = ref<number | null>(null)
const teleportSpawnZoneRef = ref<HTMLElement | null>(null)
const teleportHandZoneRef = ref<HTMLElement | null>(null)
const teleportOverlayStyle = reactive({
  left: '0px',
  top: '0px',
  width: '120px',
  height: '170px',
  transform: 'translate3d(0, 0, 0)',
})
const teleportOverlayVisible = ref(false)
const teleportOverlayCard = ref<LabCard | null>(null)
const TELEPORT_DURATION_MS = 500
const teleportHighlightTimers = new Map<number, ReturnType<typeof window.setTimeout>>()

const playTeleportFlow = () => {
  const spawnRect = teleportSpawnZoneRef.value?.getBoundingClientRect()
  const handRect = teleportHandZoneRef.value?.getBoundingClientRect()
  if (!spawnRect || !handRect) {
    return
  }
  const card = createLabCard('Teleport')
  teleportOverlayCard.value = card
  teleportOverlayVisible.value = true
  const startLeft = spawnRect.left + spawnRect.width / 2 - ACTION_CARD_WIDTH / 2
  const startTop = spawnRect.top + spawnRect.height / 2 - ACTION_CARD_HEIGHT / 2
  teleportOverlayStyle.left = `${startLeft}px`
  teleportOverlayStyle.top = `${startTop}px`
  teleportOverlayStyle.width = `${ACTION_CARD_WIDTH}px`
  teleportOverlayStyle.height = `${ACTION_CARD_HEIGHT}px`
  teleportOverlayStyle.transform = 'translate3d(0, 0, 0)'
  requestAnimationFrame(() => {
    const targetLeft = handRect.left + handRect.width / 2 - ACTION_CARD_WIDTH / 2
    const targetTop = handRect.top + handRect.height / 2 - ACTION_CARD_HEIGHT / 2
    const dx = targetLeft - startLeft
    const dy = targetTop - startTop
    teleportOverlayStyle.transform = `translate3d(${dx}px, ${dy}px, 0)`
  })
  window.setTimeout(() => {
    teleportOverlayVisible.value = false
    teleportOverlayStyle.transform = 'translate3d(0, 0, 0)'
    teleportHandCards.value = [...teleportHandCards.value, card]
    highlightTeleportCard(card.id)
  }, TELEPORT_DURATION_MS)
}

const highlightTeleportCard = (cardId: number) => {
  teleportRecentId.value = cardId
  const existing = teleportHighlightTimers.get(cardId)
  if (existing) {
    window.clearTimeout(existing)
  }
  const timer = window.setTimeout(() => {
    if (teleportRecentId.value === cardId) {
      teleportRecentId.value = null
    }
    teleportHighlightTimers.delete(cardId)
  }, 550)
  teleportHighlightTimers.set(cardId, timer)
}

const resetTeleportCards = () => {
  teleportHandCards.value = []
  teleportRecentId.value = null
  teleportOverlayVisible.value = false
  teleportOverlayStyle.transform = 'translate3d(0, 0, 0)'
}

onBeforeUnmount(() => {
  teleportHighlightTimers.forEach((timer) => window.clearTimeout(timer))
  teleportHighlightTimers.clear()
})
</script>

<template>
  <main class="animation-lab">
    <header class="lab-intro">
      <h1>Card Animation Lab</h1>
      <p>card-create / card-eliminate を想定したアニメーション挙動を検証するページです。</p>
    </header>

    <section class="lab-section">
      <h2>Enter Animation (card-create)</h2>
      <p>生成アニメーションを選択して再生できます（Materialize / Reveal / 3D Flip / Spark）。</p>
      <div class="mode-switch">
        <label>
          <input v-model="enterAnimationMode" type="radio" value="spawn" />
          Materialize
        </label>
        <label>
          <input v-model="enterAnimationMode" type="radio" value="reveal" />
          Reveal
        </label>
        <label>
          <input v-model="enterAnimationMode" type="radio" value="flip" />
          3D Flip
        </label>
        <label>
          <input v-model="enterAnimationMode" type="radio" value="spark" />
          Spark
        </label>
      </div>
      <div class="button-row">
        <button type="button" class="lab-button" @click="playEnterAnimation">Play enter animation</button>
        <button type="button" class="lab-button lab-button--ghost" @click="enterCardVisible = false">
          Reset
        </button>
      </div>
      <div class="lab-stage">
        <Transition :name="`enter-${enterAnimationMode}`" mode="out-in">
          <ActionCard
            v-if="enterCardVisible"
            key="enter-card"
            v-bind="sampleCard"
            :operations="[]"
            :affordable="true"
          />
        </Transition>
      </div>
    </section>

    <section class="lab-section">
      <h2>Leave Animation (card-eliminate)</h2>
      <p>
        クリックでカードが消滅する様子を確認できます。従来の円形 / 渦巻ワイプに加え、焦げ穴 / SVG / 砂化 / リング燃焼の
        4 パターンを切り替えて比較できます。
      </p>
      <div class="mode-switch mode-switch--wrap">
        <span class="mode-switch__label">Classic</span>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="circle" />
          Circle
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="spiral" />
          Spiral
        </label>
      </div>
      <div class="mode-switch mode-switch--wrap">
        <span class="mode-switch__label">Burn Variants</span>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="burnout" />
          焦げ穴 Burnout
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="svg-burn" />
          SVG Burn
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="ash" />
          砂化 Ash
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="ringburn" />
          Ring Burn
        </label>
      </div>
      <div class="button-row">
        <button type="button" class="lab-button" @click="playLeaveAnimation">
          {{ leaveCardVisible ? 'Play leave animation' : 'Reset card' }}
        </button>
        <button
          v-if="!leaveCardVisible"
          type="button"
          class="lab-button lab-button--ghost"
          @click="leaveCardVisible = true"
        >
          Reset
        </button>
      </div>
      <div class="lab-stage">
        <Transition :name="leaveTransitionName" mode="out-in">
          <ActionCard
            v-if="leaveCardVisible"
            key="leave-card"
            v-bind="sampleCard"
            :operations="[]"
            :affordable="true"
          />
        </Transition>
      </div>
    </section>

    <svg class="lab-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <filter id="lab-burn-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>

    <section class="lab-section">
      <h2>方法A: FLIP (First–Last–Invert–Play)</h2>
      <p>
        DOM を移動させる前後で位置を取得し、差分を `transform` で補正してからアニメーションさせる FLIP 手法のデモです。
        生成エリア ⇔ 手札エリア間で移動させても滑らかな連続性を保てることを確認できます。
      </p>
      <div class="button-row">
        <button type="button" class="lab-button" @click="moveFlipCard('hand')" :disabled="flipLocation === 'hand'">
          中央 → 手札
        </button>
        <button type="button" class="lab-button" @click="moveFlipCard('spawn')" :disabled="flipLocation === 'spawn'">
          手札 → 中央
        </button>
        <button type="button" class="lab-button lab-button--ghost" @click="resetFlipCard">
          カードをリセット
        </button>
      </div>
      <div class="lab-flip-simulator">
        <div class="lab-flip-zone">
          <div class="lab-zone-label">生成エリア</div>
          <div v-if="flipLocation === 'spawn'" ref="flipCardRef" class="lab-demo-card">
            <ActionCard v-bind="flipCard.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
        <div class="lab-flip-zone">
          <div class="lab-zone-label">手札エリア</div>
          <div v-if="flipLocation === 'hand'" ref="flipCardRef" class="lab-demo-card">
            <ActionCard v-bind="flipCard.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section">
      <h2>方法B: View Transitions API</h2>
      <p>
        `view-transition-name` を与えた要素を View Transitions API で包むことで、ブラウザに移動アニメーションを任せる方式です。
        対応ブラウザでは DOM の再配置を自動的に補間し、座標差分を意識せずに滑らかな移動が得られます。
      </p>
      <div class="button-row">
        <button type="button" class="lab-button" @click="moveViewCard('hand')" :disabled="viewLocation === 'hand'">
          中央 → 手札
        </button>
        <button type="button" class="lab-button" @click="moveViewCard('spawn')" :disabled="viewLocation === 'spawn'">
          手札 → 中央
        </button>
        <button type="button" class="lab-button lab-button--ghost" @click="resetViewCard">
          カードをリセット
        </button>
      </div>
      <p v-if="!viewTransitionSupported" class="lab-hint">
        お使いのブラウザは View Transitions API をサポートしていません（通常の切り替えとして再生します）。
      </p>
      <div class="lab-view-simulator">
        <div class="lab-view-zone">
          <div class="lab-zone-label">生成エリア</div>
          <div v-if="viewLocation === 'spawn'" class="lab-demo-card lab-view-card" style="view-transition-name: lab-vt-card;">
            <ActionCard v-bind="viewCard.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
        <div class="lab-view-zone">
          <div class="lab-zone-label">手札エリア</div>
          <div v-if="viewLocation === 'hand'" class="lab-demo-card lab-view-card" style="view-transition-name: lab-vt-card;">
            <ActionCard v-bind="viewCard.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section">
      <h2>方法C: 固定オーバーレイ (position: absolute)</h2>
      <p>
        BattleHandArea 本体と同じ「固定オーバーレイ + transform」でカードを生成→手札へ移動する方式です。複数枚生成しても中央で重なり、
        座標差分をもとに 0.5 秒で手札へ流し込みます。
      </p>
      <div class="button-row">
        <button type="button" class="lab-button" @click="spawnLabCard">カード生成を再生</button>
        <button type="button" class="lab-button lab-button--ghost" @click="resetLabCards">Handをリセット</button>
      </div>
      <div ref="labSimulatorRef" class="lab-hand-simulator">
        <div ref="labCreateZoneRef" class="lab-create-zone">
          <div class="lab-create-caption">カード生成エリア</div>
          <TransitionGroup name="card-create" tag="div" class="card-create-overlay">
            <div v-for="overlay in labCreateOverlays" :key="overlay.key" class="card-create-node">
              <ActionCard v-bind="overlay.info" :operations="[]" :affordable="true" />
            </div>
          </TransitionGroup>
        </div>
        <div class="lab-hand-track-simulator">
          <div class="lab-hand-caption">Hand Track</div>
          <TransitionGroup name="lab-hand-card" tag="div" class="lab-hand-track">
            <div
              v-for="card in labHandCards"
              :key="card.id"
              class="lab-hand-card"
              :class="[
                labRecentCardId === card.id ? 'lab-hand-card--recent' : '',
                isLabCardHidden(card.id) ? 'lab-hand-card--hidden' : '',
              ]"
              :ref="(el) => registerLabHandCard(card.id, el)"
            >
              <ActionCard v-bind="card.info" :operations="[]" :affordable="true" variant="frame" />
            </div>
          </TransitionGroup>
        </div>
        <div class="lab-floating-layer" aria-hidden="true">
          <div
            v-for="ghost in labFloatingCards"
            :key="ghost.key"
            class="lab-floating-card"
            :class="ghost.active ? 'lab-floating-card--active' : ''"
            :style="ghost.style"
          >
            <ActionCard v-bind="ghost.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section">
      <h2>方法D: Teleport + Overlay レイヤー</h2>
      <p>
        いったん Teleport で画面最上位レイヤーにカードを描画し、`position: fixed` で座標を直接補間したあと、最終的に手札 DOM へ挿入する方式です。
        レイアウト階層の影響を受けず、大域座標で安定して移動させられます。
      </p>
      <div class="button-row">
        <button type="button" class="lab-button" @click="playTeleportFlow">カード生成を再生</button>
        <button type="button" class="lab-button lab-button--ghost" @click="resetTeleportCards">Handをリセット</button>
      </div>
      <div class="lab-teleport-simulator">
        <div ref="teleportSpawnZoneRef" class="lab-teleport-zone">
          <div class="lab-zone-label">生成エリア</div>
        </div>
        <div ref="teleportHandZoneRef" class="lab-teleport-zone lab-teleport-zone--hand">
          <div class="lab-zone-label">手札エリア</div>
          <TransitionGroup name="lab-hand-card" tag="div" class="lab-hand-track">
            <div
              v-for="card in teleportHandCards"
              :key="`teleport-${card.id}`"
              class="lab-hand-card"
              :class="teleportRecentId === card.id ? 'lab-hand-card--recent' : ''"
            >
              <ActionCard v-bind="card.info" :operations="[]" :affordable="true" variant="frame" />
            </div>
          </TransitionGroup>
        </div>
      </div>

      <Teleport to="#lab-overlay-root">
        <div v-if="teleportOverlayVisible && teleportOverlayCard" class="lab-teleport-card" :style="teleportOverlayStyle">
          <ActionCard v-bind="teleportOverlayCard.info" :operations="[]" :affordable="true" variant="frame" />
        </div>
      </Teleport>
    </section>
  </main>
  <div id="lab-overlay-root" class="lab-overlay-root" aria-hidden="true"></div>
</template>

<style scoped>
.animation-lab {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  color: #f8f2e7;
}

.lab-intro h1 {
  margin: 0 0 12px;
  font-size: 28px;
  letter-spacing: 0.08em;
}

.lab-intro p {
  margin: 0;
  color: rgba(248, 242, 231, 0.78);
  line-height: 1.6;
}

.lab-section {
  margin-top: 36px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(14, 12, 18, 0.85);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

.lab-section h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

:global(:root) {
  --lab-burn-ease: cubic-bezier(0.2, 0.9, 0.2, 1);
  --lab-burn-noise-img: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAFUlEQVR4nGP4z/D/fwYGBgaGhgYAAAwIAfK0Nn+sAAAAAElFTkSuQmCC');
}

.mode-switch {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.mode-switch--wrap {
  flex-wrap: wrap;
  align-items: center;
}

.mode-switch__label {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

.lab-defs {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
}

.button-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.lab-button {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(36, 28, 52, 0.8);
  color: #fff1d8;
  cursor: pointer;
  letter-spacing: 0.08em;
}

.lab-button:hover {
  background: rgba(54, 40, 72, 0.85);
}

.lab-button--ghost {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.4);
}

.lab-button--ghost:hover {
  background: rgba(255, 255, 255, 0.08);
}

.lab-stage {
  margin-top: 24px;
  min-height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lab-hint {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 200, 160, 0.8);
}

.lab-zone-label {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.lab-demo-card {
  width: 140px;
}

.lab-flip-simulator,
.lab-view-simulator {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.lab-flip-zone,
.lab-view-zone {
  position: relative;
  min-height: 200px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 12px;
}

.lab-view-card {
  isolation: isolate;
}

.lab-hand-simulator {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
}

.lab-create-zone {
  position: relative;
  min-height: 200px;
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.lab-create-caption,
.lab-hand-caption {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

.lab-hand-track-simulator {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(10, 8, 12, 0.85);
  overflow: hidden;
}

.lab-teleport-simulator {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.lab-teleport-zone {
  position: relative;
  min-height: 160px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.02);
}

.lab-teleport-zone--hand {
  padding: 16px;
  min-height: 220px;
}

.lab-hand-track {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 24px;
}

.lab-hand-card {
  width: 120px;
  transition: transform 0.25s ease, filter 0.25s ease;
}

.lab-hand-card--recent {
  animation: hand-card-recent 0.45s ease;
  filter: drop-shadow(0 0 12px rgba(255, 191, 134, 0.45));
}


.lab-hand-card--hidden {
  visibility: hidden;
}

.lab-hand-card-enter-from,
.lab-hand-card-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.lab-hand-card-enter-to,
.lab-hand-card-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.lab-hand-card-enter-active,
.lab-hand-card-leave-active {
  transition: opacity 250ms ease, transform 250ms ease;
}

:global(.card-wipe-enter-active),
:global(.card-wipe-leave-active) {
  transition: clip-path 420ms ease;
}

:global(.card-wipe-enter-from),
:global(.card-wipe-leave-to) {
  clip-path: circle(0% at 50% 50%);
}

:global(.card-wipe-enter-to),
:global(.card-wipe-leave-from) {
  clip-path: circle(120% at 50% 50%);
}

.card-create-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  display: flex;
  gap: 16px;
  pointer-events: none;
  z-index: 6;
}

.card-create-node {
  position: relative;
}

.card-create-enter-from {
  opacity: 0;
  transform: scale(0.7);
  filter: blur(10px);
}

.card-create-enter-to {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

.card-create-enter-active {
  transition:
    opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1s cubic-bezier(0.16, 1, 0.3, 1),
    filter 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-create-enter-active .card-create-node::after {
  content: '';
  position: absolute;
  inset: -10%;
  border-radius: 20px;
  background: radial-gradient(closest-side, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0));
  filter: blur(18px);
  opacity: 0;
  animation: card-create-halo 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-create-leave-active {
  transition: opacity 200ms ease;
}

.card-create-leave-from {
  opacity: 1;
}

.card-create-leave-to {
  opacity: 0;
}

/* materialize */
:global(.enter-spawn-enter-from) {
  opacity: 0;
  transform: scale(0.7);
  filter: blur(10px);
}

:global(.enter-spawn-enter-to) {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

:global(.enter-spawn-enter-active) {
  transition:
    opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1s cubic-bezier(0.16, 1, 0.3, 1),
    filter 1s cubic-bezier(0.16, 1, 0.3, 1);
}

:global(.enter-spawn-enter-active) :deep(.action-card)::before {
  content: '';
  position: absolute;
  inset: -8%;
  border-radius: inherit;
  background: radial-gradient(closest-side, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 70%);
  filter: blur(14px);
  opacity: 0;
  animation: halo 1s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes halo {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  60% {
    opacity: 0.9;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.25);
  }
}

/* reveal */
:global(.enter-reveal-enter-from) {
  opacity: 0;
  mask-size: 0% 0%;
  -webkit-mask-size: 0% 0%;
  mask-image: radial-gradient(circle at center, #000 0 0, transparent 0);
  -webkit-mask-image: radial-gradient(circle at center, #000 0 0, transparent 0);
  filter: blur(6px);
}

:global(.enter-reveal-enter-to) {
  opacity: 1;
  mask-size: 200% 200%;
  -webkit-mask-size: 200% 200%;
  filter: blur(0);
}

:global(.enter-reveal-enter-active) {
  transition:
    opacity 1s cubic-bezier(0.2, 0.9, 0.2, 1),
    mask-size 1s cubic-bezier(0.2, 0.9, 0.2, 1),
    -webkit-mask-size 1s cubic-bezier(0.2, 0.9, 0.2, 1),
    filter 1s cubic-bezier(0.2, 0.9, 0.2, 1);
}

/* flip */
:global(.enter-flip-enter-from) {
  opacity: 0;
  transform: rotateY(90deg) scale(0.96);
  filter: blur(4px);
}

:global(.enter-flip-enter-to) {
  opacity: 1;
  transform: rotateY(0deg) scale(1);
  filter: blur(0);
}

:global(.enter-flip-enter-active) {
  transition:
    transform 1s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 1s ease-out,
    filter 1s cubic-bezier(0.16, 1, 0.3, 1);
}

:global(.enter-flip-enter-active) :deep(.action-card) {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.lab-stage :deep(.action-card) {
  will-change: transform, opacity, filter;
}

/* spark */
:global(.enter-spark-enter-from) {
  opacity: 0;
  transform: scale(0.85);
}

:global(.enter-spark-enter-to) {
  opacity: 1;
  transform: scale(1);
}

:global(.enter-spark-enter-active) {
  transition: opacity 1s ease-out, transform 1s ease-out;
}

:global(.enter-spark-enter-active) :deep(.action-card) {
  position: relative;
  overflow: visible;
}

:global(.enter-spark-enter-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  filter: blur(1px);
  mix-blend-mode: screen;
  opacity: 0;
  transform: scale(0.5);
  box-shadow:
    -60px -10px 0 0 rgba(255, 255, 255, 0.9),
    70px -30px 0 0 rgba(255, 255, 255, 0.6),
    -30px 50px 0 0 rgba(255, 255, 255, 0.7),
    40px 60px 0 0 rgba(255, 255, 255, 0.8),
    -10px -70px 0 0 rgba(255, 255, 255, 0.5);
  animation: sparks 1s ease-out forwards;
}

@keyframes sparks {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}

@keyframes card-create-halo {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  60% {
    opacity: 0.9;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

@keyframes hand-card-recent {
  0% {
    transform: scale(0.9);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

:global(.card-spiral-enter-active),
:global(.card-spiral-leave-active) {
  animation: spiral-wipe 520ms ease forwards;
}

:global(.card-spiral-leave-active) {
  animation-direction: normal;
}

:global(.card-spiral-enter-active) {
  animation-direction: reverse;
}

@property --spiral-angle {
  syntax: '<angle>';
  initial-value: 0turn;
  inherits: false;
}

@property --burn-radius {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}

@property --svg-burn-progress {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}

@property --ringburn-progress {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}

@keyframes spiral-wipe {
  from {
    --spiral-angle: 0turn;
    clip-path: path(
      'M0 0 H100 V100 H0 Z M50 50 L50 8 A42 42 0 1 1 92 50 Z'
    );
  }
  to {
    --spiral-angle: 1turn;
    clip-path: path(
      'M0 0 H100 V100 H0 Z M50 50 L50 50 A1 1 0 1 1 51 50 Z'
    );
  }
}

:global(.card-spiral-enter-active),
:global(.card-spiral-leave-active) {
  position: relative;
  overflow: hidden;
  animation: conic-spin 520ms linear infinite;
}

.card-spiral-enter-active::after,
.card-spiral-leave-active::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 16px;
  background:
    radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.12), transparent 55%),
    conic-gradient(
      from var(--spiral-angle, 0turn),
      rgba(255, 255, 255, 0.35) 0deg,
      rgba(122, 85, 255, 0.45) 120deg,
      rgba(255, 149, 72, 0.45) 240deg,
      rgba(255, 255, 255, 0.35) 360deg
    );
  mix-blend-mode: screen;
  pointer-events: none;
  filter: blur(1px);
}

@keyframes conic-spin {
  to {
    --spiral-angle: 1turn;
  }
}

/* 焦げ穴 Burnout */
:global(.card-burnout-enter-from),
:global(.card-burnout-leave-to) {
  opacity: 0;
  transform: scale(0.98);
  --burn-radius: 120%;
}

:global(.card-burnout-enter-to),
:global(.card-burnout-leave-from) {
  opacity: 1;
  transform: scale(1);
  --burn-radius: 0%;
}

:global(.card-burnout-enter-active),
:global(.card-burnout-leave-active) {
  transition:
    opacity 700ms var(--lab-burn-ease),
    transform 700ms var(--lab-burn-ease),
    --burn-radius 700ms var(--lab-burn-ease);
}

:global(.card-burnout-leave-active) :deep(.action-card) {
  position: relative;
  -webkit-mask-image:
    radial-gradient(circle at center, transparent 0 var(--burn-radius), #000 calc(var(--burn-radius) + 1%)),
    var(--lab-burn-noise-img);
  mask-image:
    radial-gradient(circle at center, transparent 0 var(--burn-radius), #000 calc(var(--burn-radius) + 1%)),
    var(--lab-burn-noise-img);
  -webkit-mask-repeat: no-repeat, repeat;
  mask-repeat: no-repeat, repeat;
  -webkit-mask-position: 50% 50%, 0 0;
  mask-position: 50% 50%, 0 0;
  -webkit-mask-size: 220% 220%, auto;
  mask-size: 220% 220%, auto;
}

:global(.card-burnout-leave-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: -10%;
  border-radius: inherit;
  background: radial-gradient(closest-side, rgba(255, 148, 43, 0.35), rgba(255, 148, 43, 0));
  filter: blur(12px);
  opacity: 0;
  animation: burnGlow 700ms var(--lab-burn-ease);
  pointer-events: none;
}

@keyframes burnGlow {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  40% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: scale(1.25);
  }
}

@keyframes ember {
  0% {
    opacity: 0;
  }
  40% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
  }
}

/* SVG Burn inspired */
:global(.card-svg-burn-enter-from),
:global(.card-svg-burn-leave-to) {
  opacity: 0;
  transform: scale(0.96);
  --svg-burn-progress: 120%;
}

:global(.card-svg-burn-enter-to),
:global(.card-svg-burn-leave-from) {
  opacity: 1;
  transform: scale(1);
  --svg-burn-progress: 0%;
}

:global(.card-svg-burn-enter-active),
:global(.card-svg-burn-leave-active) {
  transition:
    opacity 700ms var(--lab-burn-ease),
    transform 700ms var(--lab-burn-ease),
    --svg-burn-progress 700ms var(--lab-burn-ease);
}

:global(.card-svg-burn-leave-active) :deep(.action-card) {
  position: relative;
  overflow: visible;
  animation: svgBurnMask 700ms var(--lab-burn-ease) forwards;
}

:global(.card-svg-burn-leave-active) :deep(.action-card)::before {
  content: '';
  position: absolute;
  inset: -8%;
  border-radius: inherit;
  background: radial-gradient(circle at center, rgba(17, 8, 2, 0) calc(var(--svg-burn-progress) - 6%), rgba(10, 4, 1, 0.9) var(--svg-burn-progress));
  -webkit-mask-image: radial-gradient(circle at center, transparent calc(var(--svg-burn-progress) - 4%), #000 calc(var(--svg-burn-progress) + 2%));
  mask-image: radial-gradient(circle at center, transparent calc(var(--svg-burn-progress) - 4%), #000 calc(var(--svg-burn-progress) + 2%));
  filter: url(#lab-burn-noise);
  mix-blend-mode: multiply;
  pointer-events: none;
}

:global(.card-svg-burn-leave-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: -12%;
  border-radius: inherit;
  background: radial-gradient(closest-side, rgba(255, 190, 120, 0.4), rgba(255, 190, 120, 0));
  opacity: 0;
  filter: blur(16px);
  animation: ember 700ms var(--lab-burn-ease);
  pointer-events: none;
}

@keyframes svgBurnMask {
  from {
    --svg-burn-progress: 0%;
  }
  to {
    --svg-burn-progress: 120%;
  }
}

/* 砂化 Ash */
:global(.card-ash-enter-from),
:global(.card-ash-leave-to) {
  opacity: 0;
  transform: translateY(4px);
}

:global(.card-ash-enter-to),
:global(.card-ash-leave-from) {
  opacity: 1;
  transform: translateY(0);
}

:global(.card-ash-enter-active),
:global(.card-ash-leave-active) {
  transition: opacity 620ms ease, transform 620ms ease;
}

:global(.card-ash-leave-active) :deep(.action-card) {
  position: relative;
  -webkit-mask-image: linear-gradient(to top, transparent 0% 25%, #000 55% 100%);
  mask-image: linear-gradient(to top, transparent 0% 25%, #000 55% 100%);
  -webkit-mask-position: 50% 0%;
  mask-position: 50% 0%;
  -webkit-mask-size: 100% 220%;
  mask-size: 100% 220%;
  animation: ashMask 620ms ease forwards;
}

:global(.card-ash-leave-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 10%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  mix-blend-mode: screen;
  filter: blur(0.5px);
  box-shadow:
    -40px 6px 0 0 rgba(200, 200, 200, 0.9),
    10px -3px 0 0 rgba(220, 220, 220, 0.7),
    30px 1px 0 0 rgba(230, 230, 230, 0.7),
    -20px -4px 0 0 rgba(210, 210, 210, 0.8),
    45px 5px 0 0 rgba(200, 200, 200, 0.6);
  animation: ashRise 620ms ease-out forwards;
  pointer-events: none;
}

@keyframes ashMask {
  0% {
    -webkit-mask-position: 50% 0%;
    mask-position: 50% 0%;
  }
  100% {
    -webkit-mask-position: 50% 100%;
    mask-position: 50% 100%;
  }
}

@keyframes ashRise {
  0% {
    opacity: 0;
    transform: translate(-50%, 0) scale(1);
  }
  20% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -34px) scale(0.9);
  }
}

/* Ring Burn */
:global(.card-ringburn-enter-from),
:global(.card-ringburn-leave-to) {
  opacity: 0;
  transform: scale(0.96);
  --ringburn-progress: 0%;
}

:global(.card-ringburn-enter-to),
:global(.card-ringburn-leave-from) {
  opacity: 1;
  transform: scale(1);
  --ringburn-progress: 60%;
}

:global(.card-ringburn-enter-active),
:global(.card-ringburn-leave-active) {
  transition:
    opacity 640ms var(--lab-burn-ease),
    transform 640ms var(--lab-burn-ease),
    --ringburn-progress 640ms var(--lab-burn-ease);
}

:global(.card-ringburn-leave-active) :deep(.action-card) {
  position: relative;
  -webkit-mask-image: radial-gradient(closest-side, #000 calc(var(--ringburn-progress) - 2%), transparent var(--ringburn-progress));
  mask-image: radial-gradient(closest-side, #000 calc(var(--ringburn-progress) - 2%), transparent var(--ringburn-progress));
  animation: ringburnErode 640ms var(--lab-burn-ease) forwards;
}

:global(.card-ringburn-leave-active) :deep(.action-card)::before {
  content: '';
  position: absolute;
  inset: -6%;
  border-radius: inherit;
  background: conic-gradient(
      from 0turn,
      rgba(255, 180, 0, 0) 0turn,
      rgba(255, 120, 0, 0.45) 0.85turn,
      rgba(255, 180, 0, 0) 1turn
    );
  filter: blur(10px);
  opacity: 0;
  animation:
    emberRing 320ms ease-out forwards,
    emberFade 640ms ease-out 160ms forwards;
  pointer-events: none;
}

:global(.card-ringburn-leave-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: -8%;
  border-radius: inherit;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 180, 0, 0.4), transparent 50%),
    radial-gradient(circle at 12% 82%, rgba(255, 90, 0, 0.25), transparent 55%);
  opacity: 0;
  animation: ember 640ms var(--lab-burn-ease);
  pointer-events: none;
}

@keyframes ringburnErode {
  0% {
    --ringburn-progress: 60%;
  }
  100% {
    --ringburn-progress: 2%;
  }
}

@keyframes emberRing {
  from {
    opacity: 0;
    transform: rotate(0turn);
  }
  to {
    opacity: 0.9;
    transform: rotate(0.75turn);
  }
}

@keyframes emberFade {
  to {
    opacity: 0;
  }
}

::view-transition-old(lab-vt-card),
::view-transition-new(lab-vt-card) {
  animation: none;
  mix-blend-mode: normal;
}

@media (prefers-reduced-motion: reduce) {
  :global(.enter-spawn-enter-active),
  :global(.enter-reveal-enter-active),
  :global(.enter-flip-enter-active),
  :global(.enter-spark-enter-active),
  :global(.card-wipe-enter-active),
  :global(.card-wipe-leave-active),
  :global(.card-spiral-enter-active),
  :global(.card-spiral-leave-active),
  :global(.card-burnout-enter-active),
  :global(.card-burnout-leave-active),
  :global(.card-svg-burn-enter-active),
  :global(.card-svg-burn-leave-active),
  :global(.card-ash-enter-active),
  :global(.card-ash-leave-active),
  :global(.card-ringburn-enter-active),
  :global(.card-ringburn-leave-active),
  .card-create-enter-active {
    transition-duration: 200ms !important;
    animation-duration: 200ms !important;
  }

.lab-floating-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 8;
}

.lab-floating-card {
  position: absolute;
  display: block;
  opacity: 0;
  transform: translate3d(0, 0, 0);
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease;
  width: 94px;
  height: 140px;
}

.lab-floating-card--active {
  opacity: 1;
}

.lab-floating-card :deep(.action-card) {
  width: 94px;
  height: 140px;
  pointer-events: none;
}
  .card-create-enter-active .card-create-node::after {
    animation-duration: 200ms !important;
  }
}

.lab-teleport-card {
  position: fixed;
  pointer-events: none;
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
  transform: translate3d(0, 0, 0);
  z-index: 1000;
}

.lab-overlay-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
}
</style>
