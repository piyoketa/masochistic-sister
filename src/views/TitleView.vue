<script setup lang="ts">
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'

const router = useRouter()

const navigateNext = () => {
  router.push({ name: 'battle' })
}
</script>

<template>
  <GameLayout window-clickable @window-click="navigateNext">
    <template #window>
      <div class="title-block">
        <h1 class="title">被虐のシスター</h1>
        <p class="subtitle">クリックして開始</p>
      </div>
    </template>
    <template #instructions>
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
    </template>
  </GameLayout>
</template>

<style scoped>
.title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin: auto;
}

.title {
  font-size: clamp(36px, 6vw, 72px);
  letter-spacing: 0.12em;
  margin: 0;
}

.subtitle {
  margin: 0;
  font-size: clamp(16px, 2.2vw, 24px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d5d5d5;
}
</style>
