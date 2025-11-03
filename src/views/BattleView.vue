<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import HpGauge from '@/components/HpGauge.vue'
import ActionCard from '@/components/ActionCard.vue'
import EnemyCard from '@/components/EnemyCard.vue'
import {
  ViewManager,
  type AnimationCommand,
  type AnimationScript,
  type ViewManagerEvent,
} from '@/view/ViewManager'
import { ActionLog } from '@/domain/battle/ActionLog'
import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildDefaultDeck } from '@/domain/entities/decks'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '@/domain/entities/enemies'
import { Attack, Action as BattleAction } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import type { Enemy } from '@/domain/entities/Enemy'
import type {
  EnemyInfo,
  EnemyTrait,
  CardInfo,
  EnemyActionHint,
  AttackStyle,
  CardTagInfo,
} from '@/types/battle'
import type { Card } from '@/domain/entities/Card'
import type { State } from '@/domain/entities/State'
import { TargetEnemyOperation, type CardOperation } from '@/domain/entities/operations'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import { formatEnemyActionLabel } from '@/components/enemyActionFormatter.ts'

const props = defineProps<{ viewManager?: ViewManager }>()
const viewManager = props.viewManager ?? createDefaultViewManager()

const managerState = viewManager.state
const errorMessage = ref<string | null>(null)
const currentAnimationId = ref<string | null>(null)

const subscriptions: Array<() => void> = []

interface HandCardViewModel {
  key: string
  info: CardInfo
  card: Card
  numericId?: number
  operations: string[]
  affordable: boolean
}

type InteractionMode = 'idle' | 'selecting-target-enemy'

const interactionState = reactive<{
  mode: InteractionMode
  selectedCardId: string | null
  selectedCardNumericId: number | null
  pendingOperations: string[]
  collectedOperations: CardOperation[]
}>({
  mode: 'idle',
  selectedCardId: null,
  selectedCardNumericId: null,
  pendingOperations: [],
  collectedOperations: [],
})

const layoutRef = ref<HTMLDivElement | null>(null)
const { state: descriptionOverlay, hide: hideDescriptionOverlay } = useDescriptionOverlay()

const snapshot = computed(() => managerState.snapshot)
const isInitializing = computed(() => managerState.playback.status === 'initializing')
const hasSnapshot = computed(() => !!snapshot.value)
const playbackSpeed = computed(() => managerState.playback.speed)
const isInputLocked = computed(() => managerState.input.locked)
const pendingInputCount = computed(() => managerState.input.queued.length)
const isPlayerTurn = computed(() => snapshot.value?.turn.activeSide === 'player')
const isSelectingEnemy = computed(() => interactionState.mode === 'selecting-target-enemy')
const hoveredEnemyId = ref<number | null>(null)

const descriptionOverlayStyle = computed(() => {
  const layout = layoutRef.value
  if (!layout) {
    return { left: '0px', top: '0px' }
  }
  const rect = layout.getBoundingClientRect()
  const offsetX = descriptionOverlay.x - rect.left + 12
  const offsetY = descriptionOverlay.y - rect.top + 12
  return {
    left: `${offsetX}px`,
    top: `${offsetY}px`,
  }
})

function handleManagerEvent(event: ViewManagerEvent) {
  switch (event.type) {
    case 'error':
      errorMessage.value = event.error.message
      break
    case 'animation-start':
      currentAnimationId.value = event.script.id
      void runAnimation(event.script)
      break
    case 'animation-complete':
      if (currentAnimationId.value === event.script.id) {
        currentAnimationId.value = null
      }
      break
    default:
      break
  }
}

subscriptions.push(viewManager.subscribe(handleManagerEvent))

onMounted(() => {
  viewManager
    .initialize()
    .catch((error) => {
      errorMessage.value = error instanceof Error ? error.message : String(error)
    })
})

onUnmounted(() => {
  subscriptions.forEach((dispose) => dispose())
})

const portraitSrc = '/assets/characters/sister.jpg'
const defaultFooterMessage = '対象にカーソルを合わせて操作を確認'
const footerMessage = ref(defaultFooterMessage)

const playerName = computed(() => snapshot.value?.player.name ?? '？？？')
const turnLabel = computed(() => {
  const currentTurn = snapshot.value?.turn.turnCount
  return currentTurn !== undefined ? `ターン ${currentTurn}` : 'ターン -'
})
const phaseLabel = computed(() => {
  const activeSide = snapshot.value?.turn.activeSide
  if (activeSide === 'player') {
    return 'Player Turn'
  }
  if (activeSide === 'enemy') {
    return 'Enemy Turn'
  }
  return 'Turn -'
})
const manaLabel = computed(() => {
  const player = snapshot.value?.player
  return player ? `${player.currentMana} / ${player.maxMana}` : '- / -'
})
const playerHpGauge = computed(() => ({
  current: snapshot.value?.player.currentHp ?? 0,
  max: snapshot.value?.player.maxHp ?? 0,
}))
const deckCount = computed(() => snapshot.value?.deck.length ?? 0)
const discardCount = computed(() => snapshot.value?.discardPile.length ?? 0)
const isGameOver = computed(() => (snapshot.value?.player.currentHp ?? 0) <= 0)
const isVictory = computed(() => {
  const current = snapshot.value
  if (!current) {
    return false
  }
  const playerHp = current.player?.currentHp ?? 0
  if (playerHp <= 0) {
    return false
  }
  const enemyList = current.enemies ?? []
  if (enemyList.length === 0) {
    return false
  }
  const survivingEnemies = enemyList.filter((enemy) => enemy.currentHp > 0)
  return survivingEnemies.length === 0
})
const canRetry = computed(() => viewManager.canRetry())
const canUndo = computed(() => viewManager.hasUndoableAction())

const enemies = computed<EnemyInfo[]>(() => {
  const current = snapshot.value
  if (!current) {
    return []
  }

  const aliveEnemies = current.enemies.filter((enemy) => enemy.currentHp > 0)

  return aliveEnemies.map((enemy) => {
    const catalog = enemyCatalogByName[enemy.name]
    const traitList = mergeTraits(catalog?.traits, mapStatesToTraits(enemy.traits))
    const stateList = mapStatesToTraits(enemy.states) ?? []

    return {
      numericId: enemy.numericId,
      name: enemy.name,
      image: catalog?.image ?? '',
      hp: { current: enemy.currentHp, max: enemy.maxHp },
      nextActions: summarizeEnemyActions(viewManager.battle, enemy.numericId),
      skills: catalog?.skills ?? [],
      traits: traitList,
      states: stateList,
    }
  })
})

const handCards = computed<HandCardViewModel[]>(() => {
  const current = snapshot.value
  if (!current) {
    return []
  }

  const currentMana = current.player.currentMana

  return current.hand.map((card, index) => {
    const info = convertCardToCardInfo(card, index)
    const operations = card.definition.operations ?? []
    const affordable = card.cost <= currentMana
    return {
      key: info.id,
      info,
      card,
      numericId: card.numericId,
      operations,
      affordable,
    }
  })
})

const handCardCount = computed(() => handCards.value.length)

function convertCardToCardInfo(card: Card, index: number): CardInfo {
  const definition = card.definition
  const identifier = card.numericId !== undefined ? `card-${card.numericId}` : `card-${index}`
  const action = card.action
  const operations = definition.operations ?? []

  let description = card.description
  let descriptionSegments: Array<{ text: string; highlighted?: boolean }> | undefined
  let attackStyle: AttackStyle | undefined
  const tagEntries: CardTagInfo[] = []

  if (card.type === 'status') {
    tagEntries.push({
      id: 'synthetic-card-type-status',
      label: '[状態異常]',
      description: '敵や自身に状態異常を付与するカード。',
    })
  }

  if (operations.includes(TargetEnemyOperation.TYPE)) {
    tagEntries.push({
      id: 'synthetic-target-enemy',
      label: '[敵１体]',
      description: '対象：敵１体',
    })
  } else {
    tagEntries.push({
      id: 'synthetic-target-self',
      label: '[自身]',
      description: '対象：自身',
    })
  }

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

    const battle = viewManager.battle
    const isSelected = interactionState.selectedCardId === identifier
    const targetEnemyId = hoveredEnemyId.value
    if (battle && isSelected && targetEnemyId !== null) {
      const enemy = battle.enemyTeam.findEnemyByNumericId(targetEnemyId) as Enemy | undefined
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

    const pattern = hint.pattern ?? {
      amount: damages.baseAmount,
      count: damages.baseCount,
      type: damages.type,
    }
    if (pattern) {
      const count = Math.max(1, Math.floor(pattern.count ?? 1))
      attackStyle = count > 1 ? 'multi' : 'single'
    }
  }

  const runtimeTags = card.cardTags ?? []
  for (const tag of runtimeTags) {
    tagEntries.push({
      id: tag.id,
      label: `[${tag.name}]`,
      description: tag.description,
    })
  }

  return {
    id: identifier,
    title: card.title,
    type: card.type,
    cost: card.cost,
    illustration: definition.image ?? '🂠',
    description,
    descriptionSegments,
    notes: definition.notes,
    attackStyle,
    cardTags: tagEntries,
  }
}

// TODO: これらの情報はEnemyに移す
const enemyCatalogByName: Record<
  string,
  {
    image: string
    skills?: EnemyInfo['skills']
    traits?: EnemyTrait[]
  }
> = {
  オーク: {
    image: '/assets/enemies/orc.jpg',
    skills: [
      { name: 'たいあたり', detail: '20ダメージ' },
      { name: 'ビルドアップ', detail: '攻撃力を+10する' },
    ],
  },
  'オークダンサー（短剣）': {
    image: '/assets/enemies/orc-dancer.jpg',
    skills: [
      { name: '乱れ突き', detail: '10 × 2' },
      { name: '加速', detail: '攻撃回数を+1する' },
    ],
  },
  かたつむり: {
    image: '/assets/enemies/snail.jpg',
    skills: [
      { name: '酸を吐く', detail: '5ダメージ + 溶解付与' },
      { name: 'たいあたり', detail: '10ダメージ' },
    ],
    traits: [{ name: '硬い殻', detail: 'ダメージを-20する' }],
  },
  かまいたち: {
    image: '/assets/enemies/kamaitachi.jpg',
    skills: [
      { name: '追い風', detail: '味方の攻撃回数を＋1する' },
      { name: '乱れ突き', detail: '5 × 4回攻撃' },
    ],
    traits: [{ name: '臆病', detail: '「臆病」以外の敵がいない時、逃げる' }],
  },
}

function mapStatesToTraits(states?: State[]): EnemyTrait[] | undefined {
  if (!states || states.length === 0) {
    return undefined
  }

  return states.map((state) => ({
    name: state.name,
    detail: state.description(),
    magnitude: state.magnitude,
  }))
}

function mergeTraits(...groups: Array<EnemyTrait[] | undefined>): EnemyTrait[] {
  const registry = new Map<string, EnemyTrait>()
  for (const group of groups) {
    if (!group) continue
    for (const trait of group) {
      registry.set(trait.name, trait)
    }
  }

  return Array.from(registry.values())
}

function summarizeEnemyActions(battle: Battle | undefined, enemyId: number): EnemyActionHint[] {
  if (!battle) {
    return []
  }

  const enemy = battle.enemyTeam.findEnemyByNumericId(enemyId) as Enemy | undefined
  if (!enemy) {
    return []
  }

  if (enemy.hasActedThisTurn) {
    return [
      {
        title: '行動済み',
        type: 'skill',
        icon: '',
        acted: true,
        description: `${enemy.name}はこのターン既に行動済み。`,
      },
    ]
  }

  const queued = enemy.queuedActions
  if (!queued || queued.length === 0) {
    return []
  }

  const [nextAction] = queued
  return nextAction ? [summarizeEnemyAction(battle, enemy, nextAction)] : []
}

function summarizeEnemyAction(battle: Battle, enemy: Enemy, action: BattleAction): EnemyActionHint {
  if (action instanceof SkipTurnAction) {
    return {
      title: action.name,
      type: 'skip',
      icon: '',
      description: action.describe(),
    }
  }

  if (action instanceof Attack) {
    return buildAttackActionHint(battle, enemy, action)
  }

  return buildSkillActionHint(action)
}

function buildAttackActionHint(battle: Battle, enemy: Enemy, action: Attack): EnemyActionHint {
  const damages = action.baseDamages
  const states = action.inflictStatePreviews
  const primaryState = states[0]

  const calculatedDamages = new Damages({
    baseAmount: damages.baseAmount,
    baseCount: damages.baseCount,
    type: damages.type,
    attackerStates: enemy.getStates(),
    defenderStates: battle.player.getStates(),
  })

  return {
    title: action.name,
    type: 'attack',
    icon: '',
    pattern: {
      amount: damages.baseAmount,
      count: damages.baseCount,
      type: damages.type,
    },
    calculatedPattern: {
      amount: calculatedDamages.amount,
      count: calculatedDamages.count,
    },
    status: primaryState
      ? {
          name: primaryState.name,
          magnitude: primaryState.magnitude ?? 1,
          description: primaryState.description(),
        }
      : undefined,
    description: action.describe(),
  }
}

function buildSkillActionHint(action: BattleAction): EnemyActionHint {
  const gainState = action.gainStatePreviews[0]

  return {
    title: action.name,
    type: action.type === 'skill' ? 'skill' : 'attack',
    icon: '',
    selfState: gainState
      ? {
          name: gainState.name,
          magnitude: gainState.magnitude,
          description: gainState.description(),
        }
      : undefined,
    description: action.describe(),
  }
}

const supportedOperations = new Set<string>([TargetEnemyOperation.TYPE])

function isCardDisabled(entry: HandCardViewModel): boolean {
  if (isInputLocked.value) {
    return true
  }
  if (!isPlayerTurn.value) {
    return true
  }
  if (!entry.affordable) {
    return true
  }
  if (isSelectingEnemy.value) {
    return interactionState.selectedCardId !== entry.key
  }
  return false
}

function handleCardClick(entry: HandCardViewModel): void {
  if (isInputLocked.value || isSelectingEnemy.value || !isPlayerTurn.value || !entry.affordable) {
    return
  }

  if (entry.numericId === undefined) {
    errorMessage.value = 'カードにIDが割り当てられていません'
    return
  }

  interactionState.mode = 'idle'
  interactionState.selectedCardId = entry.key
  interactionState.selectedCardNumericId = entry.numericId
  interactionState.pendingOperations = [...entry.operations]
  interactionState.collectedOperations = []

  if (entry.operations.length === 0) {
    submitCardUsage()
    return
  }

  const unsupported = entry.operations.filter((operation) => !supportedOperations.has(operation))
  if (unsupported.length > 0) {
    errorMessage.value = `未対応の操作が含まれているため、このカードは使用できません (${unsupported.join(', ')})`
    resetInteractionState()
    return
  }

  proceedToNextOperation()
}

function proceedToNextOperation(): void {
  const nextOperationType = interactionState.pendingOperations[interactionState.collectedOperations.length]

  if (!nextOperationType) {
    submitCardUsage()
    return
  }

  if (nextOperationType === TargetEnemyOperation.TYPE) {
    interactionState.mode = 'selecting-target-enemy'
    footerMessage.value = '対象の敵を選択：左クリックで決定　右クリックでキャンセル'
    hoveredEnemyId.value = null
    return
  }

  errorMessage.value = `未対応の操作 ${nextOperationType} です`
  resetInteractionState()
}

function handleEnemyHoverStart(enemyId: number): void {
  if (!isSelectingEnemy.value) {
    return
  }
  hoveredEnemyId.value = enemyId
}

function handleEnemyHoverEnd(enemyId: number): void {
  if (hoveredEnemyId.value === enemyId) {
    hoveredEnemyId.value = null
  }
}

function handleEnemyClick(enemy: EnemyInfo): void {
  if (!isSelectingEnemy.value) {
    return
  }

  interactionState.collectedOperations.push({
    type: TargetEnemyOperation.TYPE,
    payload: enemy.numericId,
  })

  interactionState.mode = 'idle'
  proceedToNextOperation()
}

function submitCardUsage(): void {
  const cardId = interactionState.selectedCardNumericId
  if (cardId === null) {
    resetInteractionState()
    return
  }

  viewManager.queuePlayerAction({
    type: 'play-card',
    cardId,
    operations: [...interactionState.collectedOperations],
  })

  resetInteractionState()
}

function resetInteractionState(options?: { keepFooter?: boolean }): void {
  interactionState.mode = 'idle'
  interactionState.selectedCardId = null
  interactionState.selectedCardNumericId = null
  interactionState.pendingOperations = []
  interactionState.collectedOperations = []
  hoveredEnemyId.value = null
  if (!options?.keepFooter) {
    footerMessage.value = defaultFooterMessage
  }
}

async function runAnimation(script: AnimationScript): Promise<void> {
  try {
    for (const command of script.commands) {
      await executeCommand(command)
    }
  } catch (unknownError) {
    const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError))
    errorMessage.value = error.message
  } finally {
    try {
      viewManager.completeCurrentAnimation(script.id)
    } catch (unknownError) {
      const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError))
      errorMessage.value = error.message
    }
  }
}

async function executeCommand(command: AnimationCommand): Promise<void> {
  switch (command.type) {
    case 'wait': {
      const normalized = Math.max(0, command.duration)
      const speed = Math.max(0.001, playbackSpeed.value)
      const duration = normalized / speed
      if (duration <= 0) {
        return
      }
      await waitFor(duration)
      break
    }
    case 'update-snapshot':
    case 'set-input-lock':
      viewManager.applyAnimationCommand(command)
      await nextTick()
      break
    case 'custom':
      viewManager.applyAnimationCommand(command)
      break
    default:
      break
  }
}

function waitFor(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}

function handleEndTurnClick(): void {
  viewManager.queuePlayerAction({ type: 'end-player-turn' })
}

function handleRetryClick(): void {
  viewManager.resetToInitialState()
  resetInteractionState()
  hideDescriptionOverlay()
  errorMessage.value = null
}

function handleUndoClick(): void {
  const undone = viewManager.undoLastPlayerAction()
  if (!undone) {
    return
  }
  resetInteractionState()
  hideDescriptionOverlay()
  errorMessage.value = null
}

function handleContextMenu(): void {
  if (isSelectingEnemy.value) {
    resetInteractionState()
  }
  hideDescriptionOverlay()
}

function createDefaultViewManager(): ViewManager {
  const actionLog = new ActionLog([
    { type: 'battle-start' },
    { type: 'start-player-turn', draw: 5 },
  ])

  return new ViewManager({
    createBattle: () => createSampleBattle(),
    actionLog,
    playbackOptions: { defaultSpeed: 1, autoPlay: false },
    initialActionLogIndex: 1,
  })
}

function createSampleBattle(): Battle {
  const cardRepository = new CardRepository()
  const defaultDeck = buildDefaultDeck(cardRepository)
  const player = new ProtagonistPlayer()
  const enemyTeam = new EnemyTeam({
    id: 'enemy-team-demo',
    members: [
      new OrcEnemy({ rng: () => 0.05 }),
      new OrcDancerEnemy({ rng: () => 0.85 }),
      new TentacleEnemy({ rng: () => 0.85 }),
      new SnailEnemy({ rng: () => 0.95 }),
    ],
  })

  return new Battle({
    id: 'battle-view-demo',
    cardRepository,
    player,
    enemyTeam,
    deck: new Deck(defaultDeck.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}
</script>

<template>
  <GameLayout>
    <template #window>
      <div ref="layoutRef" class="battle-layout" @contextmenu.prevent="handleContextMenu">
        <header class="battle-header">
          <div class="header-left">
            <span class="phase-label">{{ phaseLabel }}</span>
          </div>
          <div class="header-actions">
            <button
              type="button"
              class="header-button"
              :disabled="!canRetry"
              @click="handleRetryClick"
            >
              Retry
            </button>
            <button
              type="button"
              class="header-button"
              :disabled="!canUndo"
              @click="handleUndoClick"
            >
              一手戻す
            </button>
          </div>
          <div class="header-right">
            <span>{{ turnLabel }}</span>
            <span>手札 {{ handCardCount }}</span>
          </div>
        </header>

        <div class="battle-body">
          <main class="battle-main">
            <section class="enemy-zone">
              <div v-if="errorMessage" class="zone-message zone-message--error">{{ errorMessage }}</div>
              <div v-else-if="isInitializing" class="zone-message">読み込み中...</div>
              <div v-else-if="!hasSnapshot || enemies.length === 0" class="zone-message">
                表示できる敵がありません
              </div>
              <TransitionGroup v-else name="enemy-card" tag="div" class="enemy-grid">
                <EnemyCard
                  v-for="enemy in enemies"
                  :key="enemy.numericId"
                  :enemy="enemy"
                  :selectable="isSelectingEnemy"
                  :hovered="isSelectingEnemy && hoveredEnemyId === enemy.numericId"
                  :selected="isSelectingEnemy && hoveredEnemyId === enemy.numericId"
                  @hover-start="() => handleEnemyHoverStart(enemy.numericId)"
                  @hover-end="() => handleEnemyHoverEnd(enemy.numericId)"
                  @click="handleEnemyClick(enemy)"
                />
              </TransitionGroup>
            </section>

            <section class="hand-zone">
              <div v-if="errorMessage" class="zone-message zone-message--error">{{ errorMessage }}</div>
              <div v-else-if="isInitializing" class="zone-message">カード情報を読み込み中...</div>
              <div v-else-if="handCards.length === 0" class="zone-message">手札は空です</div>
              <TransitionGroup v-else name="hand-card" tag="div" class="hand-grid">
                <ActionCard
                  v-for="entry in handCards"
                  :key="entry.key"
                  v-bind="entry.info"
                  :operations="entry.operations"
                  :affordable="entry.affordable"
                  :selected="interactionState.selectedCardId === entry.key"
                  :disabled="isCardDisabled(entry)"
                  @click="handleCardClick(entry)"
                />
              </TransitionGroup>
            </section>
          </main>

          <aside class="battle-sidebar">
            <div class="portrait">
              <img
                :src="portraitSrc"
                alt="聖女の立ち絵"
                class="portrait-image"
                decoding="async"
              />
              <div class="sidebar-overlay-container">
                <div class="sidebar-overlay">
                  <div class="mana-pop">
                    <span class="mana-pop__value">{{ manaLabel }}</span>
                  </div>
                  <HpGauge :current="playerHpGauge.current" :max="playerHpGauge.max" />
                  <div class="overlay-row" style="display: none;">
                    <span class="overlay-label">プレイヤー</span>
                    <span class="overlay-value">{{ playerName }}</span>
                  </div>
                  <div class="overlay-row">
                    <span class="overlay-label">デッキ</span>
                    <span class="overlay-value">{{ deckCount }}</span>
                  </div>
                  <div class="overlay-row">
                    <span class="overlay-label">捨て札</span>
                    <span class="overlay-value">{{ discardCount }}</span>
                  </div>
                  <div v-if="pendingInputCount > 0" class="overlay-row">
                    <span class="overlay-label">操作キュー</span>
                    <span class="overlay-value">{{ pendingInputCount }}</span>
                  </div>
                </div>
                <button
                  class="end-turn-button sidebar-action"
                  type="button"
                  :disabled="isInputLocked"
                  @click="handleEndTurnClick"
                >
                  ターン終了
                </button>
              </div>
            </div>
          </aside>
          <div v-if="isGameOver" class="battle-gameover-overlay">
            <div class="gameover-text">GAME OVER</div>
          </div>
          <div v-else-if="isVictory" class="battle-victory-overlay">
            <div class="victory-text">VICTORY!</div>
          </div>
        </div>
        <div
          class="description-overlay"
          v-show="descriptionOverlay.visible"
          :style="descriptionOverlayStyle"
        >
          {{ descriptionOverlay.text }}
        </div>

        <footer class="battle-footer">
          <span class="footer-message">{{ footerMessage }}</span>
        </footer>
      </div>
    </template>
    <template #instructions>
      <h2>次フェーズの指針</h2>
      <ol>
        <li>敵の攻撃記録カードをデッキへ追加し、挙動を検証する</li>
        <li>プレイヤー行動のターン進行と、ステータス更新順序を整理する</li>
        <li>演出・SEのタイミングを試し、緊張感を高められるか確認する</li>
      </ol>
    </template>
  </GameLayout>
</template>

<style scoped>
.battle-layout {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top left, rgba(48, 48, 72, 0.9), rgba(12, 12, 16, 0.95));
  border-radius: 0;
  border: none;
  overflow: hidden;
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  background: linear-gradient(90deg, rgba(120, 97, 190, 0.22), rgba(70, 69, 122, 0.35));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-button {
  padding: 6px 14px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 227, 115, 0.92);
  color: #402510;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
}

.header-button:hover:not(:disabled),
.header-button:focus-visible:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.42);
}

.header-button:disabled {
  background: rgba(120, 120, 128, 0.4);
  color: rgba(235, 235, 235, 0.7);
  cursor: not-allowed;
  box-shadow: none;
}

.phase-label {
  font-size: 16px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.92);
}

.header-right {
  display: flex;
  gap: 16px;
  font-size: 14px;
  opacity: 0.9;
}

.battle-body {
  display: grid;
  grid-template-columns: 1fr 200px;
  flex: 1;
  min-height: 0;
  position: relative;
}

.description-overlay {
  position: absolute;
  min-width: 160px;
  max-width: 280px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(8, 10, 22, 0.95);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  line-height: 1.4;
  letter-spacing: 0.04em;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  transform: translate(0, 0);
  z-index: 20;
  backdrop-filter: blur(6px);
}

.battle-main {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(28, 28, 48, 0.75), rgba(18, 18, 24, 0.85));
  gap: 0;
  flex: 1;
  min-height: 0;
}

.enemy-zone,
.hand-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
  min-height: 0;
}

.enemy-zone {
  flex: 0 0 230px;
  max-height: 230px;
  padding: 0 16px;
}

.hand-zone {
  flex: 1 1 auto;
  background: rgba(245, 245, 250, 0.18);
  padding: 0;
}

.enemy-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 16px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
  align-content: center;
  position: relative;
}

.hand-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 18px 24px;
  flex: 1;
  min-height: 0;
  justify-items: center;
  align-content: start;
  overflow-y: auto;
  padding: 30px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 16px;
}

:deep(.hand-card-enter-active),
:deep(.hand-card-leave-active) {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

:deep(.hand-card-enter-from),
:deep(.hand-card-leave-to) {
  opacity: 0;
  transform: translateY(-16px);
}

:deep(.hand-card-enter-to),
:deep(.hand-card-leave-from) {
  opacity: 1;
  transform: translateY(0);
}

:deep(.hand-card-leave-active) {
  position: absolute;
}

:deep(.hand-card-move) {
  transition: transform 0.5s ease;
}

:deep(.enemy-card-enter-active),
:deep(.enemy-card-leave-active) {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

:deep(.enemy-card-enter-from),
:deep(.enemy-card-leave-to) {
  opacity: 0;
  transform: translateY(-16px);
}

:deep(.enemy-card-enter-to),
:deep(.enemy-card-leave-from) {
  opacity: 1;
  transform: translateY(0);
}

:deep(.enemy-card-leave-active) {
  position: absolute;
}

:deep(.enemy-card-move) {
  transition: transform 0.5s ease;
}

.battle-sidebar {
  position: relative;
  display: flex;
  padding: 0;
  background: #0e0e18;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden;
}

.portrait {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  position: relative;
}

.portrait-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.sidebar-overlay-container {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(12, 12, 22, 0.6), rgba(1, 1, 2, 0.85));
  box-sizing: border-box;
}

.sidebar-overlay {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(12, 12, 24, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 28px rgba(0, 0, 0, 0.35);
}

.mana-pop {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(255, 227, 115, 0.92);
  color: #402510;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.mana-pop__value {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.battle-gameover-overlay,
.battle-victory-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
}

.gameover-text {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: 0.24em;
  color: rgba(255, 80, 96, 0.92);
  text-transform: uppercase;
}

.victory-text {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: 0.24em;
  color: rgba(255, 227, 115, 0.92);
  text-transform: uppercase;
}

.overlay-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.overlay-label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.overlay-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.95);
}

.sidebar-action {
  width: 100%;
}

.end-turn-button {
  background: linear-gradient(135deg, #f24a6d, #ff758c);
  color: #ffffff;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(242, 74, 109, 0.35);
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.end-turn-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(242, 74, 109, 0.45);
}

.end-turn-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.zone-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.75);
  font-size: 16px;
  letter-spacing: 0.04em;
  text-align: center;
}

.zone-message--error {
  color: #ff9a9a;
}

.battle-footer {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: rgba(12, 12, 20, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.04em;
  font-size: 14px;
  box-sizing: border-box;
}

.footer-message {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
