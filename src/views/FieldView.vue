<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import type { FieldNode } from '@/fields/domains/FieldNode'
import PlayerStatusHeader from '@/components/battle/PlayerStatusHeader.vue'
import AchievementWindow from '@/components/AchievementWindow.vue'
import { useRelicCardOverlay } from '@/composables/relicCardOverlay'
import { useAchievementWindow } from '@/composables/useAchievementWindow'
import { useAudioStore } from '@/stores/audioStore'
import { usePlayerDeckOverlayStore } from '@/stores/playerDeckOverlayStore'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import type { CardInfo } from '@/types/battle'
import { createCardFromBlueprint } from '@/domain/library/Library'
import { useImageHub } from '@/composables/imageHub'
import { buildEnemyTeamFactoryMap } from '@/domain/entities/enemyTeams'
import type { RelicDisplayEntry } from '@/view/relicDisplayMapper'

type FieldViewProps = {
  fieldId?: string
}

const props = defineProps<FieldViewProps>()

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const playerDeckOverlayStore = usePlayerDeckOverlayStore()
// 実績ウィンドウ用の表示データを composable に集約する。
const {
  memoryPointSummary: achievementMemoryPointSummary,
  rewardEntries: rewardAchievementEntries,
  titleEntries: titleAchievementEntries,
} = useAchievementWindow()
const imageHub = useImageHub()
const SISTER_ICON_SRC = '/assets/players/icons/sister_dot.png'
imageHub.getElement(SISTER_ICON_SRC)
const sisterIconSrc = computed(() => imageHub.getSrc(SISTER_ICON_SRC))

const router = useRouter()
const debugMode = ref(false)
const debugMenuOpen = ref(false)
const achievementWindowOpen = ref(false)

const { show: showRelicOverlay, hide: hideRelicOverlay } = useRelicCardOverlay()
const audioStore = useAudioStore()
const deckCardInfos = computed<CardInfo[]>(() => {
  const repository = new CardRepository()
  const sorted = [...playerStore.deck].sort((a, b) => a.type.localeCompare(b.type))
  return sorted
    .map((blueprint, index) => createCardFromBlueprint(blueprint, repository))
    .map((card, index) =>
      buildCardInfoFromCard(card, {
        id: `player-deck-${card.id ?? index}`,
        affordable: true,
        disabled: true,
      }),
    )
    .filter((info): info is CardInfo => info !== null)
})

const currentLevel = computed(() => fieldStore.currentLevelIndex + 1)
const levels = computed(() => fieldStore.field.levels)
const playerHp = computed(() => ({ current: playerStore.hp, max: playerStore.maxHp }))
const currentNodeCleared = computed(() => {
  const node = fieldStore.currentNode
  return node ? fieldStore.isNodeCleared(node.id) : false
})
const targetFieldId = computed(() => props.fieldId ?? 'first-field')

const ENEMY_TEAM_FACTORIES = buildEnemyTeamFactoryMap()

const ENEMY_EFFECTIVE_HINTS: Record<string, string> = {
  'snail-team': '打点',
  'test-enemy-team': '打点',
  'iron-bloom-team': '攻撃回数',
  'iron-bloom-scripted': '攻撃回数',
  'orc-wrestler-team': '打点',
  'hummingbird-allies': '攻撃回数',
  'gun-goblin-team': 'なし',
  'high-orc-squad': 'なし',
  'beam-cannon-elite': '攻撃回数',
  'orc-hero-elite': 'なし',
}

function handleRelicHover(relic: RelicDisplayEntry, event: MouseEvent | FocusEvent): void {
  // レリック詳細オーバーレイは名称/説明を一体で見せ、一覧からでも効果を判断できるようにする。
  let x = 0
  let y = 0
  if ('clientX' in event) {
    x = event.clientX
    y = event.clientY
  } else if (event.target instanceof HTMLElement) {
    const rect = event.target.getBoundingClientRect()
    x = rect.left + rect.width / 2
    y = rect.top
  }
  showRelicOverlay(relic, { x, y })
}

function nodeLabel(node: FieldNode): string {
  if (node.label) {
    return node.label
  }
  if (node.type === 'start') {
    return `スタート (Lv.${node.level})`
  }
  if (fieldStore.field.isEnemyNode(node)) {
    const info = resolveTeamInfo(node.enemyTeamId)
    return info ? `敵: ${info.name}` : `敵: ${node.enemyTeamId}`
  }
  return `Lv.${node.level}`
}

function resolveTeamInfo(teamId: string): { name: string; members: string[] } | null {
  const factory = ENEMY_TEAM_FACTORIES[teamId]
  const team = factory ? factory() : null
  if (!team) {
    return null
  }
  const members = team.members.map((enemy) => enemy.name ?? `enemy-${enemy.id ?? ''}`)
  return { name: team.name ?? teamId, members }
}

function resolveEffectiveHint(teamId: string): string | null {
  return ENEMY_EFFECTIVE_HINTS[teamId] ?? null
}

function isReachable(levelIndex: number, nodeIndex: number): boolean {
  const level = levels.value?.[levelIndex]
  const node = level?.nodes?.[nodeIndex]
  // デバッグ時は到達制約を無視して全マス解放する。
  if (debugMode.value) {
    return true
  }
  if (!node) {
    return false
  }
  // ルール:
  // - 現在マス未クリア: 現在マスのみ進入可（次レベルは不可）
  // - 現在マスクリア済み: 次レベルの到達可能マスのみ進入可（現在マスは不可）
  const isCurrent = levelIndex === fieldStore.currentLevelIndex && nodeIndex === fieldStore.currentNodeIndex
  if (!currentNodeCleared.value) {
    return isCurrent
  }
  if (levelIndex !== fieldStore.nextLevelIndex) {
    return false
  }
  return fieldStore.reachableNextNodes().some((entry) => entry.index === nodeIndex)
}

function openDeckOverlay(): void {
  // フィールド系のデッキ確認は専用オーバーレイで表示する。
  playerDeckOverlayStore.open(deckCardInfos.value)
}

async function handleEnter(node: FieldNode, levelIndex: number, nodeIndex: number): Promise<void> {
  const reachable = isReachable(levelIndex, nodeIndex)
  const alreadyCleared = fieldStore.isNodeCleared(node.id)
  // デバッグモードでは到達制約・クリア済みを無視して再訪問を許可する。
  if (!debugMode.value && (!reachable || alreadyCleared)) {
    return
  }
  if (node.type === 'start') {
    await router.push({ name: 'start-story', query: { fieldId: fieldStore.field.id } })
    return
  }
  fieldStore.selectNextNode(nodeIndex)

  // 0.5sの遅延を入れて、画面遷移が急すぎないようにする。
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (fieldStore.field.isEnemyNode(node)) {
    const query = node.bonusLevels ? { bonusLevels: node.bonusLevels } : undefined
    await router.push({ path: `/battle/${node.enemyTeamId}`, query })
    return
  }
  if (node.type === 'card-reward') {
    await router.push({ path: '/field/card-reward' })
    return
  }
  if (node.type === 'relic-reward') {
    await router.push({ path: '/field/relic-reward' })
    return
  }
  if (node.type === 'random-card-reward') {
    await router.push({ path: '/field/random-card-reward' })
    return
  }
  if (node.type === 'random-relic-reward') {
    await router.push({ path: '/field/random-relic-reward' })
    return
  }
  if (node.type === 'fixed-relic-reward') {
    await router.push({ path: '/field/fixed-relic-reward' })
    return
  }
  if (node.type === 'devil-statue') {
    await router.push({ path: '/field/devil-statue-reward' })
    return
  }
  if (node.type === 'goal') {
    await router.push({ path: '/field/goal', query: { fieldId: fieldStore.field.id } })
    return
  }
}

audioStore.playBgm('/sounds/bgm/field.mp3')

onMounted(() => {
  if (fieldStore.field.id !== targetFieldId.value) {
    fieldStore.initializeField(targetFieldId.value)
  }
  // フィールド系BGMは報酬画面への遷移でも途切れさせないため、アンマウント時に stop しない。
  // BattleView などで別のBGMを再生する際は audioHub 側で切り替わる想定。
  audioStore.playBgm('/sounds/bgm/field.mp3')
})
</script>

<template>
  <div class="field-view">
    <AchievementWindow
      :visible="achievementWindowOpen"
      :reward-entries="rewardAchievementEntries"
      :title-entries="titleAchievementEntries"
      :memory-point-summary="achievementMemoryPointSummary"
      @close="achievementWindowOpen = false"
    />
    <PlayerStatusHeader
      class="field-header"
      :enable-glow="false"
      @relic-hover="(relic, e) => handleRelicHover(relic, e)"
      @relic-leave="hideRelicOverlay"
      @deck-click="openDeckOverlay"
    >
      <template #actions>
        <div class="field-header__actions">
          <button class="achievement-button" type="button" @click="achievementWindowOpen = true">
            <span class="achievement-button__icon" aria-hidden="true">
              <svg viewBox="0 0 28 28" role="presentation" focusable="false">
                <path
                  d="M14 2 17 9l7 .9-5.4 5 1.5 7.1L14 18.8 8 22l1.5-7.1L4 9.9 11 9z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span class="achievement-button__label">実績</span>
          </button>
          <span class="field-header__item">HP: {{ playerHp.current }} / {{ playerHp.max }}</span>
          <span class="field-header__item">現在Lv: {{ currentLevel }}</span>
        </div>
      </template>
    </PlayerStatusHeader>

    <section class="debug-panel">
      <button class="debug-accordion" type="button" @click="debugMenuOpen = !debugMenuOpen">
        デバッグメニュー {{ debugMenuOpen ? '▲' : '▼' }}
      </button>
      <div v-if="debugMenuOpen" class="debug-content">
        <button type="button" class="deck-button" @click="router.push('/deck')">デッキ確認</button>
        <label class="debug-toggle">
          <input v-model="debugMode" type="checkbox">
          デバッグ: 全マス解放
        </label>
      </div>
    </section>

    <!-- <section class="field-section">
      <h2>現在のマス (Lv.{{ currentLevel }})</h2>
      <div v-if="fieldStore.currentNode" class="node-card node-card--current">
        <div class="node-title">{{ nodeLabel(fieldStore.currentNode) }}</div>
        <div class="node-state">状態: {{ fieldStore.isNodeCleared(fieldStore.currentNode.id) ? 'クリア' : '未クリア' }}</div>
      </div>
    </section> -->

    <section class="field-section">
      <!-- <h2>全レベル</h2> -->
      <div class="level-list">
        <div v-for="(level, levelIdx) in levels" :key="level.level" class="level-block">
          <div class="level-title">Lv.{{ level.level }}</div>
          <div class="node-list">
            <div
              v-for="(node, idx) in level.nodes"
              :key="node.id"
              class="node-card"
              :class="{
                'node-card--reachable': isReachable(levelIdx, idx),
                'node-card--cleared': fieldStore.isNodeCleared(node.id),
                'node-card--current': levelIdx === fieldStore.currentLevelIndex && idx === fieldStore.currentNodeIndex,
              }"
            >
              <div class="node-title">{{ nodeLabel(node) }}</div>
              <div
                v-if="levelIdx === fieldStore.currentLevelIndex && idx === fieldStore.currentNodeIndex"
                class="node-avatar"
              >
                <img
                  v-if="sisterIconSrc"
                  :src="sisterIconSrc"
                  alt="現在位置"
                  class="node-avatar__img"
                >
              </div>
              <div
                v-if="fieldStore.field.isEnemyNode(node)"
                class="node-chip"
              >
                有効: {{ resolveEffectiveHint(node.enemyTeamId) ?? '不明' }}
              </div>
              <ul v-if="fieldStore.field.isEnemyNode(node)" class="enemy-members">
                <li v-for="member in resolveTeamInfo(node.enemyTeamId)?.members ?? []" :key="member">
                  {{ member }}
                </li>
              </ul>
              <div v-if="fieldStore.isNodeCleared(node.id)" class="node-state">
                状態: クリア
              </div>
              <button
                v-if="isReachable(levelIdx, idx)"
                type="button"
                class="enter-button"
                @click="handleEnter(node, levelIdx, idx)"
              >
                進む
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.field-view {
  min-height: 100vh;
  padding: 32px clamp(20px, 5vw, 64px);
  background: radial-gradient(circle at top, rgba(34, 28, 63, 0.95), rgba(9, 9, 14, 0.95));
  color: #f5f2ff;
  box-sizing: border-box;
}

.field-header {
  margin-bottom: 24px;
}

.field-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(245, 242, 255, 0.85);
  font-size: 14px;
  flex-wrap: wrap;
}

.achievement-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(90deg, rgba(255, 227, 115, 0.24), rgba(255, 150, 92, 0.2));
  color: #fff3c4;
  border: 1px solid rgba(255, 216, 102, 0.6);
  border-radius: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.28);
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background 120ms ease;
}

.achievement-button:hover,
.achievement-button:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
  border-color: rgba(255, 216, 102, 0.85);
  background: linear-gradient(90deg, rgba(255, 227, 115, 0.34), rgba(255, 150, 92, 0.28));
}

.achievement-button__icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: radial-gradient(circle at 30% 20%, rgba(255, 227, 115, 0.9), rgba(187, 124, 46, 0.9));
  color: #2d1a05;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(255, 199, 103, 0.25);
}

.achievement-button__icon svg {
  width: 18px;
  height: 18px;
}

.achievement-button__label {
  font-size: 14px;
}


.debug-panel {
  margin-bottom: 16px;
}

.debug-accordion {
  background: rgba(255, 255, 255, 0.08);
  color: #f5f2ff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
  cursor: pointer;
}

.debug-content {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.deck-button {
  background: rgba(255, 227, 115, 0.9);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 800;
  cursor: pointer;
}

.debug-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.debug-toggle input {
  accent-color: #f6d365;
}

.field-section {
  margin-top: 16px;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-block {
  background: rgba(14, 12, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 12px;
}

.level-title {
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: 0.08em;
}

.node-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.node-card {
  background: rgba(18, 16, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  min-width: 300px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  position: relative;
}

.node-avatar {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 20px;
  width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.node-avatar__img {
  width: 80px;
}

.node-card--current {
  border-color: rgba(255, 227, 115, 0.8);
  box-shadow: 0 10px 28px rgba(255, 227, 115, 0.25);
}

.node-card--reachable {
  border-color: rgba(140, 200, 255, 0.8);
}

.node-card--cleared {
  opacity: 0.6;
}

.node-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.node-chip {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 10px;
  background: rgba(255, 227, 115, 0.15);
  border: 1px solid rgba(255, 227, 115, 0.55);
  color: #ffe9a3;
  font-size: 11px;
  letter-spacing: 0.04em;
}

.node-state {
  margin-bottom: 8px;
  font-size: 13px;
  color: rgba(245, 242, 255, 0.8);
}

.enemy-members {
  margin: 0 0 8px;
  padding-left: 16px;
  color: rgba(245, 242, 255, 0.85);
  font-size: 13px;
}

.enter-button {
  background: rgba(255, 227, 115, 0.9);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
}

.enter-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.enter-button:not(:disabled):hover,
.enter-button:not(:disabled):focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
}
</style>
