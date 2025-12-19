<!--
OverlayDemoView の責務:
- ActionCardOverlayLayer / RelicCardOverlayLayer の挙動を確認する専用ページ。
- hoverでカードオーバーレイが出るデモをまとめて提供する。

非責務:
- 本番UIの制御やストア変更。純粋にデモ表示に限定する。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import { useActionCardOverlay } from '@/composables/actionCardOverlay'
import { useRelicCardOverlay } from '@/composables/relicCardOverlay'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import type { CardBlueprint } from '@/domain/library/Library'

const actionOverlay = useActionCardOverlay()
const relicOverlay = useRelicCardOverlay()
const { show: showDescriptionOverlay, hide: hideDescriptionOverlay, pin: pinDescriptionOverlay, unpin } =
  useDescriptionOverlay()
const corrosionBlueprint: CardBlueprint = { type: 'acid-spit', overrideAmount: 5, overrideCount: 1 }
const tackleBlueprint: CardBlueprint = { type: 'tackle' }
const pinnedBlueprint = corrosionBlueprint
const corrosionDescription = '腐食 10点\n被ダメージ+<magnitude>10</magnitude>\n（累積可）'

const pinned = ref(false)
const descriptionPinned = ref(false)

function showActionCard(blueprint: CardBlueprint, event: MouseEvent): void {
  actionOverlay.showFromBlueprint(blueprint, { x: event.clientX, y: event.clientY })
}

function hideActionCard(): void {
  if (pinned.value) return
  actionOverlay.hide()
}

function showRelicCard(event: MouseEvent): void {
  relicOverlay.showByClassName('MemorySaintRelic', { x: event.clientX, y: event.clientY })
}

function hideRelicCard(): void {
  relicOverlay.hide()
}

function showCorrosionDescription(event: MouseEvent): void {
  if (descriptionPinned.value) return
  showDescriptionOverlay(corrosionDescription, { x: event.clientX, y: event.clientY })
}

function hideDescription(): void {
  if (descriptionPinned.value) return
  hideDescriptionOverlay()
}

function togglePinned(event: Event): void {
  const target = event.target as HTMLInputElement
  pinned.value = target.checked
  if (pinned.value) {
    actionOverlay.showFromBlueprint(pinnedBlueprint, { x: 24, y: window.innerHeight - 200 })
  } else {
    actionOverlay.hide()
  }
}

function toggleDescriptionPinned(event: Event): void {
  const target = event.target as HTMLInputElement
  descriptionPinned.value = target.checked
  if (descriptionPinned.value) {
    pinDescriptionOverlay(corrosionDescription, { x: 24, y: window.innerHeight - 140 })
  } else {
    unpin()
  }
}
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="overlay-demo-view">
        <h1>オーバーレイ表示デモ</h1>
        <p>状態異常/攻撃/レリックのhoverでカードオーバーレイを表示するデモです。</p>
        <div class="overlay-demo">
          <div class="demo-block">
            <div class="demo-label">状態異常の説明文（hoverでカード表示）</div>
            <span
              class="demo-link"
              @mouseenter="(e) => showActionCard(corrosionBlueprint, e as MouseEvent)"
              @mouseleave="hideActionCard"
            >
              腐食 10点: 被ダメージ+10
            </span>
          </div>
          <div class="demo-block">
            <div class="demo-label">敵攻撃予測のアタック名（hoverでカード表示）</div>
            <span
              class="demo-link"
              @mouseenter="(e) => showActionCard(tackleBlueprint, e as MouseEvent)"
              @mouseleave="hideActionCard"
            >
              殴打
            </span>
          </div>
          <div class="demo-block">
            <div class="demo-label">レリック名（hoverでレリックカード表示）</div>
            <span class="demo-link" @mouseenter="(e) => showRelicCard(e as MouseEvent)" @mouseleave="hideRelicCard">
              記憶の聖女の証
            </span>
          </div>
          <div class="demo-block">
            <div class="demo-label">DescriptionOverlayのテキスト色確認</div>
            <span
              class="demo-link"
              @mouseenter="(e) => showCorrosionDescription(e as MouseEvent)"
              @mouseleave="hideDescription"
            >
              腐食 10点の説明を表示
            </span>
          </div>
          <label class="pin-toggle">
            <input type="checkbox" :checked="pinned" @change="togglePinned" />
            オーバーレイを固定表示
          </label>
          <label class="pin-toggle">
            <input type="checkbox" :checked="descriptionPinned" @change="toggleDescriptionPinned" />
            説明オーバーレイを固定表示
          </label>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<style scoped>
.overlay-demo-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  color: #f5f2ff;
}

.overlay-demo-view h1 {
  margin: 0;
  letter-spacing: 0.1em;
}

.overlay-demo-view p {
  margin: 0;
  color: rgba(245, 242, 255, 0.8);
}

.overlay-demo {
  background: rgba(6, 6, 12, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px;
  color: #f4f1ff;
  max-width: 320px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.demo-block + .demo-block {
  margin-top: 8px;
}

.demo-label {
  font-size: 12px;
  letter-spacing: 0.06em;
  color: rgba(244, 241, 255, 0.75);
}

.demo-link {
  display: inline-block;
  margin-top: 4px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
}

.demo-link:hover,
.demo-link:focus-visible {
  background: rgba(255, 255, 255, 0.12);
}

.pin-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(244, 241, 255, 0.8);
}
</style>
