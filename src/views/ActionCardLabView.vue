<!--
ActionCardLabView の責務:
- Library から取得した `CardInfo` を CardList へ渡し、既存デザインと実験的配色を比較表示する専用ページを提供する。
- 実験パラメータ（例: カード枚数、配色説明）を UI テキストとして明示し、他ページへ影響を与えない形で ActionCard の見た目検証を行う。

責務ではないこと:
- Battle 進行や Operation キュー制御などゲーム本編の状態管理。
- Action 定義やカード配色そのものの恒久的適用。ここではあくまで比較用スタイルを局所的に上書きする。

主な通信相手とインターフェース:
- Library: `listActionCards(limitPerType)` で代表的なカードを取得。
- CardList: before/after セクションに同一データを渡し、配色差分を CSS で切り替える。
- Vue Router: `/lab/action-cards` ルートで遷移し、他画面とは疎に結合する。
-->
<script setup lang="ts">
import CardList from '@/components/CardList.vue'
import { Library } from '@/domain/library/Library'

const SAMPLE_LIMIT = 3
const library = new Library()
const showcaseCards = library.listActionCards(SAMPLE_LIMIT)
const skillAttackCards = showcaseCards.filter((card) => card.type !== 'status')
const statusComparisonCards = showcaseCards.filter((card) => card.type === 'status')
</script>

<template>
  <main class="card-lab">
    <header class="card-lab__intro">
      <h1>ActionCard実験場</h1>
      <p>
        Library から取得した代表的なカードを並べ、最終採用した「上下逆転グラデーション」デザインを確認できます。
      </p>
    </header>

    <section class="card-lab__section card-lab__section--experimental-c">
      <h2>実験的デザインC（上下逆転グラデーション）</h2>
      <p>
        スキル: 従来配色の上下をひっくり返し、穏やかな色味を下に配置。<br />
        アタック: 実験デザインの上下を逆転させ、炎の起点をカード中央付近へ寄せる。
      </p>
      <CardList
        :cards="[...skillAttackCards, ...statusComparisonCards]"
        :height="360"
        title="スキル/アタック/状態異常（逆転配色）"
      />
    </section>

  </main>
</template>

<style scoped>
.card-lab {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  color: #f8f2e7;
}

.card-lab__intro h1 {
  margin: 0 0 12px;
  font-size: 28px;
  letter-spacing: 0.08em;
}

.card-lab__intro p {
  margin: 0;
  color: rgba(248, 242, 231, 0.78);
  line-height: 1.6;
}

.card-lab__section {
  margin-top: 40px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(12, 10, 16, 0.65);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.card-lab__section h2 {
  margin: 0 0 12px;
  font-size: 20px;
  letter-spacing: 0.1em;
}

.card-lab__section p {
  margin: 0 0 16px;
  color: rgba(248, 242, 231, 0.78);
  line-height: 1.5;
}

.card-lab__section--experimental {
  border: 1px solid rgba(255, 230, 150, 0.35);
  background: rgba(26, 21, 33, 0.78);
}

.card-lab__section--experimental :deep(.action-card--skill) {
  background:
    radial-gradient(circle at 82% 82%, rgba(91, 163, 82, 0.55), transparent 55%),
    linear-gradient(180deg, #fff3d0 0%, #dff282 55%, #b7e257 100%) !important;
}

.card-lab__section--experimental :deep(.action-card--attack) {
  background:
    radial-gradient(circle at 82% 82%, rgba(255, 140, 64, 0.55), transparent 55%),
    linear-gradient(180deg, #fff3d0 0%, #ffd87a 55%, #f6a13a 100%) !important;
}

.card-lab__section--experimental :deep(.action-card) {
  background-blend-mode: screen;
}

.card-lab__section--experimental-c {
  border: 1px solid rgba(255, 200, 150, 0.4);
  background: rgba(30, 22, 18, 0.8);
}

.card-lab__section--experimental-c :deep(.action-card--skill) {
  background: linear-gradient(180deg, #f0d09b 0%, #fff3d0 100%) !important;
}

.card-lab__section--experimental-c :deep(.action-card--attack) {
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 140, 64, 0.55), transparent 55%),
    linear-gradient(0deg, #fff3d2 0%, #ffd87a 55%, #f6783a 100%) !important;
}

</style>
