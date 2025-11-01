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
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import type { Enemy } from '@/domain/entities/Enemy'
import type { EnemyInfo, EnemyTrait, CardInfo, EnemyActionHint } from '@/types/battle'
import type { Card } from '@/domain/entities/Card'
import type { State } from '@/domain/entities/State'
import { TargetEnemyOperation, type CardOperation } from '@/domain/entities/operations'

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

const snapshot = computed(() => managerState.snapshot)
const isInitializing = computed(() => managerState.playback.status === 'initializing')
const hasSnapshot = computed(() => !!snapshot.value)
const playbackSpeed = computed(() => managerState.playback.speed)
const isInputLocked = computed(() => managerState.input.locked)
const pendingInputCount = computed(() => managerState.input.queued.length)
const isPlayerTurn = computed(() => snapshot.value?.turn.activeSide === 'player')
const isSelectingEnemy = computed(() => interactionState.mode === 'selecting-target-enemy')
const hoveredEnemyId = ref<number | null>(null)

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
  return player ? `マナ ${player.currentMana} / ${player.maxMana}` : 'マナ -'
})
const playerHpGauge = computed(() => ({
  current: snapshot.value?.player.currentHp ?? 0,
  max: snapshot.value?.player.maxHp ?? 0,
}))
const deckCount = computed(() => snapshot.value?.deck.length ?? 0)
const discardCount = computed(() => snapshot.value?.discardPile.length ?? 0)

const enemies = computed<EnemyInfo[]>(() => {
  const current = snapshot.value
  if (!current) {
    return []
  }

  return current.enemies.map((enemy) => {
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

  return current.hand.map((card, index) => {
    const info = convertCardToCardInfo(card, index)
    const operations = card.definition.operations ?? []
    return {
      key: info.id,
      info,
      card,
      numericId: card.numericId,
      operations,
    }
  })
})

const handCardCount = computed(() => handCards.value.length)

function convertCardToCardInfo(card: Card, index: number): CardInfo {
  const definition = card.definition
  const identifier = card.numericId !== undefined ? `card-${card.numericId}` : `card-${index}`

  return {
    id: identifier,
    title: card.title,
    type: card.type,
    cost: card.cost,
    illustration: definition.image ?? '🂠',
    description: card.description,
    notes: definition.notes,
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

  const queued = enemy.queuedActions
  if (!queued || queued.length === 0) {
    return []
  }

  const [nextAction] = queued
  return nextAction ? [summarizeEnemyAction(nextAction)] : []
}

function summarizeEnemyAction(action: BattleAction): EnemyActionHint {
  if (action instanceof SkipTurnAction) {
    return {
      title: action.name,
      type: 'skip',
      icon: SkipTurnAction.ICON,
    }
  }

  if (action instanceof Attack) {
    const damages = action.baseDamages
    const states = action.inflictStatePreviews
    const primaryState = states[0]

    return {
      title: action.name,
      type: 'attack',
      icon: damages.baseCount > 1 || damages.type === 'multi' ? '⚔️' : '💥',
      pattern: {
        amount: damages.baseAmount,
        count: damages.baseCount,
        type: damages.type,
      },
      status: primaryState
        ? {
            name: primaryState.name,
            magnitude: primaryState.magnitude ?? 1,
          }
        : undefined,
    }
  }

  return {
    title: action.name,
    type: action.type === 'skill' ? 'skill' : 'attack',
    icon: action.type === 'skill' ? '✨' : '💥',
  }
}

const supportedOperations = new Set<string>([TargetEnemyOperation.TYPE])

const handleCardHoverStart = () => {
  if (interactionState.mode !== 'idle') {
    return
  }
  footerMessage.value = '左クリック：使用　右クリック：詳細'
}

const handleCardHoverEnd = () => {
  if (interactionState.mode !== 'idle') {
    return
  }
  footerMessage.value = defaultFooterMessage
}

function isCardDisabled(entry: HandCardViewModel): boolean {
  if (isInputLocked.value) {
    return true
  }
  if (!isPlayerTurn.value) {
    return true
  }
  if (isSelectingEnemy.value) {
    return interactionState.selectedCardId !== entry.key
  }
  return false
}

function handleCardClick(entry: HandCardViewModel): void {
  if (isInputLocked.value || isSelectingEnemy.value || !isPlayerTurn.value) {
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

function handleContextMenu(): void {
  if (isSelectingEnemy.value) {
    resetInteractionState()
  }
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
      <div class="battle-layout" @contextmenu.prevent="handleContextMenu">
        <header class="battle-header">
          <div class="header-left">
            <span class="phase-label">{{ phaseLabel }}</span>
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
              <div v-else class="enemy-grid">
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
              </div>
            </section>

            <section class="hand-zone">
              <div v-if="errorMessage" class="zone-message zone-message--error">{{ errorMessage }}</div>
              <div v-else-if="isInitializing" class="zone-message">カード情報を読み込み中...</div>
              <div v-else-if="handCards.length === 0" class="zone-message">手札は空です</div>
              <div v-else class="hand-grid">
                <ActionCard
                  v-for="entry in handCards"
                  :key="entry.key"
                  v-bind="entry.info"
                  :selected="interactionState.selectedCardId === entry.key"
                  :disabled="isCardDisabled(entry)"
                  @click="handleCardClick(entry)"
                  @hover-start="handleCardHoverStart"
                  @hover-end="handleCardHoverEnd"
                />
              </div>
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
                    <span class="overlay-value">{{ manaLabel }}</span>
                  </div>
                  <HpGauge :current="playerHpGauge.current" :max="playerHpGauge.max" />
                  <div class="overlay-row">
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
  padding: 8px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(114, 173, 255, 0.28), rgba(66, 103, 229, 0.35));
  color: rgba(245, 250, 255, 0.95);
  font-size: 14px;
  letter-spacing: 0.08em;
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
