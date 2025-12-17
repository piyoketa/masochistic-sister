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
  `EnemyInfo` は `@/types/battle` の型で、スナップショット + Battle インスタンスから生成した情報を格納する。類似する型として `BattleSnapshot['enemies'][number]` があるが、
  EnemyInfo はビュー描画向けに states の整形済み情報を持つ点が異なる（行動予測は EnemyNextActions へ分離）。
-->
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import EnemyCard from '@/components/EnemyCard.vue'
import EnemyNextActions from '@/components/battle/EnemyNextActions.vue'
import { formatEnemyActionChipsForView } from '@/view/enemyActionHintsForView'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { Battle } from '@/domain/battle/Battle'
import type { State } from '@/domain/entities/State'
import type { EnemyInfo, EnemyActionHint, EnemyStatus, StateSnapshot } from '@/types/battle'
import type { StageEventPayload, StageEventMetadata } from '@/types/animation'
import type { DamageOutcome } from '@/domain/entities/Damages'
import type { ResolvedBattleActionLogEntry } from '@/domain/battle/ActionLogReplayer'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { useAudioStore } from '@/stores/audioStore'

interface EnemySelectionHint {
  enemyId: number
  selectable: boolean
  reason?: string
}

const props = defineProps<{
  battle?: Battle
  snapshot: BattleSnapshot | undefined
  isInitializing: boolean
  isSelectingEnemy: boolean
  hoveredEnemyId: number | null
  stageEvent: StageEventPayload | null
  selectionHints?: EnemySelectionHint[]
  selectionTheme?: EnemySelectionTheme
  actionHintsByEnemyId?: Map<number, EnemyActionHint[]>
}>()

const emit = defineEmits<{
  (event: 'hover-start', enemyId: number): void
  (event: 'hover-end', enemyId: number): void
  (event: 'enemy-click', enemy: EnemyInfo): void
  (event: 'cancel-selection'): void
  (event: 'action-tooltip-enter', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'action-tooltip-move', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'action-tooltip-leave', payload: { key: string }): void
}>()
const audioStore = useAudioStore()

interface EnemySlot {
  id: number
  status: EnemyStatus
  isDefeated: boolean
  enemy?: EnemyInfo
}

const actingEnemyId = ref<number | null>(null)
const processedStageBatchIds = new Set<string>()
type EnemyDamageStageMetadata = Extract<StageEventMetadata, { stage: 'enemy-damage' }>
type PlayerDamageStageMetadata = Extract<StageEventMetadata, { stage: 'player-damage' }>
type DamageStageMetadata = EnemyDamageStageMetadata | PlayerDamageStageMetadata
type AlreadyActedStageMetadata = Extract<StageEventMetadata, { stage: 'already-acted-enemy' }>
type DefeatStageMetadata = Extract<StageEventMetadata, { stage: 'defeat' }>
type EscapeStageMetadata = Extract<StageEventMetadata, { stage: 'escape' }>
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

const escapeAnimatingIds = ref(new Set<number>())

const enemySlots = computed<EnemySlot[]>(() => {
  const current = props.snapshot
  const hintsMap = props.actionHintsByEnemyId ?? new Map<number, EnemyActionHint[]>()
  if (!current) {
    return []
  }

  return current.enemies.map((enemySnapshot) => {
    // 撃破直後に HP ゲージが 0 になる描画を出すため、escaped 以外は表示対象とする
    const isEscaped = enemySnapshot.status === 'escaped'
    const isDefeated = enemySnapshot.status === 'defeated'
    const isEscapeAnimating = escapeAnimatingIds.value.has(enemySnapshot.id)
    const shouldDisplay = !isEscaped || isEscapeAnimating
    const actionHints = hintsMap.get(enemySnapshot.id) ?? []
    const enemyInfo = shouldDisplay
      ? {
          id: enemySnapshot.id,
          name: enemySnapshot.name,
          status: enemySnapshot.status,
          image: enemySnapshot.image ?? '',
          hp: {
            current: enemySnapshot.currentHp,
            max: enemySnapshot.maxHp,
          },
          skills: enemySnapshot.skills ?? [],
          states: mapStatesToEntries(enemySnapshot.states) ?? [],
        }
      : undefined
    return {
      id: enemySnapshot.id,
      status: enemySnapshot.status,
      isDefeated,
      enemy: enemyInfo,
    }
  })
})

const hasVisibleEnemies = computed(() => enemySlots.value.some((slot) => Boolean(slot.enemy)))

const enemyStateMap = computed(() => {
  const map = new Map<number, { status: EnemyStatus; currentHp: number }>()
  const current = props.snapshot
  if (!current) {
    return map
  }
  current.enemies.forEach((enemySnapshot) => {
    map.set(enemySnapshot.id, { status: enemySnapshot.status, currentHp: enemySnapshot.currentHp })
  })
  return map
})

function isEnemyAlive(enemyId: number | undefined): boolean {
  if (enemyId === undefined) {
    return false
  }
  const state = enemyStateMap.value.get(enemyId)
  if (!state) {
    return false
  }
  return state.status === 'active' && state.currentHp > 0
}

function isEnemySelectable(enemyId: number | undefined): boolean {
  if (!props.isSelectingEnemy || enemyId === undefined) {
    return false
  }
  if (!isEnemyAlive(enemyId)) {
    return false
  }
  const hint = selectionHintMap.value.get(enemyId)
  if (!hint) {
    return true
  }
  return hint.selectable
}

function blockedReason(enemyId: number | undefined): string | undefined {
  if (!props.isSelectingEnemy || enemyId === undefined || !isEnemyAlive(enemyId)) {
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
    if (!event || !event.batchId) {
      return
    }
    const stage = (event.metadata as { stage?: string } | undefined)?.stage ?? 'unknown'
    const key = `${event.batchId}:${stage}`
    if (processedStageBatchIds.has(key)) {
      return
    }
    processedStageBatchIds.add(key)
    if (processedStageBatchIds.size > 500) {
      processedStageBatchIds.clear()
      processedStageBatchIds.add(key)
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
      case 'defeat':
        handleDefeatStage(metadata)
        break
      case 'escape':
        handleEscapeStage(metadata)
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
    if (import.meta.env?.VITE_DEBUG_ANIMATION_LOG === 'true') {
      // eslint-disable-next-line no-console
      console.warn('[EnemyArea] enemy-damage: enemyId missing', { event, metadata })
    }
    return
  }
  const outcomes =
    metadata.damageOutcomes?.map((outcome) => ({
      ...outcome,
    })) ?? []
  if (import.meta.env?.VITE_DEBUG_ANIMATION_LOG === 'true') {
    // eslint-disable-next-line no-console
    console.info('[EnemyArea] enemy-damage stage', { enemyId, outcomes, batchId: event.batchId })
  }
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

function handleDefeatStage(metadata: DefeatStageMetadata): void {
  const defeatedIds = Array.isArray(metadata.defeatedEnemyIds) ? metadata.defeatedEnemyIds : []
  defeatedIds.forEach((enemyId) => {
    const target = enemyCardRefs.get(enemyId)
    target?.playEnemySound?.('defeat')
  })
}

function handleEscapeStage(metadata: EscapeStageMetadata): void {
  if (metadata.subject !== 'enemy') {
    return
  }
  const enemyId = typeof metadata.subjectId === 'number' ? metadata.subjectId : undefined
  if (enemyId === undefined) {
    return
  }
  // 逃走中は defeat と同様にカードを表示したまま簡易の消失演出を出すため、逃走アニメーション対象として保持する。
  escapeAnimatingIds.value.add(enemyId)
  window.setTimeout(() => {
    escapeAnimatingIds.value.delete(enemyId)
  }, 1200)
  const target = enemyCardRefs.get(enemyId)
  if (target) {
    target.playEnemySound?.('escape')
  } else {
    // カードが既にアンマウントされていてもサウンドだけは確実に鳴らす
    audioStore.playSe('/sounds/escape/kurage-kosho_esc01.mp3')
  }
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
  if (!props.isSelectingEnemy || !isEnemyAlive(enemy.id)) {
    return
  }
  event.preventDefault()
  emit('cancel-selection')
}

function handleHoverStart(enemyId: number): void {
  if (!isEnemyAlive(enemyId)) {
    return
  }
  emit('hover-start', enemyId)
}

function handleHoverEnd(enemyId: number): void {
  if (!isEnemyAlive(enemyId)) {
    return
  }
  emit('hover-end', enemyId)
}

function mapStatesToEntries(states?: Array<State | StateSnapshot>): StateSnapshot[] | undefined {
  if (!states || states.length === 0) {
    return undefined
  }

  return states.map((state) => {
    if (typeof (state as State).getCategory === 'function') {
      const typed = state as State
      const stackable = typeof typed.isStackable === 'function' ? typed.isStackable() : Boolean(typed.magnitude !== undefined)
      return {
        id: typed.id,
        name: typed.name,
        description: typeof typed.description === 'function' ? typed.description() : '',
        magnitude: stackable ? typed.magnitude : undefined,
        category: typed.getCategory(),
        isImportant: typeof typed.isImportant === 'function' ? typed.isImportant() : false,
        stackable,
      }
    }
    const snapshot = state as StateSnapshot
    return {
      ...snapshot,
      stackable: snapshot.stackable,
    }
  })
}
</script>

<template>
  <section class="enemy-zone">
    <div v-if="isInitializing" class="zone-message">読み込み中...</div>
    <div v-else-if="!hasVisibleEnemies" class="zone-message">表示できる敵がありません</div>
    <TransitionGroup v-else name="enemy-card" tag="div" class="enemy-grid">
      <div
        v-for="slot in enemySlots"
        :key="slot.id"
        class="enemy-slot"
        :class="{
          'enemy-slot--spacer': !slot.enemy,
          'enemy-slot--defeated': slot.isDefeated,
        }"
      >
        <EnemyNextActions
          v-if="slot.nextActions.length"
          class="enemy-slot__actions"
          :enemy-id="slot.id"
          :actions="slot.nextActions"
          :highlighted="slot.enemy ? slot.enemy.id === actingEnemyId : false"
          @tooltip-enter="(payload) => emit('action-tooltip-enter', payload)"
          @tooltip-move="(payload) => emit('action-tooltip-move', payload)"
          @tooltip-leave="(payload) => emit('action-tooltip-leave', payload)"
        />
        <EnemyCard
          v-if="slot.enemy"
          :ref="(el) => registerEnemyCardRef(slot.enemy!.id, el as EnemyCardInstance | null)"
          :enemy="slot.enemy"
          :selectable="isEnemySelectable(slot.enemy.id)"
          :hovered="isSelectingEnemy && isEnemySelectable(slot.enemy.id) && hoveredEnemyId === slot.enemy.id"
          :selected="isSelectingEnemy && isEnemySelectable(slot.enemy.id) && hoveredEnemyId === slot.enemy.id"
          :selection-theme="props.selectionTheme"
          :acting="slot.enemy ? slot.enemy.status === 'active' && actingEnemyId === slot.enemy.id : false"
          :blocked-reason="blockedReason(slot.enemy.id)"
          @mouseenter="() => handleHoverStart(slot.enemy!.id)"
          @mouseleave="() => handleHoverEnd(slot.enemy!.id)"
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
  margin-top: 15px;
  margin-bottom: 45px;
}

.enemy-slot {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.enemy-slot--defeated {
  opacity: 0.7;
  filter: grayscale(0.4);
  pointer-events: none;
}

.enemy-slot--spacer {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.enemy-slot__actions {
  padding: 2px 4px;
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
</style>
