<script setup lang="ts">
import GameLayout from '@/components/GameLayout.vue'
import HpGauge from '@/components/HpGauge.vue'

type EnemySkill = {
  name: string
  detail: string
}

type EnemyTrait = {
  name: string
  detail: string
}

type EnemyInfo = {
  id: string
  name: string
  hp: {
    current: number
    max: number
  }
  skills: EnemySkill[]
  traits?: EnemyTrait[]
  image: string
}

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
    name: 'オークダンサー',
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
                <article
                  class="enemy-card"
                  v-for="enemy in enemies"
                  :key="enemy.id"
                  :style="{ backgroundImage: `url(${enemy.image})` }"
                >
                  <div class="enemy-overlay">
                    <header class="enemy-header">
                      <div class="enemy-title">
                        <h4>{{ enemy.name }}</h4>
                        <div class="enemy-hp">
                          <HpGauge :current="enemy.hp.current" :max="enemy.hp.max" />
                        </div>
                      </div>
                    </header>
                    <section v-if="enemy.skills.length" class="enemy-skills">
                      <div class="skill-line">
                        <span class="skill-name">{{ enemy.skills[0].name }}</span>
                        <span class="skill-detail">{{ enemy.skills[0].detail }}</span>
                      </div>
                    </section>
                    <section v-if="enemy.traits?.length" class="enemy-traits">
                      <h5>特性</h5>
                      <ul>
                        <li v-for="trait in enemy.traits" :key="trait.name">
                          <span class="trait-name">{{ trait.name }}</span>
                          <span class="trait-detail">{{ trait.detail }}</span>
                        </li>
                      </ul>
                    </section>
                  </div>
                </article>
              </div>
            </section>

            <section class="hand-zone">
              <div class="hand-toolbar">
                <div class="resource-group">
                  <div class="resource">
                    <span class="resource-label">マナ</span>
                    <span class="resource-value">{{ mana.current }} / {{ mana.max }}</span>
                  </div>
                  <div class="resource">
                    <span class="resource-label">デッキ</span>
                    <span class="resource-value">{{ deckCount }}</span>
                  </div>
                  <div class="resource">
                    <span class="resource-label">捨て札</span>
                    <span class="resource-value">{{ discardCount }}</span>
                  </div>
                </div>
                <button class="end-turn-button" type="button">エンドターン</button>
              </div>
              <div class="hand-grid">
                <div class="card-slot" v-for="card in 6" :key="card">
                  <div class="card-title">記憶カード {{ card }}</div>
                  <p class="card-body">被ダメージの記憶を再生し、敵へ反撃を行う。</p>
                </div>
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
            </div>
            <div class="player-info">
              <h3>プレイヤー情報</h3>
              <div class="stat-section">
                <span class="stat-label">HP</span>
                <HpGauge :current="72" :max="80" />
              </div>
              <p>精神耐久 40 / 50</p>
              <p>防御バフ +3</p>
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
  padding: 20px;
  box-sizing: border-box;
  min-height: 0;
}

.enemy-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  flex: 1;
  min-height: 0;
}

.enemy-card {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 320px;
  border-radius: 18px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.45);
}

.enemy-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 12, 20, 0.15) 20%, rgba(12, 12, 24, 0.8) 100%);
}

.enemy-overlay {
  position: relative;
  width: 100%;
  margin: 0 18px 18px;
  padding: 16px 18px;
  background: rgba(10, 12, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
}

.enemy-title {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.enemy-title h4 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.06em;
}

.enemy-hp {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.enemy-skills,
.enemy-traits {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-line {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enemy-traits ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.enemy-traits li {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-name,
.trait-name {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.skill-detail,
.trait-detail {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.5;
}

.hand-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.resource-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.resource {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(12, 12, 24, 0.65);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
}

.resource-label {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
}

.resource-value {
  font-size: 18px;
  letter-spacing: 0.08em;
}

.end-turn-button {
  background: linear-gradient(135deg, #f24a6d, #ff758c);
  color: #ffffff;
  font-size: 16px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: none;
  border-radius: 999px;
  padding: 12px 26px;
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.card-slot {
  background: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.card-body {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.85);
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

.player-info {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  background: rgba(12, 12, 25, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  padding: 14px 18px;
  text-align: left;
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
}

.player-info h3 {
  margin: 0 0 10px;
  font-size: 17px;
  letter-spacing: 0.06em;
}

.stat-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.76);
}

.player-info p {
  margin: 4px 0;
  font-size: 14px;
}

.portrait {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.portrait-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 10px;
}

ol {
  margin: 16px 0 0 20px;
  padding: 0;
}
</style>
