<!--
TraitHighlightDemoView の責務:
- TraitState の isImportant 強調アニメーションを目視確認するためのデモ画面を提供する。
- EnemyCard に重要Traitと通常Stateを流し込み、ハイライトの差分を確認しやすい構成にする。

責務ではないこと:
- バトル進行や実際の敵行動の再生は行わない。純粋に見た目確認専用。

主なインターフェース:
- EnemyCard: `enemy: EnemyInfo` を渡して描画。states に `isImportant` が付いた Trait を含める。
- ボタン操作: 「再生」ボタンでカードを再マウントし、アニメーションを再生し直す。
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import EnemyCard from '@/components/EnemyCard.vue'
import type { EnemyInfo } from '@/types/battle'

const version = ref(0)

const baseEnemy: EnemyInfo = {
  id: 1,
  name: 'ハイライトデモ敵',
  image: '/assets/enemies/snail.jpg',
  status: 'active',
  hp: { current: 80, max: 120 },
  skills: [],
  states: [
    {
      id: 'state-hard-shell',
      name: '鉄壁',
      description: '被ダメージ-20（重要Trait）',
      magnitude: 20,
      stackable: true,
      category: 'trait',
      isImportant: true,
    },
    {
      id: 'state-flight',
      name: 'ダメージ固定',
      description: 'ダメージは常に1（重要Trait）',
      stackable: false,
      category: 'trait',
      isImportant: true,
    },
    {
      id: 'state-strength',
      name: '打点上昇',
      description: '与ダメージ+10（通常Buff）',
      magnitude: 10,
      stackable: true,
      category: 'buff',
    },
  ],
}

const enemyForRender = computed<EnemyInfo>(() => ({
  ...baseEnemy,
  // key再生成のため states 配列はそのまま流す
}))

async function replay(): Promise<void> {
  version.value += 1
  await nextTick()
}
</script>

<template>
  <div class="page">
    <header class="demo-header">
      <div>
        <h1 class="demo-title">Trait Highlight Demo</h1>
        <p class="demo-sub">isImportant な Trait に枠のポップ演出が付くことを確認するデモ</p>
      </div>
      <button class="demo-button" type="button" @click="replay">再生</button>
    </header>

    <main class="demo-body">
      <EnemyCard :key="version" :enemy="enemyForRender" selectable />
      <section class="hint">
        <p>・鉄壁 / ダメージ固定: Trait + isImportant → 縁が明るくポップします。</p>
        <p>・打点上昇: Buff → 強調なしで通常表示。</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.page {
  max-width: 920px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #e8eefc;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.demo-title {
  font-size: 22px;
  margin: 0;
}

.demo-sub {
  margin: 6px 0 0;
  color: #a9b4cc;
  font-size: 14px;
}

.demo-button {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffc778, #ff8f56);
  color: #1b0f10;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.demo-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4);
}

.demo-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.hint {
  flex: 1;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #cfd7ec;
  font-size: 14px;
  line-height: 1.5;
}
</style>
