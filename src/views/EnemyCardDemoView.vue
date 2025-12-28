<!--
EnemyCardDemoView の責務:
- OrcEnemy ドメインデータを EnemyInfo に整形し、EnemyCard の単体表示を確認するデモページを提供する。
- 敵の image パス・スキル説明・付与ステートをまとめて可視化し、今後 EnemyCard 内に画像を載せる際の参照土台にする。

責務ではないこと:
- バトル進行や OperationLog の再生。ここでは静的な OrcEnemy の状態のみを扱う。
- EnemyCard のスタイル変更や画像合成そのもの（次の段階で実施予定）。

主なインターフェース:
- EnemyCard: `enemy: EnemyInfo` を渡して描画。hover/selection の通知はデモでは使用しない。
- OrcEnemy (domain): インスタンス生成し、`actions` / `states` / `image` を EnemyInfo に整形。類似する型として `BattleSnapshot['enemies'][number]` があるが、
  このデモでは単体表示用に EnemyInfo へ最小限の項目を抽出する。
-->
<script setup lang="ts">
import EnemyCard from '@/components/EnemyCard.vue'
import { OrcEnemy } from '@/domain/entities/enemies/OrcEnemy'
import type { Enemy } from '@/domain/entities/Enemy'
import type { State } from '@/domain/entities/State'
import { StrengthState } from '@/domain/entities/states/StrengthState'
import type { EnemyInfo, StateSnapshot } from '@/types/battle'

// OrcEnemy の素の状態だけだと表示が寂しいため、ビルドアップ後の強化状態を付与しておく。
const demoEnemy: EnemyInfo = buildOrcEnemyInfo()

function buildOrcEnemyInfo(): EnemyInfo {
  const orc = new OrcEnemy({
    states: [new StrengthState(10)], // BuildUpAction で得られる打点上昇を事前に付与し、スタック表示を確認する
  })
  orc.assignId(1)
  return mapEnemyToInfo(orc)
}

function mapEnemyToInfo(enemy: Enemy): EnemyInfo {
  return {
    id: enemy.id ?? 0,
    name: enemy.name,
    level: enemy.level,
    image: enemy.image,
    status: enemy.status,
    hp: {
      current: enemy.currentHp,
      max: enemy.maxHp,
    },
    skills: enemy.actions.map((action) => ({
      name: action.name,
      detail: action.describe(), // BattleSnapshot と同じ describe() を使い、表示文言の揺れを防ぐ
    })),
    states: mapStatesToSnapshots(enemy.states),
  }
}

function mapStatesToSnapshots(states: State[]): StateSnapshot[] {
  // Battle.buildStateSnapshot と同じ要素をそろえ、View 側の表示が戦闘スナップショットと一致するようにする。
  return states.map((state) => {
    const category = state.getCategory()
    const description =
      typeof state.description === 'function' ? state.description() : String((state as any).description ?? '')
    const isImportant = typeof state.isImportant === 'function' ? state.isImportant() : false
    const stackable =
      typeof state.isStackable === 'function' ? state.isStackable() : Boolean((state as any).magnitude !== undefined)

    if (stackable) {
      return {
        id: state.id,
        name: state.name,
        description,
        category,
        isImportant,
        stackable: true,
        magnitude: state.magnitude ?? 0,
      }
    }

    return {
      id: state.id,
      name: state.name,
      description,
      category,
      isImportant,
      stackable: false,
      magnitude: undefined,
    }
  })
}
</script>

<template>
  <main class="demo-page">
    <header class="demo-hero">
      <div>
        <h1>EnemyCard Demo (Orc)</h1>
        <p>OrcEnemy から整形した EnemyInfo を流し込み、カード表示と元データを並べて確認できます。次の段階で EnemyCard に画像を載せる際の準備用デモです。</p>
      </div>
    </header>

    <section class="demo-grid">
      <div class="card-panel">
        <p class="panel-label">EnemyCard（ドメイン整形済み）</p>
        <EnemyCard :enemy="demoEnemy" selectable />
      </div>
      <div class="meta-panel">
        <p class="panel-label">OrcEnemy ソース情報</p>

        <div class="meta-block">
          <h3>基本情報</h3>
          <ul>
            <li>名前: {{ demoEnemy.name }}</li>
            <li>HP: {{ demoEnemy.hp.current }} / {{ demoEnemy.hp.max }}</li>
            <li>状態: {{ demoEnemy.status }}</li>
          </ul>
        </div>

        <div class="meta-block">
          <h3>画像プレビュー</h3>
          <p class="meta-sub">image フィールドに入っているパスをそのまま表示しています。</p>
          <div class="image-preview">
            <img :src="demoEnemy.image" :alt="`${demoEnemy.name} の画像`" />
            <span class="image-path">{{ demoEnemy.image }}</span>
          </div>
        </div>

        <div class="meta-block">
          <h3>スキル（actions）</h3>
          <ul class="skill-list">
            <li v-for="skill in demoEnemy.skills" :key="skill.name">
              <strong>{{ skill.name }}</strong>
              <span class="skill-detail">{{ skill.detail }}</span>
            </li>
          </ul>
        </div>

        <div class="meta-block">
          <h3>付与ステート</h3>
          <ul v-if="demoEnemy.states?.length" class="state-list">
            <li v-for="state in demoEnemy.states" :key="state.id">
              {{ state.name }}{{ state.stackable ? `(${state.magnitude}点)` : '' }}
              <span class="state-detail">カテゴリ: {{ state.category }}</span>
            </li>
          </ul>
          <p v-else>現在付与されているステートはありません。</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.demo-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px;
  color: #e8eefc;
}

.demo-hero h1 {
  margin: 0 0 6px;
  font-size: 22px;
}

.demo-hero p {
  margin: 0;
  color: #b6c0d9;
  line-height: 1.5;
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 20px;
}

.card-panel,
.meta-panel {
  padding: 16px;
  border-radius: 16px;
  background: radial-gradient(circle at top left, rgba(44, 52, 86, 0.8), rgba(19, 22, 36, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
}

.panel-label {
  margin: 0 0 10px;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: #a8b5d5;
}

.meta-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-block {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.meta-block h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.meta-block ul {
  margin: 0;
  padding-left: 18px;
  color: #dce6ff;
  line-height: 1.6;
}

.meta-sub {
  margin: 0 0 8px;
  color: #9fb0d3;
  font-size: 13px;
}

.image-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.image-preview img {
  width: 200px;
  height: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  background: rgba(0, 0, 0, 0.15);
}

.image-path {
  font-size: 12px;
  color: #9fb0d3;
  word-break: break-all;
}

.skill-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.skill-detail {
  color: #b9c5e0;
  font-size: 13px;
}

.state-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.state-detail {
  margin-left: 6px;
  color: #9fb0d3;
  font-size: 12px;
}

@media (max-width: 900px) {
  .demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
