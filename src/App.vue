<script setup lang="ts"></script>

<template>
  <div class="page">
    <div class="game-screen">
      <div class="game-window">
        <h1 class="title">被虐のシスター</h1>
      </div>
    </div>
    <section class="instructions">
      <h2>操作メモ</h2>
      <p>
        ここにはゲームの基本操作や、今後追加されるシステムの解説を記載します。開発中はテスト用のメモやチェックリストをまとめ、ゲーム
        内での確認事項を整理していきます。
      </p>
      <ul>
        <li>カードのドラフトやデッキ編集のルールを明確化する</li>
        <li>敵の攻撃記録がどのタイミングでカード化されるか記録する</li>
        <li>暫定の難易度調整方針やパラメータをノートしておく</li>
      </ul>
    </section>
  </div>
</template>

<style>
html,
body {
  margin: 0;
  background-color: #ffffff;
  color: #1f1f1f;
  font-family: 'Inter', 'Noto Sans JP', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  min-height: 100vh;
}

.game-screen {
  flex: 1 0 auto;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  box-sizing: border-box;
}

.game-window {
  width: 1280px;
  aspect-ratio: 16 / 9;
  background-color: #000000;
  color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.title {
  font-size: 64px;
  letter-spacing: 0.12em;
  margin: 0;
}

.instructions {
  width: 100%;
  max-width: 1280px;
  padding: 32px 24px 64px;
  box-sizing: border-box;
  line-height: 1.8;
}

.instructions h2 {
  margin: 0 0 16px;
  font-size: 28px;
}

.instructions ul {
  margin: 16px 0 0 20px;
  padding: 0;
}

.instructions li {
  margin-bottom: 8px;
}

@media (max-width: 1320px) {
  .game-window {
    width: 100%;
    max-width: 100%;
  }

  .title {
    font-size: clamp(32px, 6vw, 64px);
  }
}
</style>
