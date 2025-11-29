<!--
HpGaugeDemoView の責務:
- HpGauge に predicted 値を渡した際の警告表示（黄色点滅）を確認するデモ画面。
- current/max/predicted を操作できるコントロールを提供し、即時にゲージへ反映する。

非責務:
- バトルロジックや実際の被ダメ計算は行わない。あくまで見た目確認用。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import HpGauge from '@/components/HpGauge.vue'

const max = ref(150)
const current = ref(150)
const predicted = ref(90)

const percentInfo = computed(() => {
  const pct = max.value > 0 ? Math.round((current.value / max.value) * 100) : 0
  const pctPred =
    max.value > 0 && predicted.value >= 0 ? Math.round((predicted.value / max.value) * 100) : null
  return { pct, pctPred }
})
</script>

<template>
  <div class="demo">
    <header>
      <h1>HpGauge デモ</h1>
      <p>predicted を設定し、現在値との差分が黄色点滅することを確認します。</p>
    </header>

    <section class="controls">
      <label>
        Max:
        <input v-model.number="max" type="number" min="1" />
      </label>
      <label>
        Current:
        <input v-model.number="current" type="number" :min="0" :max="max" />
      </label>
      <label>
        Predicted:
        <input v-model.number="predicted" type="number" :min="0" :max="max" />
      </label>
      <div class="info">
        <span>現在: {{ percentInfo.pct }}%</span>
        <span v-if="percentInfo.pctPred !== null">予測: {{ percentInfo.pctPred }}%</span>
      </div>
    </section>

    <section class="gauge-area">
      <HpGauge :current="current" :max="max" :predicted="predicted" />
    </section>
  </div>
</template>

<style scoped>
.demo {
  min-height: 100vh;
  padding: 24px clamp(16px, 4vw, 48px);
  color: #f5f2ff;
  background: radial-gradient(circle at top, rgba(34, 28, 63, 0.95), rgba(9, 9, 14, 0.95));
  box-sizing: border-box;
}

header h1 {
  margin: 0 0 6px;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

input[type='number'] {
  background: rgba(18, 18, 28, 0.9);
  color: #f5f2ff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px 8px;
  width: 120px;
}

.info {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: rgba(245, 242, 255, 0.8);
}

.gauge-area {
  margin-top: 20px;
  max-width: 420px;
}
</style>
