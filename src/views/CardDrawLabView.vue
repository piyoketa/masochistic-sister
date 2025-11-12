<script setup lang="ts">
import { nextTick, ref } from 'vue'
import ActionCard from '@/components/ActionCard.vue'
import type { CardTagInfo, CardType } from '@/types/battle'

interface LabCard {
  id: number
  title: string
  type: CardType
  cost: number
  illustration?: string
  description: string
  primaryTags?: CardTagInfo[]
  effectTags?: CardTagInfo[]
  categoryTags?: CardTagInfo[]
}

const CARD_TEMPLATES: Omit<LabCard, 'id'>[] = [
  {
    title: '炎刃スラッシュ',
    type: 'attack',
    cost: 1,
    illustration: '🔥',
    description: '敵単体に 8 ダメージ。',
    primaryTags: [{ id: 'tag-type-attack', label: '攻撃' }],
  },
  {
    title: 'オーラ防御',
    type: 'skill',
    cost: 1,
    illustration: '🛡️',
    description: '防御 +6 を得る。',
    primaryTags: [{ id: 'tag-type-skill', label: '補助' }],
  },
  {
    title: '毒の余韻',
    type: 'status',
    cost: 2,
    illustration: '🧪',
    description: '敵に腐食(2)を付与。',
    primaryTags: [{ id: 'tag-type-status', label: '状態異常' }],
  },
  {
    title: '陽光チャージ',
    type: 'skill',
    cost: 0,
    illustration: '🔆',
    description: 'カードを 1 枚引く。',
    primaryTags: [{ id: 'tag-type-skill', label: '補助' }],
  },
  {
    title: '乱れ撃ち',
    type: 'attack',
    cost: 2,
    illustration: '💥',
    description: '3 回 x 3 ダメージ。',
    primaryTags: [{ id: 'tag-type-attack', label: '攻撃' }],
  },
  {
    title: '猛毒の棘',
    type: 'attack',
    cost: 1,
    illustration: '🌿',
    description: '敵単体に 4 ダメージ + 毒(3)。',
    primaryTags: [{ id: 'tag-type-attack', label: '攻撃' }],
  },
  {
    title: '迅速移動',
    type: 'skill',
    cost: 1,
    illustration: '💨',
    description: '次の攻撃カードのコスト -1。',
    primaryTags: [{ id: 'tag-type-skill', label: '補助' }],
  },
  {
    title: '血の契約',
    type: 'status',
    cost: 1,
    illustration: '🩸',
    description: 'ターン終了時にダメージ +2（自身に2ダメージ）。',
    primaryTags: [{ id: 'tag-type-status', label: '状態異常' }],
  },
]

const DRAW_ANIMATION_MS = 600
const DRAW_STAGGER_DELAY_MS = 100
const DRAW_ANIMATION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'

const deckCards = ref<LabCard[]>([])
const handCards = ref<LabCard[]>([])
const stageRef = ref<HTMLElement | null>(null)
const deckRef = ref<HTMLElement | null>(null)
const handCardRefs = new Map<number, HTMLElement>()

const drawAmount = ref(1)

resetDeck()

function resetDeck(): void {
  const shuffled = shuffle([
    ...CARD_TEMPLATES,
    ...CARD_TEMPLATES.map((template, index) => ({
      ...template,
      title: `${template.title}＋${index + 1}`,
    })),
  ]).map((template, index) => ({
    id: Date.now() + index,
    ...template,
  }))
  deckCards.value = shuffled
  handCards.value = []
  handCardRefs.clear()
}

function drawCards(count: number): void {
  const actual = Math.max(1, Math.min(count, deckCards.value.length))
  for (let i = 0; i < actual; i += 1) {
    const card = deckCards.value.shift()
    if (!card) {
      break
    }
    handCards.value = [...handCards.value, card]
    const delayMs = i * DRAW_STAGGER_DELAY_MS
    nextTick(() => animateCardFromDeck(card, delayMs))
  }
}

function animateCardFromDeck(card: LabCard, delayMs = 0): void {
  const deck = deckRef.value
  const target = handCardRefs.get(card.id)
  if (!deck || !target) {
    return
  }

  if (delayMs > 0) {
    target.style.transition = 'none'
    target.style.opacity = '0'
    target.style.willChange = 'opacity'
  }

  const startAnimation = () => {
    const deckRect = deck.getBoundingClientRect()
    const cardRect = target.getBoundingClientRect()
    const deltaX = deckRect.left + deckRect.width / 2 - (cardRect.left + cardRect.width / 2)
    const deltaY = deckRect.top + deckRect.height / 2 - (cardRect.top + cardRect.height / 2)
    const scaleX = deckRect.width / cardRect.width
    const scaleY = deckRect.height / cardRect.height

    target.style.transition = 'none'
    target.style.transformOrigin = 'center center'
    target.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`
    target.style.opacity = '0'
    target.style.willChange = 'transform, opacity'
    target.style.zIndex = '3'

    requestAnimationFrame(() => {
      const opacityDuration = Math.round(DRAW_ANIMATION_MS * 0.55)
      target.style.transition = [
        `transform ${DRAW_ANIMATION_MS}ms ${DRAW_ANIMATION_EASING}`,
        `opacity ${opacityDuration}ms cubic-bezier(0.3, 0.95, 0.45, 1)`,
      ].join(', ')
      target.style.transform = 'translate3d(0, 0, 0) scale(1)'
      target.style.opacity = '1'
    })

    window.setTimeout(() => {
      cleanupInlineAnimation(target)
    }, DRAW_ANIMATION_MS + 80)
  }

  if (delayMs > 0) {
    window.setTimeout(startAnimation, delayMs)
  } else {
    startAnimation()
  }
}

function registerHandCard(cardId: number, el: Element | null): void {
  if (!cardId) {
    return
  }
  if (el) {
    handCardRefs.set(cardId, el as HTMLElement)
  } else {
    handCardRefs.delete(cardId)
  }
}

function discardHand(): void {
  handCards.value = []
  handCardRefs.clear()
}

function cleanupInlineAnimation(el: HTMLElement): void {
  el.style.transition = ''
  el.style.transform = ''
  el.style.opacity = ''
  el.style.willChange = ''
  el.style.zIndex = ''
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
</script>

<template>
  <main class="draw-lab">
    <header class="draw-lab__intro">
      <h1>Card Draw Lab</h1>
      <p>山札 → 手札へのカードドロー演出を検証するための実験ページです。</p>
    </header>

    <section class="draw-panel">
      <div class="draw-panel__controls">
        <label class="draw-panel__amount">
          ドロー枚数
          <input v-model.number="drawAmount" type="number" min="1" max="5" />
        </label>
        <button type="button" class="draw-button" @click="drawCards(drawAmount)">ドロー</button>
        <button type="button" class="draw-button" @click="resetDeck">デッキをリセット</button>
        <button type="button" class="draw-button draw-button--ghost" @click="discardHand">
          手札を空にする
        </button>
      </div>
      <ul class="draw-panel__status">
        <li>山札: {{ deckCards.length }} 枚</li>
        <li>手札: {{ handCards.length }} 枚</li>
      </ul>
    </section>

    <section ref="stageRef" class="draw-stage">
      <div class="draw-stage__deck" ref="deckRef">
        <span class="draw-stage__deck-label">DECK</span>
        <span class="draw-stage__deck-count">{{ deckCards.length }}</span>
      </div>
      <div class="draw-stage__hand">
        <div
          v-for="card in handCards"
          :key="card.id"
          class="draw-hand-card"
          :ref="(el) => registerHandCard(card.id, el)"
        >
          <ActionCard v-bind="card" :operations="[]" :affordable="true" variant="frame" />
          <p class="draw-hand-card__label">{{ card.title }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.draw-lab {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  color: #f8f2e7;
}

.draw-lab__intro h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.draw-panel {
  margin-top: 24px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(14, 12, 18, 0.85);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.draw-panel__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.draw-panel__amount {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.draw-panel__amount input {
  width: 80px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(8, 6, 12, 0.8);
  color: inherit;
}

.draw-button {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(36, 28, 52, 0.8);
  color: #fff;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition: background 0.2s ease, transform 0.2s ease;
}

.draw-button:hover {
  background: rgba(54, 40, 72, 0.85);
  transform: translateY(-1px);
}

.draw-button--ghost {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.4);
}

.draw-panel__status {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
}

.draw-stage {
  position: relative;
  margin-top: 32px;
  border-radius: 18px;
  background: rgba(10, 8, 12, 0.85);
  padding: 32px 24px 48px;
  overflow: hidden;
}

.draw-stage__deck {
  width: 120px;
  height: 170px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.draw-stage__deck-label {
  font-size: 13px;
}

.draw-stage__deck-count {
  font-size: 20px;
  margin-top: 4px;
}

.draw-stage__hand {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 170px;
}

.draw-hand-card {
  width: 140px;
  position: relative;
}

.draw-hand-card__label {
  margin: 8px 0 0;
  font-size: 13px;
  letter-spacing: 0.06em;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}
</style>
