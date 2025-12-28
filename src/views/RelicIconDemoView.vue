<!--
RelicIconDemoView の責務:
- レリックアイコンのUI状態（field/passive/active）の見た目をまとめて確認できるデモを提供する。
- トグル操作で「条件未達」「発動中」「処理中」などの表示を切り替え、スタイルを検証しやすくする。

責務ではないこと:
- バトル進行や実データの取得。ここではダミーデータのみを使用し、副作用を発生させない。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import RelicList from '@/components/RelicList.vue'
import type { RelicDisplayEntry, RelicUiState } from '@/view/relicDisplayMapper'

const passiveConditionMet = ref(false)
const activeUsable = ref(true)
const activeProcessing = ref(false)

const demoRelics = computed<RelicDisplayEntry[]>(() => {
  const activeState: RelicUiState = activeProcessing.value
    ? 'active-processing'
    : activeUsable.value
      ? 'active-ready'
      : 'disabled'

  return [
    {
      id: 'demo-field',
      name: 'フィールド系レリック',
      usageType: 'field',
      icon: '🏞️',
      description: 'BattleViewでは常に無効扱いのフィールドレリック',
      active: false,
      usable: false,
      uiState: 'field-disabled',
    },
    {
      id: 'demo-passive',
      name: 'パッシブ（条件前/発動中）',
      usageType: 'passive',
      icon: '💤',
      description: '条件未達: enabled表示 / 条件達成: glow表示',
      active: passiveConditionMet.value,
      usable: true,
      uiState: passiveConditionMet.value ? 'passive-active' : 'passive-inactive',
    },
    {
      id: 'demo-active',
      name: 'アクティブ（使用可/処理中/不可）',
      usageType: 'active',
      icon: '⚡',
      description: '使用可→enabled / 処理中→赤み / 不可→disabled',
      active: activeUsable.value,
      usable: activeUsable.value && !activeProcessing.value,
      uiState: activeState,
    },
    {
      id: 'demo-active-locked',
      name: 'アクティブ（条件未達の例）',
      usageType: 'active',
      icon: '🔒',
      description: '使用条件を満たしていない状態のサンプル',
      active: false,
      usable: false,
      uiState: 'disabled',
    },
  ]
})
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="relic-icon-demo">
        <header class="demo-header">
          <h1>レリックアイコン表示デモ</h1>
          <p>BattleView想定の表示ルール（field / passive / active）を切り替えて確認できます。</p>
        </header>

        <section class="controls">
          <label>
            <input v-model="passiveConditionMet" type="checkbox" />
            パッシブ：発動条件を満たしている
          </label>
          <label>
            <input v-model="activeUsable" type="checkbox" />
            アクティブ：使用条件を満たしている
          </label>
          <label>
            <input v-model="activeProcessing" type="checkbox" :disabled="!activeUsable" />
            アクティブ：発動処理中を表示
          </label>
        </section>

        <section class="demo-panel">
          <div class="panel-header">
            <h2>表示例</h2>
            <p class="panel-note">
              hover / focus でツールチップが出る場合の視認性も確認してください。
            </p>
          </div>
          <RelicList class="demo-relics" :relics="demoRelics" />
        </section>
      </div>
    </template>
  </GameLayout>
</template>

<style scoped>
.relic-icon-demo {
  padding: 24px clamp(20px, 5vw, 64px);
  color: #f5f2ff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-header h1 {
  margin: 0 0 6px;
  letter-spacing: 0.08em;
}

.demo-header p {
  margin: 0;
  color: rgba(245, 242, 255, 0.8);
}

.controls {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.controls label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.demo-panel {
  padding: 16px;
  border-radius: 12px;
  background: radial-gradient(circle at 12% 0%, rgba(255, 255, 255, 0.05), rgba(12, 10, 20, 0.92));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.panel-header h2 {
  margin: 0;
  letter-spacing: 0.06em;
}

.panel-note {
  margin: 0;
  font-size: 12px;
  color: rgba(245, 242, 255, 0.7);
}

.demo-relics {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
