<script setup lang="ts">
import GameLayout from '@/components/GameLayout.vue'
import HpGauge from '@/components/HpGauge.vue'
import ActionCard from '@/components/ActionCard.vue'
import EnemyCard from '@/components/EnemyCard.vue'
import type { EnemyInfo, CardInfo } from '@/types/battle'

const enemies: EnemyInfo[] = [
  {
    id: 'orc',
    name: 'オーク',
    hp: { current: 50, max: 50 },
    skills: [
      { name: 'たいあたり', detail: '20ダメージ' },
      { name: 'ビルドアップ', detail: '攻撃力を+10する' },
    ],
    image: '/assets/enemies/orc.jpg',
  },
  {
    id: 'orc-dancer',
    name: 'オークダンサー（短剣）',
    hp: { current: 50, max: 50 },
    skills: [
      { name: '乱れ突き', detail: '10 × 2' },
      { name: '加速', detail: '攻撃回数を+1する' },
    ],
    image: '/assets/enemies/orc-dancer.jpg',
  },
  {
    id: 'snail',
    name: 'かたつむり',
    hp: { current: 10, max: 10 },
    skills: [
      { name: '酸を吐く', detail: '5ダメージ + 溶解付与' },
      { name: 'たいあたり', detail: '10ダメージ' },
    ],
    traits: [{ name: '硬い殻', detail: 'ダメージを-20する' }],
    image: '/assets/enemies/snail.jpg',
  },
  {
    id: 'kamaitachi',
    name: 'かまいたち',
    hp: { current: 20, max: 20 },
    skills: [
      {
        name: '追い風',
        detail: '味方の攻撃回数を＋1する',
      },
      { name: '乱れ突き', detail: '5 × 4回攻撃' },
    ],
    traits: [{ name: '臆病', detail: '「臆病」以外の敵がいない時、逃げる' }],
    image: '/assets/enemies/kamaitachi.jpg',
  },
]

const mana = {
  current: 3,
  max: 3,
}

const deckCount = 18
const discardCount = 5

const baseCards: CardInfo[] = [
  {
    id: 'heaven-chain',
    title: '天の鎖',
    type: 'skill',
    cost: 1,
    illustration: '⛓️',
    description: 'このターン、敵1体の動きを止める',
    notes: ['［消費］使用すると、この戦闘中は除去される'],
  },
  {
    id: 'battle-prep',
    title: '戦いの準備',
    type: 'skill',
    cost: 1,
    illustration: '🛡️',
    description: '次のターン、マナ＋1',
  },
  {
    id: 'slap',
    title: 'はたく',
    type: 'attack',
    cost: 1,
    illustration: '🤜',
    description: '10ダメージ',
    attackStyle: 'single',
  },
  {
    id: 'flurry',
    title: '乱れ突き',
    type: 'attack',
    cost: 1,
    illustration: '🗡️',
    description: '5ダメージ × 4',
    attackStyle: 'multi',
  },
  {
    id: 'melt',
    title: '溶解',
    type: 'status',
    cost: 1,
    illustration: '🔥',
    description: 'ダメージを受ける時、＋10',
    notes: ['［消費］使用すると、この戦闘中は除去される'],
  },
  {
    id: 'sticky',
    title: 'ねばねば',
    type: 'status',
    cost: 1,
    illustration: '🕸️',
    description: '連続攻撃を受ける時、回数＋1',
    notes: ['［消費］使用すると、この戦闘中は除去される'],
  },
]

const handCards: CardInfo[] = Array.from({ length: 20 }, (_, index) => {
  const template = baseCards[index % baseCards.length]
  return {
    ...template,
    id: `${template.id}-${index}`,
    notes: template.notes ? [...template.notes] : undefined,
  }
})
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="battle-layout">
        <header class="battle-header">
          <div class="header-left">
            <h2>第二階層・礼拝堂</h2>
            <span>遭遇 1 / 8</span>
          </div>
          <div class="header-right">
            <span>ターン 3</span>
            <span>カード消費 2 / 3</span>
          </div>
        </header>

        <div class="battle-body">
          <main class="battle-main">
            <section class="enemy-zone">
              <div class="enemy-grid">
                <EnemyCard v-for="enemy in enemies" :key="enemy.id ?? enemy.name" :enemy="enemy" />
              </div>
            </section>

            <section class="hand-zone">
              <div class="hand-grid">
                <ActionCard
                  v-for="card in handCards"
                  :key="card.id"
                  :title="card.title"
                  :type="card.type"
                  :cost="card.cost"
                  :illustration="card.illustration"
                  :description="card.description"
                  :notes="card.notes"
                  :attack-style="card.attackStyle"
                />
              </div>
            </section>
          </main>

          <aside class="battle-sidebar">
            <div class="portrait">
              <img
                src="/assets/characters/sister.jpg"
                alt="聖女の立ち絵"
                class="portrait-image"
                decoding="async"
              />
              <div class="sidebar-overlay">
                <div class="mana-pop">
                  <span class="overlay-label">マナ</span>
                  <span class="overlay-value">{{ mana.current }} / {{ mana.max }}</span>
                </div>
                <HpGauge :current="72" :max="80" />
                <div class="overlay-row">
                  <span class="overlay-label">デッキ</span>
                  <span class="overlay-value">{{ deckCount }}</span>
                </div>
                <div class="overlay-row">
                  <span class="overlay-label">捨て札</span>
                  <span class="overlay-value">{{ discardCount }}</span>
                </div>
                <button class="end-turn-button overlay" type="button">ターン終了</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </template>
    <template #instructions>
      <h2>次フェーズの指針</h2>
      <ol>
        <li>敵の攻撃記録カードをデッキへ追加し、挙動を検証する</li>
        <li>プレイヤー行動のターン進行と、ステータス更新順序を整理する</li>
        <li>演出・SEのタイミングを試し、緊張感を高められるか確認する</li>
      </ol>
    </template>
  </GameLayout>
</template>

<style scoped>
.battle-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top left, rgba(48, 48, 72, 0.9), rgba(12, 12, 16, 0.95));
  border-radius: 0;
  border: none;
  overflow: hidden;
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  background: linear-gradient(90deg, rgba(120, 97, 190, 0.22), rgba(70, 69, 122, 0.35));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
}

.header-left span {
  font-size: 14px;
  opacity: 0.85;
}

.header-right {
  display: flex;
  gap: 16px;
  font-size: 14px;
  opacity: 0.9;
}

.battle-body {
  display: grid;
  grid-template-columns: 1fr 200px;
  flex: 1;
  min-height: 0;
}

.battle-main {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(28, 28, 48, 0.75), rgba(18, 18, 24, 0.85));
  gap: 0;
  flex: 1;
  min-height: 0;
}

.enemy-zone,
.hand-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
  padding: 16px;
  box-sizing: border-box;
  min-height: 0;
}

.enemy-zone {
  flex: 0 0 38%;
  max-height: 38%;
}



.hand-zone {
  flex: 1 1 auto;
  background: rgba(245, 245, 250, 0.18);
}

.enemy-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  flex: 1;
  min-height: 0;
  align-content: start;
}

.hand-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.resource-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.resource {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(12, 12, 24, 0.65);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
}

.resource-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}

.resource-value {
  font-size: 16px;
  letter-spacing: 0.08em;
}

.end-turn-button {
  background: linear-gradient(135deg, #f24a6d, #ff758c);
  color: #ffffff;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(242, 74, 109, 0.35);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.end-turn-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(242, 74, 109, 0.45);
}

.hand-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 18px 24px;
  flex: 1;
  min-height: 0;
  justify-items: center;
  align-content: start;
  overflow-y: auto;
  padding: 30px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 16px;
}

.battle-sidebar {
  position: relative;
  display: flex;
  padding: 0;
  background: #0e0e18;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
}

.portrait {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  position: relative;
}

.portrait-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 10px;
}

.sidebar-overlay {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(12, 12, 25, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  backdrop-filter: blur(6px);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.45);
}

.mana-pop {
  position: absolute;
  top: -64px;
  right: 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(255, 227, 115, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.45);
}

.mana-pop .overlay-label,
.mana-pop .overlay-value {
  color: #402510;
  font-weight: 700;
}

.sidebar-overlay .end-turn-button.overlay {
  align-self: flex-end;
}

.overlay-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  letter-spacing: 0.05em;
}

.overlay-label {
  color: rgba(255, 255, 255, 0.7);
}

.overlay-value {
  color: rgba(255, 255, 255, 0.95);
}

ol {
  margin: 16px 0 0 20px;
  padding: 0;
}
</style>
