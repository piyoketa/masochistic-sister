<!--
BattleEnemyArea の責務:
- 戦闘スナップショットと Battle インスタンスをもとに、敵エリアの表示とユーザー操作を担う。
- 敵カードのホバーやクリックイベントを検知し、親コンポーネントへ通知する。
- 敵の状態・スキル情報を整形して EnemyCard へ渡す。

責務ではないこと:
- カード使用やターゲット選択の進行管理は担当しない（親コンポーネントが Promise を介して制御する）。
- 戦闘ログやアニメーションの制御、カード手札の操作には関与しない。

主な通信相手とインターフェース:
- BattleView（親）: props で snapshot / 選択状態を受け取り、hover-start・hover-end・enemy-click・cancel-selection を emit する。
- EnemyCard: 各敵カードを描画する。`enemy: EnemyInfo`、`selectable: boolean` 等の既存インターフェースを利用。
  `EnemyInfo` は `@/types/battle` の型で、スナップショットから生成した情報を格納する。類似する型として `BattleSnapshot['enemies'][number]` があるが、
  EnemyInfo はビュー描画向けに nextActions や states の整形済み情報を持つ点が異なる。
-->
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import EnemyCard from '@/components/EnemyCard.vue'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { State } from '@/domain/entities/State'
import type { EnemyInfo, EnemyTrait, EnemyActionHint } from '@/types/battle'
import type { StageEventPayload, StageEventMetadata } from '@/types/animation'
import type { DamageOutcome } from '@/domain/entities/Damages'
import type { ResolvedBattleActionLogEntry } from '@/domain/battle/ActionLogReplayer'

interface EnemySelectionHint {
  enemyId: number
  selectable: boolean
  reason?: string
}

const props = defineProps<{
  snapshot: BattleSnapshot | undefined
  isInitializing: boolean
  errorMessage: string | null
  isSelectingEnemy: boolean
  hoveredEnemyId: number | null
  stageEvent: StageEventPayload | null
  selectionHints?: EnemySelectionHint[]
}>()

const emit = defineEmits<{
  (event: 'hover-start', enemyId: number): void
  (event: 'hover-end', enemyId: number): void
  (event: 'enemy-click', enemy: EnemyInfo): void
  (event: 'cancel-selection'): void
}>()

interface EnemySlot {
  id: number
  isActive: boolean
  enemy?: EnemyInfo
}

const actingEnemyId = ref<number | null>(null)
const processedStageBatchIds = new Set<string>()
type EnemyDamageStageMetadata = Extract<StageEventMetadata, { stage: 'enemy-damage' }>
type PlayerDamageStageMetadata = Extract<StageEventMetadata, { stage: 'player-damage' }>
type DamageStageMetadata = EnemyDamageStageMetadata | PlayerDamageStageMetadata
type AlreadyActedStageMetadata = Extract<StageEventMetadata, { stage: 'already-acted-enemy' }>
let actingTimer: number | null = null
type EnemyCardInstance = InstanceType<typeof EnemyCard>
const enemyCardRefs = new Map<number, EnemyCardInstance>()

const selectionHintMap = computed<Map<number, EnemySelectionHint>>(() => {
  const hints = props.selectionHints ?? []
  const map = new Map<number, EnemySelectionHint>()
  hints.forEach((hint) => {
    map.set(hint.enemyId, hint)
  })
  return map
})

const enemySlots = computed<EnemySlot[]>(() => {
  const current = props.snapshot
  if (!current) {
    return []
  }

  return current.enemies.map((enemySnapshot) => {
    const isActive = enemySnapshot.status === 'active' && enemySnapshot.currentHp > 0
    const baseNextActions: EnemyActionHint[] = enemySnapshot.nextActions ?? []
    const enemyInfo = isActive
      ? {
          id: enemySnapshot.id,
          name: enemySnapshot.name,
          image: enemySnapshot.image ?? '',
          hp: {
            current: enemySnapshot.currentHp,
            max: enemySnapshot.maxHp,
          },
          nextActions: baseNextActions,
          skills: enemySnapshot.skills ?? [],
          states: mapStatesToEntries(enemySnapshot.states) ?? [],
        }
      : undefined
    return {
      id: enemySnapshot.id,
      isActive,
      enemy: enemyInfo,
    }
  })
})

const hasVisibleEnemies = computed(() => enemySlots.value.some((slot) => slot.isActive))

function isEnemySelectable(enemyId: number | undefined): boolean {
  if (!props.isSelectingEnemy || enemyId === undefined) {
    return false
  }
  const hint = selectionHintMap.value.get(enemyId)
  if (!hint) {
    return true
  }
  return hint.selectable
}

function blockedReason(enemyId: number | undefined): string | undefined {
  if (!props.isSelectingEnemy || enemyId === undefined) {
    return undefined
  }
  const hint = selectionHintMap.value.get(enemyId)
  if (hint && !hint.selectable) {
    return hint.reason
  }
  return undefined
}

watch(
  () => props.stageEvent,
  (event) => {
    if (!event || !event.batchId || processedStageBatchIds.has(event.batchId)) {
      return
    }
    processedStageBatchIds.add(event.batchId)
    if (processedStageBatchIds.size > 500) {
      processedStageBatchIds.clear()
      processedStageBatchIds.add(event.batchId)
    }
    const metadata = event.metadata
    if (!metadata) {
      return
    }
    switch (metadata.stage) {
      case 'enemy-highlight': {
        const enemyId = typeof metadata.enemyId === 'number' ? metadata.enemyId : null
        triggerEnemyHighlight(enemyId)
        break
      }
      case 'already-acted-enemy':
        handleAlreadyActedStage(metadata)
        break
      case 'enemy-damage':
        handleEnemyDamageStage(event, metadata)
        break
      case 'player-damage':
        // プレイヤー被弾時の演出は BattleView 側で扱うため、敵カードでは特別な処理を行わない
        break
      default:
        break
    }
  },
)

function triggerEnemyHighlight(enemyId: number | null): void {
  actingEnemyId.value = enemyId
  if (enemyId !== null && props.snapshot) {
    const enemySnapshot = props.snapshot.enemies.find((enemy) => enemy.id === enemyId)
    if (enemySnapshot) {
    }
  }
  if (actingTimer) {
    window.clearTimeout(actingTimer)
  }
  actingTimer = window.setTimeout(() => {
    if (actingEnemyId.value === enemyId) {
      actingEnemyId.value = null
    }
    actingTimer = null
  }, 600)
}

onBeforeUnmount(() => {
  if (actingTimer) {
    window.clearTimeout(actingTimer)
    actingTimer = null
  }
})

function handleEnemyDamageStage(event: StageEventPayload, metadata: EnemyDamageStageMetadata): void {
  const enemyId = resolveEnemyIdFromStage(event, metadata)
  if (enemyId === null) {
    return
  }
  const outcomes =
    metadata.damageOutcomes?.map((outcome) => ({
      ...outcome,
    })) ?? []
  const target = enemyCardRefs.get(enemyId)
  target?.playDamage(outcomes)
}

function resolveEnemyIdFromStage(event: StageEventPayload, metadata: DamageStageMetadata): number | null {
  const rawEnemyId = metadata.enemyId
  if (typeof rawEnemyId === 'number' && Number.isInteger(rawEnemyId)) {
    return rawEnemyId
  }
  const resolved = event.resolvedEntry
  return extractEnemyIdFromResolvedEntry(resolved)
}

function handleAlreadyActedStage(metadata: AlreadyActedStageMetadata): void {
  const enemyId = typeof metadata.enemyId === 'number' ? metadata.enemyId : null
  triggerEnemyHighlight(enemyId)
}

function extractEnemyIdFromResolvedEntry(
  resolvedEntry: ResolvedBattleActionLogEntry | undefined,
): number | null {
  if (!resolvedEntry) {
    return null
  }
  if (resolvedEntry.type === 'play-card') {
    if (typeof resolvedEntry.targetEnemyId === 'number') {
      return resolvedEntry.targetEnemyId
    }
    const operation = resolvedEntry.operations.find((op) => op.type === 'target-enemy')
    if (operation && 'enemyId' in operation && typeof operation.enemyId === 'number') {
      return operation.enemyId
    }
  }
  return null
}

function registerEnemyCardRef(enemyId: number | undefined, instance: EnemyCardInstance | null): void {
  if (enemyId === undefined) {
    return
  }
  if (instance) {
    enemyCardRefs.set(enemyId, instance)
  } else {
    enemyCardRefs.delete(enemyId)
  }
}

function handleEnemyClick(enemy: EnemyInfo): void {
  if (!isEnemySelectable(enemy.id)) {
    return
  }
  emit('enemy-click', enemy)
}

function handleContextMenu(enemy: EnemyInfo, event: MouseEvent): void {
  if (!props.isSelectingEnemy) {
    return
  }
  event.preventDefault()
  emit('cancel-selection')
}

function mapStatesToEntries(states?: State[]): EnemyTrait[] | undefined {
  if (!states || states.length === 0) {
    return undefined
  }

  return states.map((state) => ({
    name: state.name,
    detail: state.description(),
    magnitude: state.magnitude,
  }))
}
</script>

<template>
  <section class="enemy-zone">
    <div v-if="errorMessage" class="zone-message zone-message--error">
      {{ errorMessage }}
    </div>
    <div v-else-if="isInitializing" class="zone-message">読み込み中...</div>
    <div v-else-if="!hasVisibleEnemies" class="zone-message">表示できる敵がありません</div>
    <TransitionGroup v-else name="enemy-card" tag="div" class="enemy-grid">
      <div
        v-for="slot in enemySlots"
        :key="slot.id"
        class="enemy-slot"
        :class="{ 'enemy-slot--spacer': !slot.isActive }"
      >
        <EnemyCard
          v-if="slot.enemy"
          :ref="(el) => registerEnemyCardRef(slot.enemy!.id, el as EnemyCardInstance | null)"
          :enemy="slot.enemy"
          :selectable="isEnemySelectable(slot.enemy.id)"
          :hovered="isSelectingEnemy && hoveredEnemyId === slot.enemy.id"
          :selected="isSelectingEnemy && hoveredEnemyId === slot.enemy.id"
          :acting="slot.enemy ? actingEnemyId === slot.enemy.id : false"
          :blocked-reason="blockedReason(slot.enemy.id)"
          @mouseenter="() => emit('hover-start', slot.enemy!.id)"
          @mouseleave="() => emit('hover-end', slot.enemy!.id)"
          @click="() => handleEnemyClick(slot.enemy!)"
          @contextmenu.prevent="handleContextMenu(slot.enemy!, $event)"
        />
      </div>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.enemy-zone {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 320px;
  padding: 20px;
}

.enemy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.enemy-slot {
  min-height: 200px;
}

.enemy-slot--spacer {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

:deep(.enemy-card-enter-active),
:deep(.enemy-card-leave-active) {
  transition: opacity 1s ease, transform 1s ease;
}

:deep(.enemy-card-leave-to) {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.zone-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border-radius: 12px;
  background: rgba(24, 22, 26, 0.78);
  color: #f5f0f7;
  font-size: 14px;
  letter-spacing: 0.08em;
}

.zone-message--error {
  background: rgba(210, 48, 87, 0.18);
  border: 1px solid rgba(210, 48, 87, 0.4);
  color: #ff9fb3;
}
</style>
