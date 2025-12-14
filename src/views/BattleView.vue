<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
  createTutorialBattle,
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
  buildEnemyTeamFactoryMap,
  SnailTeam,
} from '@/domain/entities/enemyTeams'
import { buildEnemyActionHints } from '@/domain/battle/enemyActionHintBuilder'
import type { EnemyTeam } from '@/domain/entities/EnemyTeam'
import type { StageEventPayload, StageEventMetadata } from '@/types/animation'
import DamageEffects from '@/components/DamageEffects.vue'
import CutInOverlay from '@/components/CutInOverlay.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import { usePlayerStore } from '@/stores/playerStore'
import { useRewardStore } from '@/stores/rewardStore'
import { SOUND_ASSETS, IMAGE_ASSETS, BATTLE_CUTIN_ASSETS } from '@/assets/preloadManifest'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import type { RelicDisplayEntry } from '@/view/relicDisplayMapper'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { BattleReward } from '@/domain/battle/BattleReward'
import { useAudioStore } from '@/stores/audioStore'
import { createImageHub, provideImageHub } from '@/composables/imageHub'
import PileOverlay from '@/components/battle/PileOverlay.vue'
import PileChoiceOverlay from '@/components/battle/PileChoiceOverlay.vue'
import type { CardInfo } from '@/types/battle'
import type { EnemyActionHint } from '@/types/battle'
import type { Card } from '@/domain/entities/Card'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import { usePileOverlayStore } from '@/stores/pileOverlayStore'
import { createCardFromBlueprint, type CardBlueprint } from '@/domain/library/Library'

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
  | 'tutorial'

type BattleViewProps = { viewManager?: ViewManager; preset?: BattlePresetKey; teamId?: string }

const ERROR_OVERLAY_DURATION_MS = 2000

const props = defineProps<BattleViewProps>()
const router = useRouter()
const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const rewardStore = useRewardStore()
const pileOverlayStore = usePileOverlayStore()

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
const mainLayoutRef = ref<InstanceType<typeof MainGameLayout> | null>(null)
const { hide: hideDescriptionOverlay, show: showDescriptionOverlay } = useDescriptionOverlay()

const snapshot = computed(() => managerState.snapshot)
const isInitializing = computed(() => managerState.playback.status === 'initializing')
const playbackSpeed = computed(() => managerState.playback.speed)
const isInputLocked = computed(() => managerState.input.locked)
const pendingInputCount = computed(() => managerState.input.queued.length)
const isPlayerTurn = computed(() => snapshot.value?.turn.activeSide === 'player')
const canPlayerAct = computed(() => isPlayerTurn.value && !isInputLocked.value)
const enemySelectionRequest = ref<EnemySelectionRequest | null>(null)
const isSelectingEnemy = computed(() => enemySelectionRequest.value !== null)
const hoveredEnemyId = ref<number | null>(null)
// 敵行動ヒントの計算済み結果を保持し、敵ターン中に行動済みの敵は再計算しない
const lastEnemyActionHints = ref<Map<number, EnemyActionHint[]>>(new Map())
const enemyActionHintsById = computed<Map<number, EnemyActionHint[]>>(() => {
  const battle = viewManager.battle
  const snap = snapshot.value
  if (!battle || !snap) {
    return new Map<number, EnemyActionHint[]>()
  }
  const turnPosition = snap.turnPosition ?? battle.turnPosition
  const map = new Map<number, EnemyActionHint[]>()
  snap.enemies.forEach((enemySnapshot) => {
    const enemy = battle.enemyTeam.findEnemy(enemySnapshot.id)
    if (!enemy) {
      return
    }
    const actedThisTurn = snap.turnPosition?.side === 'enemy' && enemySnapshot.hasActedThisTurn
    if (actedThisTurn) {
      const cached = lastEnemyActionHints.value.get(enemySnapshot.id)
      if (cached) {
        map.set(enemySnapshot.id, cached)
        return
      }
    }
    const hints = buildEnemyActionHints({
      battle,
      enemy,
      turnPosition,
      enemyStateSnapshots: enemySnapshot.states,
      playerStateSnapshots: snap.player?.states,
    })
    map.set(enemySnapshot.id, hints)
  })
  lastEnemyActionHints.value = map
  return map
})
const handAreaRef = ref<InstanceType<typeof BattleHandArea> | null>(null)
const latestStageEvent = ref<StageEventPayload | null>(null)
const pileChoiceState = reactive<{
  visible: boolean
  title?: string
  message?: string
  candidates: CardInfo[]
  onSelect?: (cardId: number) => void
  onCancel?: () => void
}>({
  visible: false,
  title: undefined,
  message: undefined,
  candidates: [],
  onSelect: undefined,
  onCancel: undefined,
})
const playerDamageEffectsRef = ref<InstanceType<typeof DamageEffects> | null>(null)
const cutInRef = ref<InstanceType<typeof CutInOverlay> | null>(null)
const playerDamageOutcomes = ref<DamageOutcome[]>([])
const currentCutInSrc = ref<string>(BATTLE_CUTIN_ASSETS[0] ?? '/assets/cut_ins/MasochisticAuraAction.png')
const manaPulseKey = ref(0)
const enemySelectionHints = ref<TargetEnemyAvailabilityEntry[]>([])
const enemySelectionTheme = ref<EnemySelectionTheme>('default')
const viewResetToken = ref(0)
const deckCardInfos = computed<CardInfo[]>(() =>
  buildCardInfosFromPlayerStoreDeck(playerStore.deck, 'player-deck'),
)
const battleDeckCardInfos = computed<CardInfo[]>(() => buildCardInfos(snapshot.value?.deck ?? [], 'deck'))
const randomizedDeckCardInfos = ref<CardInfo[]>([])
const discardCardInfos = computed<CardInfo[]>(() =>
  buildCardInfos(snapshot.value?.discardPile ?? [], 'discard'),
)
const deckOverlaySource = ref<'player' | 'battle'>('player')
const audioStore = useAudioStore()
const imageHub = createImageHub()
provideImageHub(imageHub)
const animationDebugLoggingEnabled =
  (typeof window !== 'undefined' && Boolean(window.__MASO_ANIMATION_DEBUG__)) ||
  import.meta.env.VITE_DEBUG_ANIMATION_LOG === 'true'
// HP周りの調査ログは騒がしいため、環境変数で明示的に有効化した場合のみ出力する
const playerHpDebugLoggingEnabled = import.meta.env.VITE_DEBUG_PLAYER_HP_LOG === 'true'


let battleAssetPreloadPromise: Promise<void> | null = null
const rewardPrepared = ref(false)

function preloadBattleAssets(): Promise<void> {
  if (battleAssetPreloadPromise) {
    return battleAssetPreloadPromise
  }
  battleAssetPreloadPromise = Promise.allSettled([
    audioStore.hub?.preloadAll() ?? Promise.resolve(),
    imageHub.preloadAll(IMAGE_ASSETS),
  ]).then(() => undefined)
  return battleAssetPreloadPromise
}

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

function getPlayerOriginRect(): DOMRect | null {
  return mainLayoutRef.value?.getPlayerCardRect() ?? null
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
  preloadBattleAssets().catch((error) => {
    if (import.meta.env.DEV) {
      console.warn('[BattleView] preloadBattleAssets failed', error)
    }
  })
  audioStore.playBgm('/sounds/bgm/battle.mp3')
  viewManager
    .initialize()
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      showTransientError(message)
    })
})

onUnmounted(() => {
  subscriptions.forEach((dispose) => dispose())
  clearErrorOverlayTimer()
  audioStore.stopBgm()
})

const playerMana = computed(() => ({
  current: snapshot.value?.player.currentMana ?? 0,
  max: snapshot.value?.player.maxMana ?? 0,
}))
const playerHpGauge = computed(() => ({
  current: snapshot.value?.player.currentHp ?? 0,
  max: snapshot.value?.player.maxHp ?? 0,
}))

const playerPreHpForCard = computed(() => {
  const pre = previousSnapshot.value?.player
    ? { current: previousSnapshot.value.player.currentHp, max: previousSnapshot.value.player.maxHp }
    : { current: playerHpGauge.value.current, max: playerHpGauge.value.max }
  // 調査用ログ: PlayerCard に渡す preHp
  if (playerHpDebugLoggingEnabled) {
    // eslint-disable-next-line no-console
    console.debug('[BattleView] playerPreHpForCard', pre, {
      prevTurn: previousSnapshot.value?.turnPosition?.turn,
      prevSide: previousSnapshot.value?.turnPosition?.side,
      curTurn: snapshot.value?.turnPosition?.turn,
      curSide: snapshot.value?.turnPosition?.side,
    })
  }
  return pre
})
const playerPostHpForCard = computed(() => {
  const post = { current: playerHpGauge.value.current, max: playerHpGauge.value.max }
  if (playerHpDebugLoggingEnabled) {
    // eslint-disable-next-line no-console
    console.debug('[BattleView] playerPostHpForCard', post, {
      turn: snapshot.value?.turnPosition?.turn,
      side: snapshot.value?.turnPosition?.side,
    })
  }
  return post
})
watch(
  () => playerHpGauge.value,
  (next) => {
    // 調査用ログ: UI が参照する現在HP
    if (playerHpDebugLoggingEnabled) {
      // eslint-disable-next-line no-console
      console.debug('[BattleView] playerHpGauge', next, {
        turn: snapshot.value?.turnPosition?.turn,
        side: snapshot.value?.turnPosition?.side,
      })
    }
  },
  { deep: true },
)
const projectedPlayerHp = computed(() => {
  const predicted = snapshot.value?.player.predictedPlayerHpAfterEndTurn
  // 調査用ログ: スナップショットから取得できている予測値を確認
  if (playerHpDebugLoggingEnabled) {
    // eslint-disable-next-line no-console
    console.debug('predictedPlayerHpAfterEndTurn (snapshot)', {
      predicted,
      turn: snapshot.value?.turnPosition?.turn,
      side: snapshot.value?.turnPosition?.side,
    })
  }
  return typeof predicted === 'number' ? predicted : null
})
// 手札で State カードとして表示されるものと重複しないよう、表示用IDとチップ用スナップショットを分離する。
const playerStates = computed(() =>
  (snapshot.value?.player.states ?? []).map((state) => state.id),
)
const playerStateSnapshots = computed(() => {
  const handStateIds = new Set<string>()
  const hand = snapshot.value?.hand ?? []
  for (const card of hand) {
    const stateId = (card as { state?: { id?: string } } | undefined)?.state?.id
    if (stateId) {
      handStateIds.add(stateId)
    }
  }
  const states = snapshot.value?.player.states ?? []
  // 手札の StateAction が存在する場合はそちらで状態を示せているので、重複表示を避ける。
  return states.filter((state) => !handStateIds.has(state.id))
})
const previousSnapshot = ref<typeof snapshot.value | null>(null)
watch(
  () => snapshot.value,
  (next, prev) => {
    previousSnapshot.value = prev ?? null
  },
  { flush: 'sync' },
)

watch(
  () => canPlayerAct.value,
  (canAct, prev) => {
    if (canAct && !prev && !isSelectingEnemy.value) {
      resetEnemySelectionTheme()
    }
  },
)

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
    } else if (metadata?.stage === 'cutin') {
      await handleCutInStage(metadata)
    } else if (metadata?.stage === 'victory') {
      // 勝利時: 戦闘BGMを止め、勝利SEを再生する。
      audioStore.stopBgm()
      audioStore.playSe('/sounds/battle/victory.mp3')
    } else if (metadata?.stage === 'gameover') {
      // 敗北時: BGMを敗北曲に切り替える。
      audioStore.playBgm('/sounds/bgm/gameover.mp3')
    }
  },
)
watch(
  () => deckCardInfos.value,
  (cards) => {
    if (pileOverlayStore.activePile !== 'deck' || deckOverlaySource.value !== 'player') {
      return
    }
    // ヘッダー経由で開いている場合はplayerStoreのID順を維持して再描画する。
    randomizedDeckCardInfos.value = [...cards]
    pileOverlayStore.openDeck(randomizedDeckCardInfos.value, discardCardInfos.value)
  },
)

watch(
  () => battleDeckCardInfos.value,
  (cards) => {
    if (pileOverlayStore.activePile !== 'deck' || deckOverlaySource.value !== 'battle') {
      return
    }
    // 山札表示中にバトルの山札が変化した場合も秘匿のため毎回シャッフルする。
    randomizedDeckCardInfos.value = shuffleCardInfosForDisplay(cards)
    pileOverlayStore.openDeck(randomizedDeckCardInfos.value, discardCardInfos.value)
  },
)
// TODO: ドメイン層へ移し、ビュー側に条件判定を残さない
const battleStatus = computed(() => snapshot.value?.status ?? 'in-progress')
const isGameOver = computed(() => battleStatus.value === 'gameover')
// victory Overlay はステージイベントに合わせて表示する。スナップショットの勝利判定とは分離。
const hasVictoryStage = computed(() => latestStageEvent.value?.metadata?.stage === 'victory')
const isVictory = computed(() => battleStatus.value === 'victory' && hasVictoryStage.value)
const canRetry = computed(() => {
  void managerState.snapshot
  return viewManager.canRetry()
})
const canUndo = computed(() => {
  void managerState.actionLogLength
  return viewManager.hasUndoableAction()
})
// デバッグ用: 即勝利して報酬へ遷移する
async function handleForceVictory(): Promise<void> {
  if (!viewManager.battle) return
  const reward = new BattleReward(viewManager.battle).compute()
  rewardStore.setReward({
    battleId: viewManager.battle.id,
    hpHeal: reward.hpHeal,
    goldGain: reward.goldGain,
    defeatedCount: reward.defeatedCount,
    cards: reward.cards,
  })
  rewardPrepared.value = true
  await router.push('/reward')
}

function requestEnemyTarget(theme: EnemySelectionTheme): Promise<number> {
  if (enemySelectionRequest.value) {
    return Promise.reject(new Error('敵選択が既に進行中です'))
  }

  hoveredEnemyId.value = null
  enemySelectionTheme.value = theme

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
  const src = metadata?.src
  if (!src) {
    return
  }
  currentCutInSrc.value = src
  await nextTick()
  cutInRef.value?.play()
}

function playAudioCue(soundId: string): void {
  if (!soundId) {
    return
  }
  audioStore.playSe(soundId)
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
  resetEnemySelectionTheme()
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

function resetEnemySelectionTheme(): void {
  enemySelectionTheme.value = 'default'
}

function logPileSnapshot(pile: 'deck' | 'discard'): void {
  if (!import.meta.env.DEV) return
  const snap = snapshot.value
  // デバッグ専用ログ。実際の内容確認用で、本番では出ない。
  // eslint-disable-next-line no-console
  console.info('[BattleView] pile overlay open', {
    pile,
    deckCount: snap?.deck.length ?? 0,
    discardCount: snap?.discardPile.length ?? 0,
    discardTitles: snap?.discardPile?.slice(0, 3).map((card) => card.title),
  })
}

function openPlayerDeckOverlay(): void {
  deckOverlaySource.value = 'player'
  randomizedDeckCardInfos.value = [...deckCardInfos.value]
  pileOverlayStore.openDeck(randomizedDeckCardInfos.value, discardCardInfos.value)
  logPileSnapshot('deck')
}

function openBattleDeckOverlay(): void {
  deckOverlaySource.value = 'battle'
  randomizedDeckCardInfos.value = shuffleCardInfosForDisplay(battleDeckCardInfos.value)
  pileOverlayStore.openDeck(randomizedDeckCardInfos.value, discardCardInfos.value)
  logPileSnapshot('deck')
}

function openDiscardOverlay(): void {
  pileOverlayStore.openDiscard(randomizedDeckCardInfos.value, discardCardInfos.value)
  logPileSnapshot('discard')
}

function handleOpenPileChoice(payload: {
  title?: string
  message?: string
  candidates: CardInfo[]
  onSelect: (cardId: number) => void
  onCancel: () => void
}): void {
  pileChoiceState.visible = true
  pileChoiceState.title = payload.title
  pileChoiceState.message = payload.message
  pileChoiceState.candidates = [...payload.candidates]
  pileChoiceState.onSelect = payload.onSelect
  pileChoiceState.onCancel = payload.onCancel
}

function handlePileChoiceSelect(cardId: number): void {
  pileChoiceState.visible = false
  const callback = pileChoiceState.onSelect
  cleanupPileChoiceCallbacks()
  callback?.(cardId)
}

function handlePileChoiceCancel(): void {
  pileChoiceState.visible = false
  const callback = pileChoiceState.onCancel
  cleanupPileChoiceCallbacks()
  callback?.()
}

function cleanupPileChoiceCallbacks(): void {
  pileChoiceState.onSelect = undefined
  pileChoiceState.onCancel = undefined
  pileChoiceState.candidates = []
}

function shuffleCardInfosForDisplay(cards: CardInfo[]): CardInfo[] {
  // 山札の表示順は実際のドロー順を秘匿したいので、都度シャッフルしたコピーを返す。
  const shuffled = [...cards]
  if (shuffled.length <= 1) {
    return shuffled
  }
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]
    const swapTarget = shuffled[j]
    if (tmp === undefined || swapTarget === undefined) {
      continue
    }
    shuffled[i] = swapTarget
    shuffled[j] = tmp
  }
  return shuffled
}

function buildCardInfos(cards: Card[], prefix: string): CardInfo[] {
  const battle = viewManager.battle
  const costContext =
    battle != null
      ? {
          battle,
          source: battle.player,
        }
      : undefined
  return cards
    .map((card, index) =>
      buildCardInfoFromCard(card, {
        id: `${prefix}-${card.id ?? index}`,
        affordable: true,
        costContext,
      }),
    )
    .filter((info): info is CardInfo => info !== null)
}

function buildCardInfosFromPlayerStoreDeck(deck: CardBlueprint[], prefix: string): CardInfo[] {
  const repository = new CardRepository()
  const battle = viewManager.battle
  const costContext =
    battle != null
      ? {
          battle,
          source: battle.player,
        }
      : undefined
  const sorted = [...deck].sort((a, b) => a.type.localeCompare(b.type))
  return sorted
    .map((blueprint, index) => createCardFromBlueprint(blueprint, repository))
    .map((card, index) =>
      buildCardInfoFromCard(card, {
        id: `${prefix}-${card.id ?? index}`,
        affordable: true,
        disabled: true,
        costContext,
      }),
    )
    .filter((info): info is CardInfo => info !== null)
}

async function handleOpenReward(): Promise<void> {
  // 勝利後の報酬表示を一度だけセットアップし、RewardView へ遷移する。
  if (rewardPrepared.value) {
    await router.push('/reward')
    return
  }
  const battle = viewManager.battle
  if (!battle || !snapshot.value) {
    return
  }
  // バトル終了時点のHPをストアへ反映しておく（褒章処理後の表示用）。
  playerStore.hp = snapshot.value.player.currentHp
  playerStore.maxHp = snapshot.value.player.maxHp
  const reward = new BattleReward(battle).compute()
  rewardStore.setReward({
    battleId: battle.id,
    hpHeal: reward.hpHeal,
    goldGain: reward.goldGain,
    defeatedCount: reward.defeatedCount,
    cards: reward.cards,
  })
  rewardPrepared.value = true
  await router.push('/reward')
}

function handleHandPlayCard(payload: { cardId: number; operations: CardOperation[] }): void {
  // デバッグ用: HandArea からのプレイ要求を記録
  // eslint-disable-next-line no-console
  // console.info('[BattleView] handleHandPlayCard', payload)
  viewManager.queuePlayerAction({ type: 'play-card', cardId: payload.cardId, operations: payload.operations })
  resetErrorMessage()
}

function handleHandError(message: string): void {
  if (message === '敵選択がキャンセルされました') {
    return
  }
  showTransientError(message)
}

function handleHandHideOverlay(): void {
  hideDescriptionOverlay()
}

function handleRelicHover(event: MouseEvent | FocusEvent, relic: RelicDisplayEntry): void {
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
  showDescriptionOverlay(`${relic.name}\n${relic.description}`, { x, y })
}

function handleRelicLeave(): void {
  hideDescriptionOverlay()
}

function handleRelicClick(_relic: RelicDisplayEntry): void {
  // いまのところクリック発火はなし（パッシブのみ想定）
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
  resetEnemySelectionTheme()
  latestStageEvent.value = null
  playerDamageOutcomes.value = []
  currentAnimationId.value = null
  resetErrorMessage()
  previousSnapshot.value = null
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
    case 'tutorial':
      return createTutorialBattle
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
    relicClassNames: [...playerStore.relics],
  })
}

const DEFAULT_ENEMY_TEAM_FACTORY = () => new SnailTeam()

const ENEMY_TEAM_FACTORIES: Record<string, () => EnemyTeam> = buildEnemyTeamFactoryMap()

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
  <MainGameLayout
    ref="mainLayoutRef"
    :player-card-key="`player-card-${viewResetToken}`"
    :player-pre-hp="playerPreHpForCard"
    :player-post-hp="playerPostHpForCard"
    :player-outcomes="playerDamageOutcomes"
    :player-selection-theme="enemySelectionTheme"
    :player-states="playerStates"
    :player-state-snapshots="playerStateSnapshots"
    :player-predicted-hp="projectedPlayerHp ?? undefined"
    @contextmenu="handleContextMenu"
  @relic-hover="(relic, event) => handleRelicHover(event, relic)"
  @relic-leave="handleRelicLeave"
  @relic-click="handleRelicClick"
  @deck-click="openPlayerDeckOverlay"
>
    <template #overlays>
      <transition name="battle-error">
        <div v-if="errorMessage" class="battle-error-overlay" role="alert">
          {{ errorMessage }}
        </div>
      </transition>
      <CutInOverlay
        :key="`battle-cutin-${viewResetToken}`"
        ref="cutInRef"
        class="battle-cutin-overlay"
        :src="currentCutInSrc"
      />
    </template>
    <template #actions>
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
    </template>
    <template #instructions>
      コンセプト
      Slay The Spire 風のカードバトルです。
      プレイヤー「記憶の聖女」は、敵から受けた「被虐の記憶」をカードとして使用できます。
      敵の攻撃と状態異常を上手く活用し、生きて最深部まで辿り着きましょう！

      操作
      ・左クリック：選択
      ・右クリック：キャンセル

      状態異常
      ・手札の「状態異常」カードは、使用することで治癒できます
      ・腐食／粘液などの状態異常は累積します

      マナ
      ・黄色の円で示されるのが現在のマナです。
      ・カードの左上がマナコストです。マナを消費してカードを使用できます。

      戦闘報酬
      ・一回の戦闘が終了すると、HPが50回復し、今回の戦闘で獲得した記憶から１枚をデッキに入れられます
    </template>

    <main class="battle-main">
      <BattleEnemyArea
        :key="`enemy-area-${viewResetToken}`"
        :battle="viewManager.battle"
        :snapshot="snapshot"
        :is-initializing="isInitializing"
        :stage-event="latestStageEvent"
        :is-selecting-enemy="isSelectingEnemy"
        :hovered-enemy-id="hoveredEnemyId"
        :selection-hints="enemySelectionHints"
        :selection-theme="enemySelectionTheme"
        :action-hints-by-enemy-id="enemyActionHintsById"
        @hover-start="handleEnemyHoverStart"
        @hover-end="handleEnemyHoverEnd"
        @enemy-click="(enemy) => handleEnemySelected(enemy.id)"
        @cancel-selection="handleEnemySelectionCanceled"
      />

      <div class="battle-main__overlay">
        <div class="battle-main__overlay-inner">
          <div class="battle-main__overlay-left">
            <div class="mana-pop" :key="manaPulseKey" aria-label="現在のマナ">
              <span class="mana-pop__current">{{ playerMana.current }}</span>
              <span class="mana-pop__slash" aria-hidden="true"></span>
              <span class="mana-pop__max">{{ playerMana.max }}</span>
            </div>
          </div>
          <div class="battle-main__overlay-right">
            <button
              class="end-turn-button"
              type="button"
              :disabled="isInputLocked"
              @click="handleEndTurnClick"
            >
              ターン終了
            </button>
          </div>
        </div>
      </div>

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
        :player-origin-rect="getPlayerOriginRect"
        @play-card="handleHandPlayCard"
        @error="handleHandError"
        @hide-overlay="handleHandHideOverlay"
        @show-enemy-selection-hints="handleEnemySelectionHints"
        @clear-enemy-selection-hints="handleClearEnemySelectionHints"
    @open-deck-overlay="openBattleDeckOverlay"
        @open-discard-overlay="openDiscardOverlay"
        @open-pile-choice="handleOpenPileChoice"
      />
    </main>
    <PileChoiceOverlay
      :visible="pileChoiceState.visible"
      :title="pileChoiceState.title"
      :message="pileChoiceState.message"
      :candidates="pileChoiceState.candidates"
      @select="handlePileChoiceSelect"
      @cancel="handlePileChoiceCancel"
    />
    <transition name="result-overlay">
      <div v-if="isGameOver" class="battle-gameover-overlay">
        <div class="gameover-text">GAME OVER</div>
      </div>
    </transition>
    <transition name="result-overlay">
      <div v-if="!isGameOver && isVictory" class="battle-victory-overlay">
        <div class="victory-text">VICTORY!</div>
        <button type="button" class="reward-link-button" @click="handleOpenReward">
          報酬を受け取る
        </button>
      </div>
    </transition>
    <div class="debug-menu">
      <details>
        <summary>デバッグメニュー</summary>
        <button type="button" class="debug-button" @click="handleForceVictory">
          即勝利して報酬へ
        </button>
      </details>
    </div>
  </MainGameLayout>
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

.battle-cutin-overlay {
  position: absolute;
  inset: 0;
  z-index: 12;
  pointer-events: none;
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
  flex-direction: row;
  align-items: center;
  gap: 10px;
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
  grid-template-columns: 240px 1fr;
  flex: 1;
  min-height: 0;
  position: relative;
}

.battle-main {
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(28, 28, 48, 0.75), rgba(18, 18, 24, 0.85));
  gap: 0;
  flex: 1;
  min-height: 0;
  --enemy-zone-height: 370px;
  --enemy-zone-offset: 0px; /* 敵ゾーンを画面上部に寄せてヘッダーとの距離を詰める視覚オフセット */
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
  flex: 0 0 var(--enemy-zone-height);
  max-height: var(--enemy-zone-height);
  padding: 0 16px;
  transform: translateY(var(--enemy-zone-offset));
  margin-bottom: var(--enemy-zone-offset); /* オフセット分で下側に不要な余白が生まれないよう補正 */
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
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  /* background: #0e0e18; */
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
  min-height: 0;
  overflow: visible;
}

.portrait {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 12px 0 0 0;
  position: relative;
  overflow: visible;
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
  box-sizing: border-box;
  bottom: 120px;
  z-index: 2;
}

.sidebar-overlay {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  /* border-radius: 16px; */
  /* background: rgba(12, 12, 24, 0.82); */
  /* border: 1px solid rgba(255, 255, 255, 0.14); */
  /* box-shadow: 0 18px 28px rgba(0, 0, 0, 0.35); */
}

.mana-pop {
  position: relative;
  width: 100px;
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
  font-size: 36px;
  position: absolute;
  left: 27px;
  top: 8px;
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
  width: 45px;
  height: 2px;
  background: currentColor;
  transform: rotate(-52deg);
  opacity: 0.9;
  right: 25px;
  bottom: 45px;
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

.reward-link-button {
  margin-top: 18px;
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  background: rgba(120, 205, 255, 0.95);
  color: #0d1a2f;
  font-weight: 800;
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
  transition: transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
}

.reward-link-button:hover,
.reward-link-button:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.4);
}

.debug-menu {
  position: fixed;
  bottom: 12px;
  left: 12px;
  z-index: 6;
  font-size: 13px;
  color: #d7e1ff;
}

.debug-menu details {
  background: rgba(20, 22, 35, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 8px 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.debug-menu summary {
  cursor: pointer;
  font-weight: 600;
}

.debug-button {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(255, 180, 92, 0.2), rgba(255, 138, 76, 0.15));
  border: 1px solid rgba(255, 180, 92, 0.5);
  border-radius: 8px;
  color: #ffd6a3;
  font-weight: 600;
  transition: filter 120ms ease, transform 120ms ease;
}

.debug-button:hover,
.debug-button:focus-visible {
  filter: brightness(1.05);
  transform: translateY(-1px);
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

.battle-main__overlay {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--enemy-zone-height) + var(--enemy-zone-offset)); /* 敵ゾーンの視覚位置に合わせてオーバーレイのアンカーも移動 */
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 8;
}

.battle-main__overlay-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  gap: 16px;
}

.battle-main__overlay-left,
.battle-main__overlay-right {
  pointer-events: auto;
}

</style>
