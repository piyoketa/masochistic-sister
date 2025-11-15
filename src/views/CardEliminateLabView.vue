<!--
CardEliminateLabView の責務:
- 砂化アニメーション（card-eliminate）の単体デモを提供し、ActionCard が下→上ワイプと粒子演出で消える様子を確認できるようにする。
- ボタン操作でカードの生成 / 砂化 / リセットを行い、ログに簡易的な出力を残す。

責務ではないこと:
- Battle 本編や ViewManager との統合。ここはあくまで演出確認専用のラボページ。
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import CardList from '@/components/CardList.vue'
import { Library } from '@/domain/library/Library'
import type { CardInfo, CardType } from '@/types/battle'

const library = new Library()
const fallbackCard: CardInfo = {
  id: 'lab-card',
  title: '砂化テスト',
  type: 'skill',
  cost: 2,
  illustration: '🜂',
  description: 'テスト用のカード\n砂化演出を確認できます。',
  descriptionSegments: [],
  primaryTags: [{ id: 'tag-type-skill', label: '演出' }],
  effectTags: [],
  categoryTags: [],
  attackStyle: 'single',
  damageAmount: 0,
  damageCount: 0,
}
type CardCandidateKey = 'heaven-chain' | 'flurry' | 'corrosion'

type CardCandidateConfig = {
  key: CardCandidateKey
  title: string
  type: CardType
  description: string
  particleColor: string
}

const cardConfigs: CardCandidateConfig[] = [
  {
    key: 'heaven-chain',
    title: '天の鎖',
    type: 'skill',
    description: '敵を拘束し、行動不能にする聖鎖。',
    particleColor: 'rgba(255, 230, 150, 0.9)',
  },
  {
    key: 'flurry',
    title: '乱れ突き',
    type: 'attack',
    description: '怒涛の連撃で敵を切り刻む攻撃カード。',
    particleColor: 'rgba(255, 210, 120, 0.95)',
  },
  {
    key: 'corrosion',
    title: '腐食',
    type: 'status',
    description: '酸で装甲を蝕む状態異常カード。',
    particleColor: 'rgba(255, 150, 190, 0.95)',
  },
]

const libraryCards = library.listActionCards(999)

const buildFallbackForConfig = (config: CardCandidateConfig): CardInfo => ({
  ...fallbackCard,
  id: `lab-card-${config.key}`,
  title: config.title,
  type: config.type,
  description: config.description,
})

const candidateEntries = cardConfigs.map((config) => {
  const found = libraryCards.find((card) => card.title === config.title && card.type === config.type)
  return {
    ...config,
    card: found ?? buildFallbackForConfig(config),
  }
})

const cardEntryMap = new Map(candidateEntries.map((entry) => [entry.key, entry]))

const selectedCardKey = ref<CardCandidateKey>(candidateEntries[0]?.key ?? 'heaven-chain')

const currentCardEntry = computed(() => cardEntryMap.get(selectedCardKey.value))
const currentCard = computed(() => currentCardEntry.value?.card ?? fallbackCard)
const currentParticleColor = computed(
  () => currentCardEntry.value?.particleColor ?? 'rgba(235, 235, 235, 0.9)',
)

const stageRef = ref<HTMLElement | null>(null)
const cardListContainer = ref<HTMLElement | null>(null)
const cardRef = ref<HTMLElement | null>(null)
const cardVisible = ref(true)
const isDespawning = ref(false)
const logs = ref<string[]>([])

type AshOverlayOptions = {
  motionScale?: number
  durationScale?: number
  horizontalSpreadScale?: number
  particleColor?: string
}

type AshPattern = 'default' | 'short'

const patternSettings: Record<AshPattern, { logLabel: string; overlayOptions?: AshOverlayOptions }> = {
  default: { logLabel: '通常', overlayOptions: undefined },
  short: {
    logLabel: '短縮',
    overlayOptions: { motionScale: 0.6, durationScale: 0.6, horizontalSpreadScale: 0.6 },
  },
}

const log = (message: string) => {
  const stamp = new Date().toLocaleTimeString()
  logs.value = [...logs.value.slice(-30), `[${stamp}] ${message}`]
}

const spawnCard = () => {
  cardVisible.value = true
  isDespawning.value = false
  log(`カード生成: ${currentCard.value.title}`)
  syncCardElement()
}

const resetCard = () => {
  spawnCard()
  log('リセット: 新しいカードを配置')
}

const ensureCard = () => {
  if (!cardVisible.value) {
    spawnCard()
  }
}

const selectCard = (key: CardCandidateKey) => {
  if (selectedCardKey.value === key) {
    return
  }
  selectedCardKey.value = key
}

const despawnCard = (pattern: AshPattern = 'default') => {
  if (!cardVisible.value || isDespawning.value) {
    log('砂化: カード無し')
    return
  }
  const dom = cardRef.value
  if (!dom) {
    log('砂化: DOM未取得')
    return
  }
  const rect = dom.getBoundingClientRect()
  const overlayOptions = {
    ...(patternSettings[pattern]?.overlayOptions ?? {}),
    particleColor: currentParticleColor.value,
  }
  spawnAshOverlay(rect, overlayOptions)
  dom.classList.add('ash-despawn')
  isDespawning.value = true
  const patternLabel = patternSettings[pattern]?.logLabel ?? pattern
  log(`砂化(${patternLabel}): 再生開始`)
  window.setTimeout(() => {
    dom.classList.remove('ash-despawn')
    cardVisible.value = false
    isDespawning.value = false
    log(`砂化(${patternLabel}): 完了`)
  }, 1000 + 150)
}

const syncCardElement = () => {
  nextTick(() => {
    if (!cardVisible.value) {
      if (cardRef.value) {
        cardRef.value.classList.remove('ash-card', 'ash-despawn')
      }
      cardRef.value = null
      return
    }
    const container = cardListContainer.value
    const target = container?.querySelector('.card-list__item') as HTMLElement | null
    if (target && target !== cardRef.value) {
      cardRef.value?.classList.remove('ash-card-container', 'ash-despawn')
      target.classList.add('ash-card-container')
      cardRef.value = target
    }
  })
}

onMounted(() => {
  syncCardElement()
})

watch(
  () => cardVisible.value,
  (visible) => {
    if (visible) {
      syncCardElement()
    } else if (cardRef.value) {
      cardRef.value.classList.remove('ash-card-container', 'ash-despawn')
      cardRef.value = null
    }
  },
)

watch(
  () => selectedCardKey.value,
  () => {
    cardVisible.value = true
    isDespawning.value = false
    log(`表示カード切替: ${currentCard.value.title}`)
    syncCardElement()
  },
)

const spawnAshOverlay = (rect: DOMRect, options: AshOverlayOptions = {}) => {
  const motionScale = options.motionScale ?? 1
  const durationScale = options.durationScale ?? 1
  const horizontalScale = options.horizontalSpreadScale ?? motionScale
  const particleColor = options.particleColor ?? 'rgba(235, 235, 235, 0.9)'
  const overlay = document.createElement('div')
  overlay.className = 'ash-overlay'
  Object.assign(overlay.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  })
  document.body.appendChild(overlay)

  const width = rect.width
  const height = rect.height
  const particleCount = 72
  const fragment = document.createDocumentFragment()
  let maxDelay = 0
  let maxDuration = 0

  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement('i')
    particle.className = 'particle'

    const x = (Math.random() * 0.7 + 0.15) * width
    const y = (Math.random() * 0.55 + 0.4) * height
    const dx = (Math.random() * 120 - 60) * horizontalScale
    const dy = -(Math.random() * 110 + 50) * motionScale
    const size = (Math.random() * 3.5 + 2).toFixed(2) + 'px'
    const delay = Math.round(Math.random() * 220 * durationScale)
    const duration = Math.round((900 + Math.random() * 400) * durationScale)

    maxDelay = Math.max(maxDelay, delay)
    maxDuration = Math.max(maxDuration, duration)

    particle.style.setProperty('--p-x', `${x.toFixed(2)}px`)
    particle.style.setProperty('--p-y', `${y.toFixed(2)}px`)
    particle.style.setProperty('--p-dx', `${dx.toFixed(2)}px`)
    particle.style.setProperty('--p-dy', `${dy.toFixed(2)}px`)
    particle.style.setProperty('--p-size', size)
    particle.style.setProperty('--p-delay', `${delay}ms`)
    particle.style.setProperty('--p-dur', `${duration}ms`)
    particle.style.background = particleColor
    particle.style.boxShadow = `0 0 0 1px ${particleColor}`
    fragment.appendChild(particle)
  }

  overlay.appendChild(fragment)
  const total = maxDelay + maxDuration + 120
  window.setTimeout(() => overlay.remove(), total)
}
</script>

<template>
  <main class="ash-demo">
    <header class="toolbar">
      <button type="button" @click="ensureCard">中央に生成</button>
      <button type="button" @click="despawnCard()">消滅：砂化</button>
      <button type="button" @click="despawnCard('short')">消滅：砂化（短縮）</button>
      <button type="button" @click="resetCard">リセット</button>
    </header>
    <nav class="card-switcher">
      <button
        v-for="entry in candidateEntries"
        :key="entry.key"
        type="button"
        class="card-switcher__button"
        :class="{ 'card-switcher__button--active': entry.key === selectedCardKey }"
        @click="selectCard(entry.key)"
      >
        {{ entry.title }}
      </button>
    </nav>
    <section ref="stageRef" class="stage">
      <div class="spawn-area">
        <div ref="cardListContainer" class="card-list-host">
          <CardList
            v-if="cardVisible"
            :key="selectedCardKey"
            :cards="[currentCard]"
            :hover-effect="false"
            :no-height-limit="true"
            :force-playable="true"
          />
        </div>
      </div>
      <p class="hint">中央で生成 → 「消滅：砂化」でワイプ強調＋粒子を確認できます</p>
    </section>
    <pre class="log-view" aria-live="polite">{{ logs.join('\n') }}</pre>
  </main>
</template>

<style scoped>
:global(:root) {
  --ash-duration: 1200ms;
  --ash-ease: cubic-bezier(0.2, 0.9, 0.2, 1);
}

.ash-demo {
  min-height: 100vh;
  margin: 0;
  padding: 24px;
  background: radial-gradient(1200px 700px at 50% 10%, #1a2146 0%, #0f1220 60%);
  color: #eef2ff;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  display: grid;
  gap: 20px;
  place-items: center;
}

.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  background: #161a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

button {
  appearance: none;
  border: none;
  padding: 10px 14px;
  border-radius: 12px;
  background: #273056;
  color: #e7ecff;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: transform 0.12s ease, background 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  background: #2f3a6e;
}

button:active {
  transform: translateY(0);
}

.card-switcher {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.card-switcher__button {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.05);
  color: #f5f5ff;
  border-radius: 999px;
  padding: 6px 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.12s ease;
}

.card-switcher__button:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.12);
}

.card-switcher__button--active {
  background: rgba(255, 208, 112, 0.25);
  border-color: rgba(255, 208, 112, 0.85);
  color: #ffe8c2;
}

.stage {
  position: relative;
  width: min(880px, 96vw);
  height: 60vh;
  min-height: 420px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 14px 48px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.spawn-area {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.hint {
  position: absolute;
  inset: auto 0 12px 0;
  text-align: center;
  color: #aab3ff;
  opacity: 0.7;
  font-size: 12px;
}

:global(.ash-demo .card-list__item) {
  width: 150px;
  height: 210px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

:global(.ash-card-container) {
  position: relative;
  overflow: visible;
  width: 150px;
  height: 210px;
  /* 砂化の輪郭をくっきり見せたいので、透過→不透過の遷移帯を狭くする */
  -webkit-mask-image: linear-gradient(to top, transparent 0 32%, rgba(0, 0, 0, 0.95) 38% 100%);
  mask-image: linear-gradient(to top, transparent 0 32%, rgba(0, 0, 0, 0.95) 38% 100%);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 260%;
  mask-size: 100% 260%;
  -webkit-mask-position: 50% 0%;
  mask-position: 50% 0%;
}
:global(.ash-card-container .action-card) {
  pointer-events: auto;
}
:global(.ash-card-container.ash-despawn) {
  animation:
    ashMask var(--ash-duration) var(--ash-ease) forwards,
    ashFade var(--ash-duration) var(--ash-ease) forwards;
}

:global(.ash-overlay) {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  left: 0;
  top: 0;
}

:global(.particle) {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--p-size, 3px);
  height: var(--p-size, 3px);
  border-radius: 50%;
  background: rgba(235, 235, 235, 0.9);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  filter: blur(0.4px);
  mix-blend-mode: screen;
  opacity: 0;
  transform: translate(var(--p-x, 0px), var(--p-y, 0px));
  animation: ashParticle var(--p-dur, var(--ash-duration)) ease-out var(--p-delay, 0ms) forwards;
  will-change: transform, opacity;
}

@keyframes ashMask {
  0% {
    -webkit-mask-position: 50% 0%;
    mask-position: 50% 0%;
  }
  100% {
    -webkit-mask-position: 50% 120%;
    mask-position: 50% 120%;
  }
}

@keyframes ashFade {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(2px);
  }
}

@keyframes ashParticle {
  0% {
    opacity: 0;
    transform: translate(var(--p-x, 0px), var(--p-y, 0px)) scale(1);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(
        calc(var(--p-x, 0px) + var(--p-dx, 0px)),
        calc(var(--p-y, 0px) + var(--p-dy, -70px))
      )
      scale(0.9);
  }
}

.log-view {
  width: min(880px, 96vw);
  min-height: 120px;
  max-height: 160px;
  overflow: auto;
  padding: 12px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  font-size: 12px;
  letter-spacing: 0.04em;
}
</style>
