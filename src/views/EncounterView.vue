<script setup lang="ts">
import GameLayout from '@/components/GameLayout.vue'
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
              <h3>敵ユニット一覧</h3>
              <div class="enemy-grid">
                <div class="enemy-card" v-for="enemy in 4" :key="enemy">
                  <div class="enemy-name">敵ユニット {{ enemy }}</div>
                  <div class="enemy-stats">
                    <p>HP 60 / 80</p>
                    <p>次ターン：斬撃 (14x2)</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="hand-zone">
              <h3>手札</h3>
              <div class="hand-grid">
                <div class="card-slot" v-for="card in 6" :key="card">
                  <div class="card-title">記憶カード {{ card }}</div>
                  <p class="card-body">被ダメージの記憶を再生し、敵へ反撃を行う。</p>
                </div>
              </div>
            </section>
          </main>

          <aside class="battle-sidebar">
            <div class="player-info">
              <h3>プレイヤー情報</h3>
              <p>HP 72 / 80</p>
              <p>精神耐久 40 / 50</p>
              <p>防御バフ +3</p>
            </div>
            <div class="portrait">
              <p>立ち絵表示エリア</p>
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
  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top left, rgba(48, 48, 72, 0.9), rgba(12, 12, 16, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  overflow: hidden;
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  min-height: 56px;
  background: linear-gradient(90deg, rgba(120, 97, 190, 0.22), rgba(70, 69, 122, 0.35));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 0;
  min-height: calc(100% - 56px);
}

.battle-main {
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  background: linear-gradient(180deg, rgba(28, 28, 48, 0.75), rgba(18, 18, 24, 0.85));
}

.enemy-zone,
.hand-zone {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.enemy-zone h3,
.hand-zone h3 {
  margin: 0 0 16px;
  font-size: 18px;
  letter-spacing: 0.08em;
}

.enemy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.enemy-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.enemy-name {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.enemy-stats p {
  margin: 0;
  font-size: 14px;
}

.hand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
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
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 20px;
  background: linear-gradient(180deg, rgba(90, 68, 130, 0.6), rgba(40, 32, 72, 0.9));
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.player-info {
  background: rgba(18, 18, 32, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 16px;
  text-align: left;
}

.player-info h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.player-info p {
  margin: 4px 0;
  font-size: 14px;
}

.portrait {
  flex: 1;
  background: rgba(18, 18, 32, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
}

ol {
  margin: 16px 0 0 20px;
  padding: 0;
}
</style>
