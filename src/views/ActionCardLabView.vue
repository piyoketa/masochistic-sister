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
import { buildCardInfoFromBlueprint, listStandardSampleCardBlueprints, type CardBlueprint } from '@/domain/library/Library'
import type { CardInfo } from '@/types/battle'

// 実験に使うカードは、Libraryが返すサンプルセットをそのまま利用する。
const cardBlueprints: CardBlueprint[] = listStandardSampleCardBlueprints()

const showcaseCards: CardInfo[] = cardBlueprints
  .map((blueprint, index) => buildCardInfoFromBlueprint(blueprint, `lab-${index}`))
  .filter((card): card is CardInfo => card !== null)
const skillAttackCards = showcaseCards.filter((card) => card.type !== 'status')
const statusComparisonCards = showcaseCards.filter((card) => card.type === 'status')
</script>

<template>
  <main class="card-lab">
    <section class="card-lab__section card-lab__section--experimental-c">
      <CardList
        :cards="[...skillAttackCards, ...statusComparisonCards]"
        :height="360"
        title=""
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

.card-lab__section--experimental-c :deep(.action-card--status) {
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 64, 128, 0.45), transparent 52%),
    radial-gradient(circle at 80% 15%, rgba(140, 0, 255, 0.35), transparent 55%),
    linear-gradient(185deg, #4b003a 0%, #1b0013 100%) !important;
  border-color: rgba(255, 88, 150, 0.85);
  box-shadow:
    0 0 14px rgba(255, 64, 140, 0.35),
    inset 0 0 8px rgba(107, 0, 72, 0.55);
}

</style>
