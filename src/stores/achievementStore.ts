/**
 * 実績達成履歴を保持するストア。
 * - 目的: 実績の状態（未達成/達成直後/獲得済み/再取得可能）と取得履歴・記憶ポイント残高を localStorage に保存し、UI とレリック/記憶ポイント付与処理に供給する。
 * - 設計方針: 進捗判定ロジックは未実装のため、現状はデモ用の初期ステータスを定義し、報酬受取処理のみを扱う。
 *   今後、ActionLog 監視などで実際の達成判定を行う際は、このストアの update API を拡張していく。
 */
import { defineStore } from 'pinia'
import { usePlayerStore } from './playerStore'
import {
  STATUS_COLLECT_ACHIEVEMENT_ID,
  STATUS_COLLECT_TARGET,
  CORROSION_ACHIEVEMENT_ID,
  CORROSION_TARGET,
  STATUS_USE_ACHIEVEMENT_ID,
  STATUS_USE_TARGET,
  MEMORY_USE_ACHIEVEMENT_ID,
  MEMORY_USE_TARGET,
  MULTI_ATTACK_ACHIEVEMENT_ID,
  MULTI_ATTACK_TARGET,
  COWARD_ACHIEVEMENT_ID,
  COWARD_TARGET,
  ORC_HERO_ACHIEVEMENT_ID,
  ORC_HERO_TARGET,
} from '@/domain/achievements/constants'
import type { AchievementProgress } from '@/domain/achievements/types'

export type AchievementStatus = 'not-achieved' | 'just-achieved' | 'owned' | 'reacquirable'

type AchievementReward =
  | {
      type: 'relic'
      relicClassName: string
      label: string
    }
  | {
      type: 'memory-point'
      amount: number
      label: string
    }

type AchievementDefinition = {
  id: string
  title: string
  description: string
  reward: AchievementReward
  initialStatus?: AchievementStatus
  progressLabel?: string
  progressRatio?: number
  costLabel?: string
  // 再取得時に消費する記憶ポイント。未指定の場合は0扱い（要件が固まったら増減可能）。
  reacquireCost?: number
}

type AchievementHistoryEntry = {
  id: string
  status: AchievementStatus
  claimedCount: number
  lastClaimedAt: number | null
}

type AchievementPersistedPayload = {
  version: typeof STORAGE_VERSION
  memoryPoints: number
  entries: AchievementHistoryEntry[]
}

const STORAGE_VERSION = 'v1'
const STORAGE_KEY = `ms-achievement/${STORAGE_VERSION}/history`

// 実装済みの7件のみ定義する。
const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'corrosion-30',
    title: '衣を蝕む',
    description: '腐食を累計30点受ける',
    reward: { type: 'relic', relicClassName: 'LightweightCombatRelic', label: 'レリック: 軽装戦闘' },
    initialStatus: 'not-achieved',
    progressLabel: '0 / 30',
    progressRatio: 0,
  },
  {
    id: 'status-collect',
    title: '穢れを纏う',
    description: '状態異常カードを累計8枚獲得する',
    reward: { type: 'relic', relicClassName: 'AdversityExcitementRelic', label: 'レリック: 逆境' },
    initialStatus: 'not-achieved',
    progressLabel: '0 / 8',
    progressRatio: 0,
  },
  // {
  //   id: 'status-use',
  //   title: '清廉',
  //   description: '状態異常カードを累計4回使用する',
  //   reward: { type: 'relic', relicClassName: 'PureBodyRelic', label: 'レリック: 清廉' },
  //   initialStatus: 'not-achieved',
  //   progressLabel: '0 / 4',
  //   progressRatio: 0,
  // },
  {
    id: 'memory-use',
    title: '傷を刻む',
    description: '被虐の記憶カードを累計5回使用する',
    reward: { type: 'memory-point', amount: 2, label: '記憶ポイント +2' },
    initialStatus: 'not-achieved',
    progressLabel: '0 / 5',
    progressRatio: 0,
  },
  {
    id: 'multi-attack',
    title: '手数',
    description: '攻撃回数5回以上の連続攻撃を獲得する',
    reward: { type: 'memory-point', amount: 2, label: '記憶ポイント +2' },
    initialStatus: 'not-achieved',
    progressLabel: '0 / 1',
    progressRatio: 0,
  },
  {
    id: 'coward',
    title: '残虐',
    description: '臆病 trait を持つ敵を撃破する',
    reward: { type: 'memory-point', amount: 2, label: '記憶ポイント +2' },
    initialStatus: 'not-achieved',
    progressLabel: '0 / 1',
    progressRatio: 0,
  },
  {
    id: 'orc-hero',
    title: 'BOSS「オークヒーロー」討伐',
    description: 'オークヒーローを撃破する',
    reward: { type: 'memory-point', amount: 10, label: '記憶ポイント +10' },
    initialStatus: 'not-achieved',
    progressLabel: '0 / 1',
    progressRatio: 0,
  },
]

function buildDefaultHistory(): AchievementHistoryEntry[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    id: def.id,
    status: def.initialStatus ?? 'not-achieved',
    claimedCount: def.initialStatus === 'owned' ? 1 : 0,
    lastClaimedAt: null,
  }))
}

function hasStorage(): boolean {
  try {
    const key = '__ms_achievement_test__'
    localStorage.setItem(key, '1')
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

function validatePayload(raw: unknown): AchievementPersistedPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Partial<AchievementPersistedPayload>
  if (obj.version !== STORAGE_VERSION) return null
  if (!Array.isArray(obj.entries)) return null
  if (typeof obj.memoryPoints !== 'number' || Number.isNaN(obj.memoryPoints)) return null
  const entries = obj.entries
    .map((entry) => ({
      id: entry?.id,
      status: entry?.status,
      claimedCount: entry?.claimedCount,
      lastClaimedAt: entry?.lastClaimedAt ?? null,
    }))
    .filter(
      (entry): entry is AchievementHistoryEntry =>
        typeof entry.id === 'string' &&
        isValidStatus(entry.status) &&
        typeof entry.claimedCount === 'number' &&
        entry.claimedCount >= 0 &&
        (entry.lastClaimedAt === null || typeof entry.lastClaimedAt === 'number'),
    )
  if (entries.length === 0) return null
  return {
    version: STORAGE_VERSION,
    memoryPoints: obj.memoryPoints,
    entries,
  }
}

function isValidStatus(status: unknown): status is AchievementStatus {
  return (
    status === 'not-achieved' ||
    status === 'just-achieved' ||
    status === 'owned' ||
    status === 'reacquirable'
  )
}

function loadPersisted(): AchievementPersistedPayload | null {
  if (!hasStorage()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return validatePayload(parsed)
  } catch {
    return null
  }
}

function savePersisted(payload: AchievementPersistedPayload): void {
  if (!hasStorage()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ブラウザ制約で失敗した場合は黙って諦める。実績はリロード時に初期化される。
  }
}

function mergeHistoryWithDefinitions(history: AchievementHistoryEntry[]): AchievementHistoryEntry[] {
  const map = new Map(history.map((entry) => [entry.id, entry]))
  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const existing = map.get(def.id)
    if (existing && isValidStatus(existing.status)) {
      return { ...existing }
    }
    return {
      id: def.id,
      status: def.initialStatus ?? 'not-achieved',
      claimedCount: def.initialStatus === 'owned' ? 1 : 0,
      lastClaimedAt: null,
    }
  })
}

export const useAchievementStore = defineStore('achievement', {
  state: () => ({
    initialized: false,
    memoryPoints: 0,
    history: buildDefaultHistory(),
  }),
  getters: {
    historyMap: (state) => {
      const map = new Map<string, AchievementHistoryEntry>()
      for (const entry of state.history) {
        map.set(entry.id, entry)
      }
      return map
    },
    entriesForView(): Array<AchievementDefinition & { status: AchievementStatus }> {
      const map = this.historyMap as Map<string, AchievementHistoryEntry>
      return ACHIEVEMENT_DEFINITIONS.map((def) => ({
        ...def,
        status: map.get(def.id)?.status ?? def.initialStatus ?? 'not-achieved',
      }))
    },
    hasFreshAchievement(state): boolean {
      return state.history.some((entry) => entry.status === 'just-achieved')
    },
  },
  actions: {
    ensureInitialized(): void {
      if (this.initialized) return
      const loaded = loadPersisted()
      if (loaded) {
        this.memoryPoints = loaded.memoryPoints
        this.history = mergeHistoryWithDefinitions(loaded.entries)
      } else {
        this.memoryPoints = 0
        this.history = buildDefaultHistory()
      }
      this.initialized = true
    },
    applyProgress(progress: AchievementProgress): void {
      this.ensureInitialized()
      const maybeUpdate = (
        achievementId: string,
        condition: boolean,
      ) => {
        if (!condition) return
        const current = this.historyMap.get(achievementId)
        if (!current || current.status !== 'not-achieved') {
          return
        }
        const updated: AchievementHistoryEntry = {
          ...current,
          status: 'just-achieved',
          lastClaimedAt: null,
        }
        this.history = this.history.map((entry) =>
          entry.id === achievementId ? updated : entry,
        )
      }

      maybeUpdate(CORROSION_ACHIEVEMENT_ID, progress.corrosionAccumulated >= CORROSION_TARGET)
      maybeUpdate(STATUS_COLLECT_ACHIEVEMENT_ID, progress.statusCardMemories >= STATUS_COLLECT_TARGET)
      maybeUpdate(STATUS_USE_ACHIEVEMENT_ID, progress.statusCardUsed >= STATUS_USE_TARGET)
      maybeUpdate(MEMORY_USE_ACHIEVEMENT_ID, progress.memoryCardUsed >= MEMORY_USE_TARGET)
      maybeUpdate(MULTI_ATTACK_ACHIEVEMENT_ID, progress.multiAttackAcquired >= MULTI_ATTACK_TARGET)
      maybeUpdate(COWARD_ACHIEVEMENT_ID, progress.cowardDefeatedIds.length >= COWARD_TARGET)
      maybeUpdate(ORC_HERO_ACHIEVEMENT_ID, progress.orcHeroDefeated === true)

      this.persist()
    },
    addMemoryPoints(amount: number): void {
      const gain = Math.max(0, Math.floor(amount))
      if (gain <= 0) return
      this.memoryPoints += gain
    },
    spendMemoryPoints(amount: number): boolean {
      const cost = Math.max(0, Math.floor(amount))
      if (cost <= 0) return true
      if (this.memoryPoints < cost) {
        return false
      }
      this.memoryPoints -= cost
      return true
    },
    claimAchievement(id: string): { success: boolean; message: string } {
      this.ensureInitialized()
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === id)
      if (!def) {
        return { success: false, message: '不明な実績です' }
      }
      const historyEntry = this.historyMap.get(id)
      if (!historyEntry) {
        return { success: false, message: '履歴の同期に失敗しました' }
      }
      if (historyEntry.status !== 'just-achieved' && historyEntry.status !== 'reacquirable') {
        return { success: false, message: '受け取れる状態ではありません' }
      }

      // 設計メモ: 再取得は記憶ポイントを消費して「所持中」状態を再付与する想定。
      const reacquireCost = historyEntry.status === 'reacquirable' ? def.reacquireCost ?? 0 : 0
      if (reacquireCost > 0 && !this.spendMemoryPoints(reacquireCost)) {
        return { success: false, message: '記憶ポイントが不足しています' }
      }

      if (def.reward.type === 'relic') {
        const playerStore = usePlayerStore()
        playerStore.ensureInitialized()
        playerStore.addRelic(def.reward.relicClassName)
      } else if (def.reward.type === 'memory-point') {
        this.addMemoryPoints(def.reward.amount)
      }

      const updated: AchievementHistoryEntry = {
        ...historyEntry,
        status: 'owned',
        claimedCount: historyEntry.claimedCount + 1,
        lastClaimedAt: Date.now(),
      }
      this.history = this.history.map((entry) => (entry.id === id ? updated : entry))
      this.persist()
      return { success: true, message: '報酬を受け取りました' }
    },
    resetHistory(): void {
      // デッキ編集画面などから呼び出して履歴を初期化する用途。メモリーポイントも一緒にリセット。
      this.memoryPoints = 0
      this.history = buildDefaultHistory()
      this.persist()
    },
    persist(): void {
      const payload: AchievementPersistedPayload = {
        version: STORAGE_VERSION,
        memoryPoints: this.memoryPoints,
        entries: this.history.map((entry) => ({ ...entry })),
      }
      savePersisted(payload)
    },
  },
})
