<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import HpGauge from '@/components/HpGauge.vue'
import BattleEnemyArea from '@/components/battle/BattleEnemyArea.vue'
import BattleHandArea from '@/components/battle/BattleHandArea.vue'
import {
  ViewManager,
  type AnimationCommand,
  type AnimationScript,
  type ViewManagerEvent,
} from '@/view/ViewManager'
import type { CardOperation } from '@/domain/entities/operations'
import type { TargetEnemyAvailabilityEntry } from '@/domain/entities/operations'
import { OperationLog } from '@/domain/battle/OperationLog'
import { Battle } from '@/domain/battle/Battle'
import {
  createDefaultSnailBattle,
  createTestCaseBattle,
  createTestCaseBattle2,
  createStage2Battle,
  createStage3Battle,
  createStage4Battle,
} from '@/domain/battle/battlePresets'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { CardRepository } from '@/domain/repository/CardRepository'
import { ProtagonistPlayer } from '@/domain/entities/players'
import {
  SnailTeam,
  IronBloomTeam,
  HummingbirdScorpionTeam,
  OrcHeroEliteTeam,
} from '@/domain/entities/enemyTeams'
import type { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import type { StageEventPayload, StageEventMetadata } from '@/types/animation'
import DamageEffects from '@/components/DamageEffects.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import { usePlayerStore } from '@/stores/playerStore'
import { DEFAULT_PLAYER_RELICS, type Relic } from '@/domain/entities/relics'
import { useAudioCue } from '@/composables/useAudioCue'

declare global {
  interface Window {
    __MASO_ANIMATION_DEBUG__?: boolean
  }
}

type BattlePresetKey =
  | 'default'
  | 'stage1'
  | 'testcase1'
  | 'testcase2'
  | 'stage2'
  | 'stage3'
  | 'stage4'

type BattleViewProps = { viewManager?: ViewManager; preset?: BattlePresetKey; teamId?: string }

const ERROR_OVERLAY_DURATION_MS = 2000

const props = defineProps<BattleViewProps>()
const playerStore = usePlayerStore()
playerStore.ensureInitialized()

const battleFactory = resolveBattleFactory(props, playerStore)
const viewManager = props.viewManager ?? createDefaultViewManager(battleFactory)

const managerState = viewManager.state
const errorMessage = ref<string | null>(null)
const currentAnimationId = ref<string | null>(null)
let errorOverlayTimer: number | null = null

const subscriptions: Array<() => void> = []

interface EnemySelectionRequest {
  resolve: (enemyId: number) => void
  reject: (error: Error) => void
}

const layoutRef = ref<HTMLDivElement | null>(null)
const {
  state: descriptionOverlay,
  hide: hideDescriptionOverlay,
  show: showDescriptionOverlay,
} = useDescriptionOverlay()

const snapshot = computed(() => managerState.snapshot)
const isInitializing = computed(() => managerState.playback.status === 'initializing')
const playbackSpeed = computed(() => managerState.playback.speed)
const isInputLocked = computed(() => managerState.input.locked)
const pendingInputCount = computed(() => managerState.input.queued.length)
const isPlayerTurn = computed(() => snapshot.value?.turn.activeSide === 'player')
const enemySelectionRequest = ref<EnemySelectionRequest | null>(null)
const isSelectingEnemy = computed(() => enemySelectionRequest.value !== null)
const hoveredEnemyId = ref<number | null>(null)
const handAreaRef = ref<InstanceType<typeof BattleHandArea> | null>(null)
const latestStageEvent = ref<StageEventPayload | null>(null)
const playerDamageEffectsRef = ref<InstanceType<typeof DamageEffects> | null>(null)
const playerDamageOutcomes = ref<DamageOutcome[]>([])
const manaPulseKey = ref(0)
const enemySelectionHints = ref<TargetEnemyAvailabilityEntry[]>([])
const viewResetToken = ref(0)
const playerRelics = DEFAULT_PLAYER_RELICS
const { play: playAudioCueInternal } = useAudioCue()
const animationDebugLoggingEnabled =
  (typeof window !== 'undefined' && Boolean(window.__MASO_ANIMATION_DEBUG__)) ||
  import.meta.env.VITE_DEBUG_ANIMATION_LOG === 'true'

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

function clearErrorOverlayTimer(): void {
  if (!errorOverlayTimer) {
    return
  }
  window.clearTimeout(errorOverlayTimer)
  errorOverlayTimer = null
}

// 致命的でないエラーは UI を塞がずに短時間だけ通知したいので、オーバーレイ表示に統一する。
function showTransientError(message: string): void {
  errorMessage.value = message
  clearErrorOverlayTimer()
  errorOverlayTimer = window.setTimeout(() => {
    errorMessage.value = null
    errorOverlayTimer = null
  }, ERROR_OVERLAY_DURATION_MS)
}

function resetErrorMessage(): void {
  clearErrorOverlayTimer()
  errorMessage.value = null
}

function handleManagerEvent(event: ViewManagerEvent) {
  switch (event.type) {
    case 'error':
      showTransientError(event.error.message)
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
      const message = error instanceof Error ? error.message : String(error)
      showTransientError(message)
    })
})

onUnmounted(() => {
  subscriptions.forEach((dispose) => dispose())
  if (relicFooterTimer) {
    window.clearTimeout(relicFooterTimer)
    relicFooterTimer = null
  }
  clearErrorOverlayTimer()
})

const portraitSrc = '/assets/characters/sister.png'
const defaultFooterMessage = '対象にカーソルを合わせて操作を確認'
const footerMessage = ref(defaultFooterMessage)
let relicFooterTimer: number | null = null

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
const playerMana = computed(() => ({
  current: snapshot.value?.player.currentMana ?? 0,
  max: snapshot.value?.player.maxMana ?? 0,
}))
const playerHpGauge = computed(() => ({
  current: snapshot.value?.player.currentHp ?? 0,
  max: snapshot.value?.player.maxHp ?? 0,
}))

watch(
  () => latestStageEvent.value,
  async (event) => {
    if (!event) {
      return
    }
    const metadata = event.metadata
    if (metadata?.stage === 'player-damage') {
      playerDamageOutcomes.value = (metadata.damageOutcomes ?? []).map((outcome) => ({ ...outcome }))
      await nextTick()
      playerDamageEffectsRef.value?.play()
    } else if (metadata?.stage === 'mana') {
      manaPulseKey.value += 1
    } else if (metadata?.stage === 'audio') {
      handleAudioStage(metadata)
    }
  },
)
// TODO: ドメイン層へ移し、ビュー側に条件判定を残さない
const battleStatus = computed(() => snapshot.value?.status ?? 'in-progress')
const isGameOver = computed(() => battleStatus.value === 'gameover')
const isVictory = computed(() => battleStatus.value === 'victory')
const canRetry = computed(() => {
  void managerState.snapshot
  return viewManager.canRetry()
})
const canUndo = computed(() => {
  void managerState.actionLogLength
  return viewManager.hasUndoableAction()
})

function requestEnemyTarget(): Promise<number> {
  if (enemySelectionRequest.value) {
    return Promise.reject(new Error('敵選択が既に進行中です'))
  }

  hoveredEnemyId.value = null

  return new Promise((resolve, reject) => {
    enemySelectionRequest.value = {
      resolve: (enemyId: number) => {
        enemySelectionRequest.value = null
        resolve(enemyId)
      },
      reject: (error: Error) => {
        enemySelectionRequest.value = null
        reject(error)
      },
    }
  })
}

function handleAudioStage(metadata: Extract<StageEventMetadata, { stage: 'audio' }> | undefined): void {
  const soundId = metadata?.soundId
  if (!soundId) {
    return
  }
  playAudioCue(soundId)
}
async function handleCutInStage(metadata: Extract<StageEventMetadata, { stage: 'cutin' }> | undefined) {

function playAudioCue(soundId: string): void {
  if (!soundId) {
    return
  }
  // 実際に効果音を再生する。useAudioCue 側で window 非存在時は何もしないためここではガード不要。
  playAudioCueInternal(soundId)
}

function resolveEnemySelection(enemyId: number): void {
  const pending = enemySelectionRequest.value
  if (!pending) {
    return
  }
  pending.resolve(enemyId)
  enemySelectionRequest.value = null
  enemySelectionHints.value = []
}

function cancelEnemySelection(reason?: string): void {
  const pending = enemySelectionRequest.value
  if (!pending) {
    return
  }
  pending.reject(new Error(reason ?? '敵選択がキャンセルされました'))
  enemySelectionRequest.value = null
  enemySelectionHints.value = []
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

function handleEnemySelected(enemyId: number): void {
  resolveEnemySelection(enemyId)
  hoveredEnemyId.value = null
}

function cancelEnemySelectionInternal(reason?: string): void {
  cancelEnemySelection(reason)
  hoveredEnemyId.value = null
}

function handleEnemySelectionCanceled(): void {
  cancelEnemySelectionInternal('敵選択がキャンセルされました')
  handAreaRef.value?.cancelSelection()
}

function handleHandPlayCard(payload: { cardId: number; operations: CardOperation[] }): void {
  viewManager.queuePlayerAction({ type: 'play-card', cardId: payload.cardId, operations: payload.operations })
  resetErrorMessage()
}

function handleHandFooterUpdate(message: string): void {
  footerMessage.value = message
}

function handleHandFooterReset(): void {
  footerMessage.value = defaultFooterMessage
}

function handleHandError(message: string): void {
  if (message === '敵選択がキャンセルされました') {
    footerMessage.value = defaultFooterMessage
    return
  }
  showTransientError(message)
}

function handleHandHideOverlay(): void {
  hideDescriptionOverlay()
}

function setTemporaryFooterMessage(message: string, duration = 1600): void {
  footerMessage.value = message
  if (relicFooterTimer) {
    window.clearTimeout(relicFooterTimer)
  }
  relicFooterTimer = window.setTimeout(() => {
    footerMessage.value = defaultFooterMessage
    relicFooterTimer = null
  }, duration)
}

function handleRelicHover(event: MouseEvent | FocusEvent, relic: Relic): void {
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
  showDescriptionOverlay(`${relic.name}\n${relic.description()}`, { x, y })
}

function handleRelicLeave(): void {
  hideDescriptionOverlay()
}

function handleRelicClick(relic: Relic): void {
  if (relic.usageType !== 'active') {
    setTemporaryFooterMessage(`${relic.name}：永続効果のレリックです`, 1400)
    return
  }
  setTemporaryFooterMessage(`${relic.name} の起動効果は今後実装されます`, 1800)
}

function handleEnemySelectionHints(hints: TargetEnemyAvailabilityEntry[]): void {
  enemySelectionHints.value = hints
}

function handleClearEnemySelectionHints(): void {
  enemySelectionHints.value = []
}

async function runAnimation(script: AnimationScript): Promise<void> {
  const startedAt = performance.now()
  try {
    for (const command of script.commands) {
      await executeCommand(command)
    }
    await ensureEntryDuration(script, startedAt)
  } catch (unknownError) {
    const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError))
    showTransientError(error.message)
  } finally {
    try {
      viewManager.completeCurrentAnimation(script.id)
    } catch (unknownError) {
      const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError))
      showTransientError(error.message)
    }
  }
}

async function ensureEntryDuration(script: AnimationScript, startedAt: number): Promise<void> {
  const estimated = script.metadata?.estimatedDuration ?? 0
  if (estimated <= 0) {
    return
  }
  const speed = Math.max(0.001, playbackSpeed.value)
  const elapsed = performance.now() - startedAt
  const expected = estimated / speed
  if (expected > elapsed) {
    await waitFor(expected - elapsed)
  }
}

async function executeCommand(command: AnimationCommand): Promise<void> {
  // アニメーションデバッグ時のみ詳細ログを出す。通常プレイではコンソールを汚さない。
  if (animationDebugLoggingEnabled && typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[AnimationDebug] executeCommand', command)
  }
  switch (command.type) {
    case 'stage-event':
      latestStageEvent.value = {
        entryType: command.entryType,
        batchId: command.batchId,
        metadata: command.metadata,
        issuedAt: performance.now(),
        resolvedEntry: command.resolvedEntry,
      }
      logAnimationStageEvent(command)
      break
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
    case 'apply-patch':
      // apply-patch は snapshot の一部のみを差し替えるので、欠けているプロパティは ViewManager 側で既存値を保持する。
      // 描画系のwatcherを確実に発火させるため update-snapshot と同様に nextTick を待つ。
      viewManager.applyAnimationCommand(command)
      await nextTick()
      break
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

function logAnimationStageEvent(command: Extract<AnimationCommand, { type: 'stage-event' }>): void {
  if (!animationDebugLoggingEnabled || typeof console === 'undefined') {
    return
  }
  const stage = (command.metadata as { stage?: unknown } | undefined)?.stage
  // eslint-disable-next-line no-console
  console.info('[AnimationDebug] アニメーション指示開始', {
    entryType: command.entryType,
    stage,
    batchId: command.batchId,
  })
}

function resetUiStateAfterTimelineChange(): void {
  cancelEnemySelectionInternal('敵選択がキャンセルされました')
  handAreaRef.value?.resetSelection()
  hideDescriptionOverlay()
  hoveredEnemyId.value = null
  enemySelectionHints.value = []
  latestStageEvent.value = null
  playerDamageOutcomes.value = []
  currentAnimationId.value = null
  resetErrorMessage()
  footerMessage.value = defaultFooterMessage
  viewResetToken.value += 1
}

function handleEndTurnClick(): void {
  viewManager.queuePlayerAction({ type: 'end-player-turn' })
}

function handleRetryClick(): void {
  viewManager.resetToInitialState()
  resetUiStateAfterTimelineChange()
}

function handleUndoClick(): void {
  const undone = viewManager.undoLastPlayerAction()
  if (!undone) {
    return
  }
  resetUiStateAfterTimelineChange()
}

function handleContextMenu(): void {
  if (isSelectingEnemy.value) {
    handleEnemySelectionCanceled()
  }
  hideDescriptionOverlay()
}

function createDefaultViewManager(createBattle: () => Battle): ViewManager {
  return new ViewManager({
    createBattle,
    operationLog: new OperationLog(),
    playbackOptions: { defaultSpeed: 1, autoPlay: false },
    initialOperationIndex: -1,
  })
}

function resolveBattleFactory(
  props: BattleViewProps,
  playerStore: ReturnType<typeof usePlayerStore>,
): () => Battle {
  switch (props.preset) {
    case 'testcase1':
      return createTestCaseBattle
    case 'testcase2':
      return createTestCaseBattle2
    case 'stage2':
      return createStage2Battle
    case 'stage3':
      return createStage3Battle
    case 'stage4':
      return createStage4Battle
    case 'stage1':
    case 'default':
    default:
      return () => createBattleFromPlayerStore(props.teamId ?? 'snail', playerStore)
  }
}

function createBattleFromPlayerStore(
  teamId: string,
  playerStore: ReturnType<typeof usePlayerStore>,
): Battle {
  const enemyTeam = resolveEnemyTeam(teamId)
  playerStore.ensureInitialized()
  const cardRepository = new CardRepository()
  const deckCards = playerStore.buildDeck(cardRepository)
  const player = new ProtagonistPlayer({
    maxHp: playerStore.maxHp,
    currentHp: Math.min(playerStore.hp, playerStore.maxHp),
  })

  return new Battle({
    id: `battle-${teamId}`,
    cardRepository,
    player,
    enemyTeam,
    deck: new Deck(deckCards),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

const DEFAULT_ENEMY_TEAM_FACTORY = () => new SnailTeam()

const ENEMY_TEAM_FACTORIES: Record<string, () => EnemyTeam> = {
  snail: DEFAULT_ENEMY_TEAM_FACTORY,
  'iron-bloom': () => new IronBloomTeam({ mode: 'random' }),
  'iron-bloom-scripted': () => new IronBloomTeam({ mode: 'scripted' }),
  'hummingbird-scorpion': () => new HummingbirdScorpionTeam(),
  'orc-hero-elite': () => new OrcHeroEliteTeam(),
}

/**
 * teamId で該当する factory が取れない場合には snail チームを使って
 * 予期せぬ undefined を防ぎつつ type-safe な EnemyTeam を返す。
 */
function resolveEnemyTeam(teamId: string): EnemyTeam {
  const factory = ENEMY_TEAM_FACTORIES[teamId]
  if (factory) {
    return factory()
  }
  return DEFAULT_ENEMY_TEAM_FACTORY()
}
</script>

<template>
  <GameLayout>
    <template #window>
      <div ref="layoutRef" class="battle-layout" @contextmenu.prevent="handleContextMenu">
        <transition name="battle-error">
          <div v-if="errorMessage" class="battle-error-overlay" role="alert">
            {{ errorMessage }}
          </div>
        </transition>
        <header class="battle-header">
          <div class="header-relics">
            <span class="relic-label">レリック</span>
            <div class="relic-icon-list">
              <button
                v-for="relic in playerRelics"
                :key="relic.id"
                type="button"
                class="relic-icon"
                :class="{
                  'relic-icon--active': relic.usageType === 'active',
                  'relic-icon--passive': relic.usageType !== 'active',
                }"
                :aria-label="relic.name"
                :aria-disabled="relic.usageType !== 'active' ? 'true' : undefined"
                @mouseenter="(event) => handleRelicHover(event, relic)"
                @focusin="(event) => handleRelicHover(event, relic)"
                @mouseleave="handleRelicLeave"
                @focusout="handleRelicLeave"
                @click="handleRelicClick(relic)"
              >
                {{ relic.icon }}
              </button>
            </div>
          </div>
          <div class="header-status">
            <span class="phase-label">{{ phaseLabel }}</span>
            <span class="turn-label">{{ turnLabel }}</span>
          </div>
          <div class="header-actions">
            <button
              type="button"
              class="header-button"
              :disabled="!canRetry"
              @click="handleRetryClick"
            >
              戦闘開始からやり直す
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
        </header>

        <div class="battle-body">
          <main class="battle-main">
            <BattleEnemyArea
              :key="`enemy-area-${viewResetToken}`"
              :snapshot="snapshot"
              :is-initializing="isInitializing"
              :stage-event="latestStageEvent"
              :is-selecting-enemy="isSelectingEnemy"
              :hovered-enemy-id="hoveredEnemyId"
              :selection-hints="enemySelectionHints"
              @hover-start="handleEnemyHoverStart"
              @hover-end="handleEnemyHoverEnd"
              @enemy-click="(enemy) => handleEnemySelected(enemy.id)"
              @cancel-selection="handleEnemySelectionCanceled"
            />

            <BattleHandArea
              :key="`hand-area-${viewResetToken}`"
              ref="handAreaRef"
              :snapshot="snapshot"
              :hovered-enemy-id="hoveredEnemyId"
              :is-initializing="isInitializing"
              :stage-event="latestStageEvent"
              :is-player-turn="isPlayerTurn"
              :is-input-locked="isInputLocked"
              :view-manager="viewManager"
              :request-enemy-target="requestEnemyTarget"
              :cancel-enemy-selection="cancelEnemySelectionInternal"
              @play-card="handleHandPlayCard"
              @update-footer="handleHandFooterUpdate"
              @reset-footer="handleHandFooterReset"
              @error="handleHandError"
              @hide-overlay="handleHandHideOverlay"
              @show-enemy-selection-hints="handleEnemySelectionHints"
              @clear-enemy-selection-hints="handleClearEnemySelectionHints"
            />
          </main>

          <aside class="battle-sidebar">
            <div class="portrait">
              <img
                :src="portraitSrc"
                alt="聖女の立ち絵"
                class="portrait-image"
                decoding="async"
              />
              <DamageEffects
                :key="`player-damage-${viewResetToken}`"
                ref="playerDamageEffectsRef"
                class="damage-overlay damage-overlay--player"
                :outcomes="playerDamageOutcomes"
              />
              <div class="sidebar-overlay-container">
                <div class="sidebar-overlay">
                  <HpGauge :current="playerHpGauge.current" :max="playerHpGauge.max" />
                  <div class="mana-pop" :key="manaPulseKey" aria-label="現在のマナ">
                    <span class="mana-pop__current">{{ playerMana.current }}</span>
                    <span class="mana-pop__slash" aria-hidden="true"></span>
                    <span class="mana-pop__max">{{ playerMana.max }}</span>
                  </div>
                  <div class="overlay-row" style="display: none;">
                    <span class="overlay-label">プレイヤー</span>
                    <span class="overlay-value">{{ playerName }}</span>
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
          <transition name="result-overlay">
            <div v-if="isGameOver" class="battle-gameover-overlay">
              <div class="gameover-text">GAME OVER</div>
            </div>
          </transition>
          <transition name="result-overlay">
            <div v-if="!isGameOver && isVictory" class="battle-victory-overlay">
              <div class="victory-text">VICTORY!</div>
            </div>
          </transition>
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

.battle-error-overlay {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 18px;
  border-radius: 14px;
  background: rgba(210, 48, 87, 0.92);
  color: #fff7fb;
  box-shadow: 0 12px 28px rgba(210, 48, 87, 0.35);
  letter-spacing: 0.04em;
  font-size: 14px;
  pointer-events: none;
  z-index: 24;
}

.battle-error-enter-active,
.battle-error-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.battle-error-enter-from,
.battle-error-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
  height: 56px;
  background: linear-gradient(90deg, rgba(120, 97, 190, 0.22), rgba(70, 69, 122, 0.35));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}

.header-relics {
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.relic-icon-list {
  display: flex;
  gap: 4px;
}

.relic-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(15, 18, 34, 0.6);
  color: #ffe9b5;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
  padding: 4px;
}

.relic-icon--active {
  cursor: pointer;
  border-color: rgba(255, 214, 140, 0.7);
  background: rgba(255, 214, 140, 0.18);
}

.relic-icon--active:hover,
.relic-icon--active:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
}

.relic-icon--passive {
  opacity: 0.85;
}

.relic-label {
  opacity: 0.65;
}

.header-status {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
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

.turn-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
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
  white-space: pre-line;
}

.battle-main {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(28, 28, 48, 0.75), rgba(18, 18, 24, 0.85));
  gap: 0;
  flex: 1;
  min-height: 0;
}

.enemy-area-wrapper {
  position: relative;
}

:deep(.enemy-zone),
:deep(.hand-zone) {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
  min-height: 0;
}

:deep(.enemy-zone) {
  flex: 0 0 320px;
  max-height: 320px;
  padding: 0 16px;
}

:deep(.hand-zone) {
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
  object-position: left;
}

.damage-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}

.damage-overlay--player {
  width: 140px;
  height: 120px;
  inset: 12px 12px auto auto;
}

.sidebar-overlay-container {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  /* background: linear-gradient(180deg, rgba(12, 12, 22, 0.6), rgba(1, 1, 2, 0.85)); */
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
  position: relative;
  width: 120px;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffeeb1, #ffd44a 70%);
  color: #2a1803;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.4), inset 0 -6px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  animation: mana-pop-bounce 0.4s ease;
}

.mana-pop__current {
  font-size: 48px;
  position: absolute;
  left: 30px;
  top: 10px;
}

.mana-pop__max {
  position: absolute;
  right: 28px;
  bottom: 22px;
  font-size: 18px;
  font-weight: 600;
}

.mana-pop__slash {
  position: absolute;
  width: 68px;
  height: 2px;
  background: currentColor;
  transform: rotate(-52deg);
  opacity: 0.9;
  right: 20px;
  bottom: 50px;
}

@keyframes mana-pop-bounce {
  0% {
    transform: scale(0.85);
  }
  55% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
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

.result-overlay-enter-active,
.result-overlay-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.result-overlay-enter-from,
.result-overlay-leave-to {
  opacity: 0;
  transform: scale(0.95);
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
