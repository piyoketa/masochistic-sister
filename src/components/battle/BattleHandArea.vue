<!--
BattleHandArea の責務:
- 戦闘スナップショットをもとに手札カードを描画し、カード選択〜使用までのインタラクションを管理する。
- 敵ターゲットを要求するカード操作では、親コンポーネントへ非同期に対象取得を依頼する。
- 手札表示に必要な説明文・タグ情報など UI 向けデータを整形する。

責務ではないこと:
- ViewManager へのカード使用リクエスト送信、敵エリアの選択状態管理は行わず、emit で親へ委譲する。
- 戦闘の進行状態（ターン管理やログ更新）の制御は担当しない。

主な通信相手とインターフェース:
- BattleView（親）: props で Snapshot や入力ロック状態、target 選択用の関数を受取り、`play-card` / `update-footer` / `reset-footer` / `error` / `hide-overlay` を emit。
  フッターメッセージ更新などの UI 全体制御を親へ委譲する。
- ActionCard: 各カードのレンダリングを担当する既存コンポーネント。`CardInfo` と操作情報を渡し、クリックイベントで選択を検知する。
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { Card } from '@/domain/entities/Card'
import type { Enemy } from '@/domain/entities/Enemy'
import ActionCard from '@/components/ActionCard.vue'
import type { CardInfo, CardTagInfo, EnemyActionHint, AttackStyle } from '@/types/battle'
import { TargetEnemyOperation, type CardOperation } from '@/domain/entities/operations'
import { Attack } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import { formatEnemyActionLabel } from '@/components/enemyActionFormatter.ts'
import type { ViewManager } from '@/view/ViewManager'
import type { CardTag } from '@/domain/entities/CardTag'

interface HandEntry {
  key: string
  info: CardInfo
  card: Card
  id?: number
  operations: string[]
  affordable: boolean
}

const props = defineProps<{
  snapshot: BattleSnapshot | undefined
  hoveredEnemyId: number | null
  isInitializing: boolean
  errorMessage: string | null
  isPlayerTurn: boolean
  isInputLocked: boolean
  viewManager: ViewManager
  requestEnemyTarget: () => Promise<number>
  cancelEnemySelection: () => void
}>()

const emit = defineEmits<{
  (event: 'play-card', payload: { cardId: number; operations: CardOperation[] }): void
  (event: 'update-footer', message: string): void
  (event: 'reset-footer'): void
  (event: 'error', message: string): void
  (event: 'hide-overlay'): void
}>()

const interactionState = reactive<{
  selectedCardKey: string | null
  selectedCardId: number | null
  isAwaitingEnemy: boolean
}>({
  selectedCardKey: null,
  selectedCardId: null,
  isAwaitingEnemy: false,
})

const supportedOperations = new Set<string>([TargetEnemyOperation.TYPE])

const handEntries = computed<HandEntry[]>(() => {
  const current = props.snapshot
  if (!current) {
    return []
  }

  const currentMana = current.player.currentMana
  return current.hand.map((card, index) => buildHandEntry(card, index, currentMana))
})

const hasCards = computed(() => handEntries.value.length > 0)

function buildHandEntry(card: Card, index: number, currentMana: number): HandEntry {
  const definition = card.definition
  const identifier = card.id !== undefined ? `card-${card.id}` : `card-${index}`
  const operations = definition.operations ?? []
  const affordable = card.cost <= currentMana

  const { description, descriptionSegments, attackStyle, tagEntries } = buildCardPresentation(card, index)

  return {
    key: identifier,
    info: {
      id: identifier,
      title: card.title,
      type: card.type,
      cost: card.cost,
      illustration: definition.image ?? '🂠',
      description,
      descriptionSegments,
      attackStyle,
      cardTags: tagEntries,
    },
    card,
    id: card.id,
    operations,
    affordable,
  }
}

function buildCardPresentation(card: Card, index: number): {
  description: string
  descriptionSegments?: Array<{ text: string; highlighted?: boolean }>
  attackStyle?: AttackStyle
  tagEntries: CardTagInfo[]
} {
  const definition = card.definition
  const tagEntries: CardTagInfo[] = []
  const seenTagIds = new Set<string>()

  let description = card.description
  let descriptionSegments: Array<{ text: string; highlighted?: boolean }> | undefined
  let attackStyle: AttackStyle | undefined

  addTagEntry(definition.type, tagEntries, seenTagIds)
  if ('target' in definition) {
    addTagEntry(definition.target, tagEntries, seenTagIds)
  }
  for (const tag of card.cardTags ?? []) {
    addTagEntry(tag, tagEntries, seenTagIds)
  }

  const action = card.action
  const battle = props.viewManager.battle

  if (action instanceof Attack) {
    const damages = action.baseDamages
    const primaryState = action.inflictStatePreviews[0]
    const hint: EnemyActionHint = {
      title: card.title,
      type: 'attack',
      icon: '',
      pattern: {
        amount: damages.baseAmount,
        count: damages.baseCount,
        type: damages.type,
      },
      calculatedPattern: undefined,
      status: primaryState
        ? {
            name: primaryState.name,
            magnitude: primaryState.magnitude ?? 1,
          }
        : undefined,
      description: action.describe(),
    }

    const formatWithCalculated = (calculated?: { amount: number; count?: number }) => {
      const formatted = formatEnemyActionLabel(
        calculated
          ? {
              ...hint,
              calculatedPattern: {
                amount: calculated.amount,
                count: calculated.count,
              },
            }
          : hint,
        { includeTitle: false },
      )
      description = formatted.label
      descriptionSegments = formatted.segments
    }

    formatWithCalculated()

    const targetEnemyId = props.hoveredEnemyId
    if (battle && interactionState.selectedCardKey === `card-${card.id ?? index}` && targetEnemyId !== null) {
      const enemy = battle.enemyTeam.findEnemy(targetEnemyId) as Enemy | undefined
      if (enemy) {
        const calculatedDamages = new Damages({
          baseAmount: damages.baseAmount,
          baseCount: damages.baseCount,
          type: damages.type,
          attackerStates: battle.player.getStates(),
          defenderStates: enemy.getStates(),
        })
        formatWithCalculated({
          amount: calculatedDamages.amount,
          count: calculatedDamages.count,
        })
      }
    }

    const typeTagId = definition.type.id
    if (typeTagId === 'tag-type-multi-attack') {
      attackStyle = 'multi'
    } else if (typeTagId === 'tag-type-single-attack') {
      attackStyle = 'single'
    } else {
      const count = Math.max(1, Math.floor(damages.baseCount ?? 1))
      attackStyle = count > 1 ? 'multi' : 'single'
    }
  }

  return { description, descriptionSegments, attackStyle, tagEntries }
}

function addTagEntry(tag: CardTag | undefined, entries: CardTagInfo[], registry: Set<string>): void {
  if (!tag || registry.has(tag.id)) {
    return
  }
  registry.add(tag.id)
  entries.push({
    id: tag.id,
    label: `[${tag.name}]`,
    description: tag.description,
  })
}

function isCardDisabled(entry: HandEntry): boolean {
  if (props.isInputLocked) {
    return true
  }
  if (!props.isPlayerTurn) {
    return true
  }
  if (!entry.affordable) {
    return true
  }
  if (interactionState.isAwaitingEnemy) {
    return interactionState.selectedCardKey !== entry.key
  }
  return false
}


function handleCardHoverStart(): void {
  if (interactionState.isAwaitingEnemy) {
    return
  }
  emit('update-footer', '左クリック：使用　右クリック：詳細')
}

function handleCardHoverEnd(): void {
  if (interactionState.isAwaitingEnemy) {
    return
  }
  emit('reset-footer')
}

async function handleCardClick(entry: HandEntry): Promise<void> {
  if (props.isInputLocked || !props.isPlayerTurn || !entry.affordable) {
    return
  }

  if (interactionState.isAwaitingEnemy && interactionState.selectedCardKey !== entry.key) {
    return
  }

  if (entry.id === undefined) {
    emit('error', 'カードにIDが割り当てられていません')
    return
  }

  interactionState.selectedCardKey = entry.key
  interactionState.selectedCardId = entry.id

  if (entry.operations.length === 0) {
    emit('play-card', { cardId: entry.id, operations: [] })
    resetSelection()
    return
  }

  const unsupported = entry.operations.filter((operation) => !supportedOperations.has(operation))
  if (unsupported.length > 0) {
    emit(
      'error',
      `未対応の操作が含まれているため、このカードは使用できません (${unsupported.join(', ')})`,
    )
    resetSelection()
    emit('hide-overlay')
    return
  }

  try {
    await executeOperations(entry)
  } catch (error) {
    if (error instanceof Error) {
      emit('error', error.message)
    } else {
      emit('error', String(error))
    }
    resetSelection()
  }
}

async function executeOperations(entry: HandEntry): Promise<void> {
  const collectedOperations: CardOperation[] = []

  for (const operationType of entry.operations) {
    if (operationType === TargetEnemyOperation.TYPE) {
      interactionState.isAwaitingEnemy = true
      emit('update-footer', '対象の敵を選択：左クリックで決定　右クリックでキャンセル')
      try {
        const enemyId = await props.requestEnemyTarget()
        collectedOperations.push({
          type: TargetEnemyOperation.TYPE,
          payload: enemyId,
        })
      } finally {
        interactionState.isAwaitingEnemy = false
        emit('reset-footer')
      }
      continue
    }

    throw new Error(`未対応の操作 ${operationType} です`)
  }

  const cardId = interactionState.selectedCardId
  if (cardId === null) {
    throw new Error('カード使用に必要な情報が不足しています')
  }

  emit('play-card', { cardId, operations: collectedOperations })
  resetSelection({ keepSelection: false })
}

function resetSelection(options?: { keepSelection?: boolean }): void {
  interactionState.isAwaitingEnemy = false
  if (!options?.keepSelection) {
    interactionState.selectedCardKey = null
    interactionState.selectedCardId = null
  }
  emit('reset-footer')
  emit('hide-overlay')
}

function cancelSelection(): void {
  if (interactionState.isAwaitingEnemy) {
    props.cancelEnemySelection()
  }
  resetSelection()
}

defineExpose({ resetSelection, cancelSelection })
</script>

<template>
  <section class="hand-zone">
    <div v-if="errorMessage" class="zone-message zone-message--error">
      {{ errorMessage }}
    </div>
    <div v-else-if="isInitializing" class="zone-message">カード情報を読み込み中...</div>
    <div v-else-if="!hasCards" class="zone-message">手札は空です</div>
    <TransitionGroup v-else name="hand-card" tag="div" class="hand-grid">
      <ActionCard
        v-for="entry in handEntries"
        :key="entry.key"
        v-bind="entry.info"
        :operations="entry.operations"
        :affordable="entry.affordable"
        :selected="interactionState.selectedCardKey === entry.key"
        :disabled="isCardDisabled(entry)"
        @click="handleCardClick(entry)"
        @mouseenter="handleCardHoverStart"
        @mouseleave="handleCardHoverEnd"
      />
    </TransitionGroup>
  </section>
</template>

<style scoped>
.hand-zone {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px;
  min-height: 220px;
}

.hand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
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
