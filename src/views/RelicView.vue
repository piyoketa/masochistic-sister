<!--
RelicView の責務:
- 所持レリック一覧を表示し、重複なしで追加・削除できる編集画面を提供する。
- レリック情報（名称・説明・アイコン）を Library から取得し、インタラクションを Pinia の playerStore 経由で反映する。

責務ではないこと:
- レリックの発動判定や効果付与のロジック実行（ドメイン側に委譲する）。
- 戦闘やフィールド遷移の進行制御。ここでは編集のみを行う。

主な通信相手とインターフェース:
- playerStore: 所持レリックリストを読み書きし、重複を避けつつ追加・削除を行う。
- relicLibrary: `listRelicClassNames` / `getRelicInfo` を通して表示用データを取得。
- GameLayout: 共通レイアウト内で表示。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import RelicList from '@/components/RelicList.vue'
import { usePlayerStore } from '@/stores/playerStore'
import { getRelicInfo, listRelicClassNames } from '@/domain/entities/relics/relicLibrary'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()

const ownedRelics = computed(() =>
  playerStore.relics
    .map((className) => getRelicInfo(className))
    .filter((info): info is NonNullable<ReturnType<typeof getRelicInfo>> => info !== null),
)

const addableRelics = computed(() =>
  listRelicClassNames()
    .filter((className) => !playerStore.relics.includes(className))
    .map((className) => getRelicInfo(className))
    .filter((info): info is NonNullable<ReturnType<typeof getRelicInfo>> => info !== null),
)

const selectedAddClass = ref<string | null>(addableRelics.value[0]?.className ?? null)
const hoverDescription = ref<string | null>(null)

function handleAdd(): void {
  const className = selectedAddClass.value
  if (!className) return
  playerStore.addRelic(className)
  const next = addableRelics.value[0]
  selectedAddClass.value = next?.className ?? null
}

function handleRemove(className: string): void {
  playerStore.removeRelic(className)
  if (playerStore.relics.length === 0) {
    selectedAddClass.value = addableRelics.value[0]?.className ?? null
  }
}
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="relic-view">
        <header class="header">
          <h1>レリック編集</h1>
          <div class="header-status">
            <span>HP: {{ playerStore.hp }} / {{ playerStore.maxHp }}</span>
            <span>所持金: {{ playerStore.gold }}</span>
            <span>所持レリック: {{ ownedRelics.length }} 個</span>
          </div>
        </header>

        <section class="section">
          <h2>所持中のレリック</h2>
          <div v-if="ownedRelics.length === 0" class="empty">レリックを所持していません。</div>
          <div v-else class="owned-list">
            <div
              v-for="relic in ownedRelics"
              :key="relic.className"
              class="owned-item"
              @mouseenter="hoverDescription = relic.description"
              @mouseleave="hoverDescription = null"
            >
              <div class="owned-main">
                <span class="owned-icon">{{ relic.icon }}</span>
                <div class="owned-text">
                  <div class="owned-name">{{ relic.name }}</div>
                  <div class="owned-desc">{{ relic.description }}</div>
                </div>
              </div>
              <button type="button" class="btn btn-danger" @click="handleRemove(relic.className)">
                削除
              </button>
            </div>
          </div>
        </section>

        <section class="section">
          <h2>レリックを追加</h2>
          <div class="add-row">
            <select v-model="selectedAddClass">
              <option v-for="relic in addableRelics" :key="relic.className" :value="relic.className">
                {{ relic.name }}
              </option>
            </select>
            <button type="button" class="btn btn-primary" :disabled="!selectedAddClass" @click="handleAdd">
              追加
            </button>
          </div>
          <div v-if="selectedAddClass" class="preview">
            <h3>プレビュー</h3>
            <RelicList
              :relics="
                addableRelics
                  .filter((r) => r.className === selectedAddClass)
                  .map((r) => ({ ...r, active: true }))
              "
              :enable-glow="false"
            />
            <p class="preview-desc">
              {{
                addableRelics.find((r) => r.className === selectedAddClass)?.description ??
                '説明はありません'
              }}
            </p>
          </div>
        </section>

        <section v-if="hoverDescription" class="hover-help">
          <p>{{ hoverDescription }}</p>
        </section>
      </div>
    </template>
  </GameLayout>
</template>

<style scoped>
.relic-view {
  padding: 24px 20px 48px;
  color: #f8f5ff;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.header-status {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 14px;
  color: #d9d4ec;
}

.section {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(22, 20, 36, 0.9);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}

.owned-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.owned-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
}

.owned-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.owned-icon {
  font-size: 18px;
}

.owned-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.owned-name {
  font-weight: 700;
}

.owned-desc {
  font-size: 13px;
  color: #dcd7f2;
}

.btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(120deg, #7a8aff, #bba5ff);
  color: #1c1732;
}

.btn-danger {
  background: linear-gradient(120deg, #ff7a7a, #ffb4b4);
  color: #1c0f0f;
}

.add-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.add-row select {
  min-width: 200px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(12, 10, 20, 0.8);
  color: #f0edff;
}

.preview {
  margin-top: 12px;
}

.preview-desc {
  margin: 8px 0 0;
  color: #d9d4ec;
  font-size: 13px;
}

.hover-help {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #eae6ff;
  font-size: 13px;
}

.empty {
  color: #d9d4ec;
}
</style>
