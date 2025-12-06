<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import type { FieldNode } from '@/fields/domains/FieldNode'
import PlayerStatusHeader from '@/components/battle/PlayerStatusHeader.vue'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import { useAudioStore } from '@/stores/audioStore'
import { usePileOverlayStore } from '@/stores/pileOverlayStore'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import type { CardInfo } from '@/types/battle'
import {
  SnailTeam,
  IronBloomTeam,
  HummingbirdAlliesTeam,
  OrcWrestlerTeam,
  GunGoblinTeam,
  OrcHeroEliteTeam,
  HighOrcBandTeam,
  BeamCannonEliteTeam,
  GiantSlugEliteTeam,
} from '@/domain/entities/enemyTeams'
import type { EnemyTeam } from '@/domain/entities/EnemyTeam'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const pileOverlayStore = usePileOverlayStore()

const router = useRouter()

const { show: showDescription, hide: hideDescription } = useDescriptionOverlay()
const audioStore = useAudioStore()
const deckCardInfos = computed<CardInfo[]>(() => {
  const repository = new CardRepository()
  const cards = playerStore.buildDeck(repository)
  return cards
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

const ENEMY_TEAM_FACTORIES: Record<string, () => EnemyTeam> = {
  snail: () => new SnailTeam(),
  'iron-bloom': () => new IronBloomTeam({ mode: 'random' }),
  'hummingbird-allies': () => new HummingbirdAlliesTeam(),
  'orc-wrestler-team': () => new OrcWrestlerTeam(),
  'gun-goblin-team': () => new GunGoblinTeam(),
  'orc-hero-elite': () => new OrcHeroEliteTeam(),
  'high-orc-band': () => new HighOrcBandTeam(),
  'beam-cannon-elite': () => new BeamCannonEliteTeam(),
  'giant-slug-elite': () => new GiantSlugEliteTeam(),
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

function isReachable(levelIndex: number, nodeIndex: number): boolean {
  if (levelIndex !== fieldStore.nextLevelIndex) {
    return false
  }
  return fieldStore.reachableNextNodes().some((entry) => entry.index === nodeIndex)
}

function openDeckOverlay(): void {
  pileOverlayStore.openDeck(deckCardInfos.value, [])
}

async function handleEnter(node: FieldNode, levelIndex: number, nodeIndex: number): Promise<void> {
  if (!isReachable(levelIndex, nodeIndex) || fieldStore.isNodeCleared(node.id)) {
    return
  }
  fieldStore.selectNextNode(nodeIndex)
  if (fieldStore.field.isEnemyNode(node)) {
    await router.push({ path: `/battle/${node.enemyTeamId}` })
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
  if (node.type === 'fixed-relic-reward') {
    await router.push({ path: '/field/fixed-relic-reward' })
    return
  }
}

audioStore.playBgm('/sounds/bgm/field.mp3')

onMounted(() => {
  audioStore.playBgm('/sounds/bgm/field.mp3')
})

onUnmounted(() => {
  audioStore.stopBgm()
})
</script>

<template>
  <div class="field-view">
    <PlayerStatusHeader
      class="field-header"
      @relic-hover="(relic, e) => showDescription(relic.description, { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY })"
      @relic-leave="hideDescription"
      @relic-click="() => undefined"
      @deck-click="openDeckOverlay"
    >
      <template #actions>
        <div class="field-header__actions">
          <span class="field-header__item">現在Lv: {{ currentLevel }}</span>
          <button type="button" class="deck-button" @click="router.push('/deck')">デッキ確認</button>
        </div>
      </template>
    </PlayerStatusHeader>

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
              <ul v-if="fieldStore.field.isEnemyNode(node)" class="enemy-members">
                <li v-for="member in resolveTeamInfo(node.enemyTeamId)?.members ?? []" :key="member">
                  {{ member }}
                </li>
              </ul>
              <div class="node-state">
                状態: {{ fieldStore.isNodeCleared(node.id) ? 'クリア' : '未クリア' }}
              </div>
              <button
                type="button"
                class="enter-button"
                :disabled="!isReachable(levelIdx, idx) || fieldStore.isNodeCleared(node.id)"
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

.deck-button {
  background: rgba(255, 227, 115, 0.9);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 800;
  cursor: pointer;
}

.field-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: rgba(245, 242, 255, 0.85);
  font-size: 14px;
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
  min-width: 220px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
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
