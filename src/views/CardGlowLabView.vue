<!--
CardGlowLabView の責務:
- ActionCard の枠が回転する光沢を帯びるアニメーション案を個別に検証する。
- 既存カードスタイルを崩さず、追加の CSS アニメーションだけで効果を付加する。

責務ではないこと:
- BattleHandArea 等への組み込み。ここでは純粋にデザイン検証のみを行う。

主な通信相手:
- ActionCard: 実際に描画するカード。v-bind でスタブデータを渡す。
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import ActionCard from '@/components/ActionCard.vue'
import { Library } from '@/domain/library/Library'

const glowEnabled = ref(true)
const library = new Library()
const sampleCard = computed(() => {
  const first = library.listActionCards(1)[0]
  return first ?? null
})
</script>

<template>
  <main class="glow-lab">
    <header class="lab-intro">
      <h1>Card Glow Lab</h1>
      <p>ActionCard の縁を回転光で彩るアニメーションを検証する実験ページです。</p>
    </header>

    <section class="lab-section">
      <h2>Border Glow</h2>
      <p>トグルで光るカード枠を切り替えられます。</p>
      <label class="lab-toggle">
        <input v-model="glowEnabled" type="checkbox" />
        <span>縁の光沢を有効化</span>
      </label>
      <div class="lab-stage" :class="{ 'lab-stage--glow': glowEnabled }">
        <ActionCard v-if="sampleCard" v-bind="sampleCard" :operations="[]" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.glow-lab {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  color: #f8f2e7;
}

.lab-intro h1 {
  margin: 0 0 12px;
  font-size: 28px;
  letter-spacing: 0.08em;
}

.lab-section {
  margin-top: 36px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(16, 14, 22, 0.9);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

.lab-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.lab-stage {
  margin-top: 24px;
  min-height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lab-stage--glow :deep(.action-card) {
  position: relative;
  border: 2px solid transparent;
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  animation: gradient-angle 2s infinite linear;
}

.lab-stage--glow :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 16px;
  padding: 2px;
  background-image:
    linear-gradient(#1a1307, #1a1307),
    conic-gradient(
      from var(--gradient-angle, 0turn),
      #584827 0%,
      #c7a03c 32%,
      #f9de90 36%,
      #c7a03c 40%,
      #584827 60%,
      #c7a03c 82%,
      #f9de90 86%,
      #c7a03c 90%,
      #584827 100%
    );
  background-origin: border-box;
  background-clip: content-box, border-box;
  animation: gradient-angle 2s infinite linear;
  z-index: -1;
}

.lab-stage--glow :deep(.action-card)::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
  mix-blend-mode: screen;
}

@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0turn;
  inherits: false;
}

@keyframes gradient-angle {
  to {
    --gradient-angle: 1turn;
  }
}
</style>
