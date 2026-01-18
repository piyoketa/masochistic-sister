/**
 * 実績達成履歴を保持するストア。
 * - 目的: 実績の状態を localStorage に保存し、UI と報酬取得処理に供給する。
 * - 設計上の重要な決定: 記憶ポイントは履歴から集計するため state では保持しない。
 *   仕様変更に伴い STORAGE_VERSION を更新して全リセットする。
 */
import { defineStore } from 'pinia'
import { usePlayerStore } from './playerStore'
import {
  ORC_HERO_ACHIEVEMENT_ID,
  BEAM_CANNON_ACHIEVEMENT_ID,
  RELIC_LIMIT_4_ACHIEVEMENT_ID,
  RELIC_LIMIT_4_TARGET,
  RELIC_LIMIT_5_ACHIEVEMENT_ID,
  RELIC_LIMIT_5_TARGET,
  HEAVEN_CHAIN_ACHIEVEMENT_ID,
  HEAVEN_CHAIN_TARGET,
  COWARD_FLEE_ACHIEVEMENT_ID,
  COWARD_FLEE_TARGET,
  COWARD_DEFEAT_ACHIEVEMENT_ID,
  COWARD_DEFEAT_TARGET,
  TENTACLE_DEFEAT_ACHIEVEMENT_ID,
  TENTACLE_DEFEAT_TARGET,
  RESULT_HP_30_ACHIEVEMENT_ID,
  RESULT_HP_30_TARGET,
  FIRST_DAMAGE_ACHIEVEMENT_ID,
  FIRST_DAMAGE_TARGET,
  DEFEAT_ACHIEVEMENT_ID,
  DEFEAT_TARGET,
  CORROSION_FIRST_ACHIEVEMENT_ID,
  CORROSION_FIRST_TARGET,
  CORROSION_30_ACHIEVEMENT_ID,
  CORROSION_30_TARGET,
  CORROSION_100_ACHIEVEMENT_ID,
  CORROSION_100_TARGET,
  SLIME_FIRST_ACHIEVEMENT_ID,
  SLIME_FIRST_TARGET,
  SLIME_3_ACHIEVEMENT_ID,
  SLIME_3_TARGET,
  SLIME_10_ACHIEVEMENT_ID,
  SLIME_10_TARGET,
  MULTI_HIT_4_RECEIVED_ACHIEVEMENT_ID,
  MULTI_HIT_4_TARGET,
  MULTI_HIT_5_RECEIVED_ACHIEVEMENT_ID,
  MULTI_HIT_5_TARGET,
  MULTI_HIT_6_RECEIVED_ACHIEVEMENT_ID,
  MULTI_HIT_6_TARGET,
  DAMAGE_30_ACHIEVEMENT_ID,
  DAMAGE_30_TARGET,
  DAMAGE_40_ACHIEVEMENT_ID,
  DAMAGE_40_TARGET,
  DAMAGE_50_ACHIEVEMENT_ID,
  DAMAGE_50_TARGET,
  KISS_RECEIVED_ACHIEVEMENT_ID,
  KISS_RECEIVED_TARGET,
  KISS_USED_ACHIEVEMENT_ID,
  KISS_USED_TARGET,
  AURA_FIRST_ACHIEVEMENT_ID,
  AURA_FIRST_TARGET,
  AURA_5_ACHIEVEMENT_ID,
  AURA_5_TARGET,
} from '@/domain/achievements/constants'
import type { AchievementProgress } from '@/domain/achievements/types'

export type AchievementStatus = 'not-achieved' | 'achieved' | 'owned'

type AchievementReward =
  | {
      type: 'relic'
      relicClassName: string
      label: string
    }
  | {
      type: 'relic-limit'
      limitIncrease: number
      label: string
    }
  | {
      type: 'max-hp'
      maxHpGain: number
      healAmount: number
      label: string
    }

type RewardAchievementDefinition = {
  category: 'reward'
  id: string
  title: string
  description: string
  reward: AchievementReward
  memoryPointCost: number
  initialStatus?: AchievementStatus
  progressLabel?: string
  progressRatio?: number
}

type TitleAchievementDefinition = {
  category: 'title'
  id: string
  title: string
  description: string
  memoryPointGain: number
  initialStatus?: Exclude<AchievementStatus, 'owned'>
  progressLabel?: string
  progressRatio?: number
}

type AchievementDefinition = RewardAchievementDefinition | TitleAchievementDefinition

type AchievementHistoryEntry = {
  id: string
  status: AchievementStatus
}

type AchievementPersistedPayload = {
  version: typeof STORAGE_VERSION
  entries: AchievementHistoryEntry[]
}

const STORAGE_VERSION = 'v4'
const STORAGE_KEY = `ms-achievement/${STORAGE_VERSION}/history`

// 報酬9件 + 称号22件を定義する。
const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: ORC_HERO_ACHIEVEMENT_ID,
    category: 'reward',
    title: '最大HP+30',
    description: '「オークヒーロー」を倒す',
    reward: { type: 'max-hp', maxHpGain: 30, healAmount: 30, label: '最大HP+30' },
    memoryPointCost: 5,
    initialStatus: 'not-achieved',
  },
  {
    id: BEAM_CANNON_ACHIEVEMENT_ID,
    category: 'reward',
    title: '最大HP+30',
    description: 'LV2のボスを倒す',
    reward: { type: 'max-hp', maxHpGain: 30, healAmount: 30, label: '最大HP+30' },
    memoryPointCost: 10,
    initialStatus: 'not-achieved',
  },
  {
    id: RELIC_LIMIT_4_ACHIEVEMENT_ID,
    category: 'reward',
    title: 'レリック上限+1 (3->4)',
    description: '３つ目のレリックを獲得する',
    reward: { type: 'relic-limit', limitIncrease: 1, label: 'レリック上限+1' },
    memoryPointCost: 5,
    initialStatus: 'not-achieved',
  },
  {
    id: RELIC_LIMIT_5_ACHIEVEMENT_ID,
    category: 'reward',
    title: 'レリック上限+1 (4->5)',
    description: '４つ目のレリックを獲得する',
    reward: { type: 'relic-limit', limitIncrease: 1, label: 'レリック上限+1' },
    memoryPointCost: 10,
    initialStatus: 'not-achieved',
  },
  {
    id: HEAVEN_CHAIN_ACHIEVEMENT_ID,
    category: 'reward',
    title: 'レリック「メモ」',
    description: 'アクティブレリック 戦闘中１度だけ、手札のカード１枚を保留する / 条件: 「天の鎖」を10回使用する',
    reward: { type: 'relic', relicClassName: 'MemoRelic', label: 'レリック: メモ' },
    memoryPointCost: 3,
    initialStatus: 'not-achieved',
  },
  {
    id: COWARD_FLEE_ACHIEVEMENT_ID,
    category: 'reward',
    title: 'レリック「リドロー」',
    description: 'アクティブレリック 戦闘中１度だけ、手札を引き直す / 条件: 「臆病」な敵に逃走される',
    reward: { type: 'relic', relicClassName: 'RedrawRelic', label: 'レリック: リドロー' },
    memoryPointCost: 3,
    initialStatus: 'not-achieved',
  },
  {
    id: COWARD_DEFEAT_ACHIEVEMENT_ID,
    category: 'reward',
    title: 'レリック「日課」',
    description: 'アクティブレリック 戦闘中１度だけ、２枚ドローできる / 条件: 「臆病」な敵を倒す',
    reward: { type: 'relic', relicClassName: 'DailyRoutineRelic', label: 'レリック: 日課' },
    memoryPointCost: 3,
    initialStatus: 'not-achieved',
  },
  {
    id: TENTACLE_DEFEAT_ACHIEVEMENT_ID,
    category: 'reward',
    title: 'レリック「粘液玉」',
    description: 'アクティブレリック 戦闘中１度だけ、手札に「粘液1点」を加える / 条件: 敵「触手」を倒す',
    reward: { type: 'relic', relicClassName: 'MucusOrbRelic', label: 'レリック: 粘液玉' },
    memoryPointCost: 3,
    initialStatus: 'not-achieved',
  },
  {
    id: RESULT_HP_30_ACHIEVEMENT_ID,
    category: 'reward',
    title: 'レリック「軽装戦闘」',
    description: 'パッシブレリック 「腐食」が手札にあると加速する / 条件: HPが30以下になる',
    reward: { type: 'relic', relicClassName: 'LightweightCombatRelic', label: 'レリック: 軽装戦闘' },
    memoryPointCost: 3,
    initialStatus: 'not-achieved',
  },
  {
    id: FIRST_DAMAGE_ACHIEVEMENT_ID,
    category: 'title',
    title: '初めての傷',
    description: 'はじめてダメージを受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: DEFEAT_ACHIEVEMENT_ID,
    category: 'title',
    title: '輪廻経験者',
    description: '敗北する',
    memoryPointGain: 3,
    initialStatus: 'not-achieved',
  },
  {
    id: CORROSION_FIRST_ACHIEVEMENT_ID,
    category: 'title',
    title: '腐食１',
    description: 'はじめて腐食を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: CORROSION_30_ACHIEVEMENT_ID,
    category: 'title',
    title: '腐食２',
    description: '腐食を累計30点受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: CORROSION_100_ACHIEVEMENT_ID,
    category: 'title',
    title: '腐食３',
    description: '腐食を累計100点受ける',
    memoryPointGain: 3,
    initialStatus: 'not-achieved',
  },
  {
    id: SLIME_FIRST_ACHIEVEMENT_ID,
    category: 'title',
    title: '汚濁１',
    description: 'はじめて粘液を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: SLIME_3_ACHIEVEMENT_ID,
    category: 'title',
    title: '汚濁２',
    description: '粘液を累計3点受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: SLIME_10_ACHIEVEMENT_ID,
    category: 'title',
    title: '汚濁３',
    description: '粘液を累計10点受ける',
    memoryPointGain: 3,
    initialStatus: 'not-achieved',
  },
  {
    id: MULTI_HIT_4_RECEIVED_ACHIEVEMENT_ID,
    category: 'title',
    title: '連打１',
    description: '4回以上の連続攻撃を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: MULTI_HIT_5_RECEIVED_ACHIEVEMENT_ID,
    category: 'title',
    title: '連打２',
    description: '5回以上の連続攻撃を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: MULTI_HIT_6_RECEIVED_ACHIEVEMENT_ID,
    category: 'title',
    title: '連打３',
    description: '6回以上の連続攻撃を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: DAMAGE_30_ACHIEVEMENT_ID,
    category: 'title',
    title: '打点１',
    description: '30ダメージ以上の打点を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: DAMAGE_40_ACHIEVEMENT_ID,
    category: 'title',
    title: '打点２',
    description: '40ダメージ以上の打点を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: DAMAGE_50_ACHIEVEMENT_ID,
    category: 'title',
    title: '打点３',
    description: '50ダメージ以上の打点を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: KISS_RECEIVED_ACHIEVEMENT_ID,
    category: 'title',
    title: 'ファーストキス',
    description: 'はじめて「口づけ」を受ける',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: KISS_USED_ACHIEVEMENT_ID,
    category: 'title',
    title: 'たどたどしい接吻',
    description: '口づけを3回使用する',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: AURA_FIRST_ACHIEVEMENT_ID,
    category: 'title',
    title: '被虐心の芽生え',
    description: 'はじめて「被虐のオーラ」を発動する',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
  {
    id: AURA_5_ACHIEVEMENT_ID,
    category: 'title',
    title: '被虐心の深化',
    description: '「被虐のオーラ」を5回発動する',
    memoryPointGain: 1,
    initialStatus: 'not-achieved',
  },
]

function normalizeStatus(def: AchievementDefinition, status: AchievementStatus): AchievementStatus {
  if (def.category === 'title' && status === 'owned') {
    // 称号は「所持中」を持たないため、誤った状態は達成扱いに寄せる。
    return 'achieved'
  }
  return status
}

function resolveInitialStatus(def: AchievementDefinition): AchievementStatus {
  const initial = def.initialStatus ?? 'not-achieved'
  return normalizeStatus(def, initial)
}

function buildDefaultHistory(): AchievementHistoryEntry[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    id: def.id,
    status: resolveInitialStatus(def),
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
  const entries = obj.entries
    .map((entry) => ({
      id: entry?.id,
      status: entry?.status,
    }))
    .filter(
      (entry): entry is AchievementHistoryEntry =>
        typeof entry.id === 'string' && isValidStatus(entry.status),
    )
  if (entries.length === 0) return null
  return {
    version: STORAGE_VERSION,
    entries,
  }
}

function isValidStatus(status: unknown): status is AchievementStatus {
  return status === 'not-achieved' || status === 'achieved' || status === 'owned'
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
      return { id: def.id, status: normalizeStatus(def, existing.status) }
    }
    return {
      id: def.id,
      status: resolveInitialStatus(def),
    }
  })
}

export const useAchievementStore = defineStore('achievement', {
  state: () => ({
    initialized: false,
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
    rewardEntriesForView(): Array<RewardAchievementDefinition & { status: AchievementStatus }> {
      const map = this.historyMap as Map<string, AchievementHistoryEntry>
      return ACHIEVEMENT_DEFINITIONS.filter((def): def is RewardAchievementDefinition => def.category === 'reward')
        .map((def) => ({
          ...def,
          status: normalizeStatus(def, map.get(def.id)?.status ?? resolveInitialStatus(def)),
        }))
    },
    titleEntriesForView(): Array<TitleAchievementDefinition & { status: Exclude<AchievementStatus, 'owned'> }> {
      const map = this.historyMap as Map<string, AchievementHistoryEntry>
      return ACHIEVEMENT_DEFINITIONS.filter((def): def is TitleAchievementDefinition => def.category === 'title')
        .map((def) => ({
          ...def,
          status: normalizeStatus(def, map.get(def.id)?.status ?? resolveInitialStatus(def)) as Exclude<
            AchievementStatus,
            'owned'
          >,
        }))
    },
    earnedMemoryPointsTotal(): number {
      const map = this.historyMap as Map<string, AchievementHistoryEntry>
      return ACHIEVEMENT_DEFINITIONS.filter((def): def is TitleAchievementDefinition => def.category === 'title')
        .reduce((sum, def) => {
          const status = normalizeStatus(def, map.get(def.id)?.status ?? resolveInitialStatus(def))
          if (status === 'achieved') {
            return sum + def.memoryPointGain
          }
          return sum
        }, 0)
    },
    usedMemoryPointsTotal(): number {
      const map = this.historyMap as Map<string, AchievementHistoryEntry>
      return ACHIEVEMENT_DEFINITIONS.filter((def): def is RewardAchievementDefinition => def.category === 'reward')
        .reduce((sum, def) => {
          const status = normalizeStatus(def, map.get(def.id)?.status ?? resolveInitialStatus(def))
          if (status === 'owned') {
            return sum + def.memoryPointCost
          }
          return sum
        }, 0)
    },
    availableMemoryPoints(): number {
      // 記憶ポイントは「獲得済み称号 - 所持中報酬」から算出する。
      return Math.max(0, this.earnedMemoryPointsTotal - this.usedMemoryPointsTotal)
    },
  },
  actions: {
    ensureInitialized(): void {
      if (this.initialized) return
      const loaded = loadPersisted()
      if (loaded) {
        this.history = mergeHistoryWithDefinitions(loaded.entries)
      } else {
        this.history = buildDefaultHistory()
      }
      this.initialized = true
    },
    applyProgress(progress: AchievementProgress): void {
      this.ensureInitialized()
      const maybeUpdate = (achievementId: string, condition: boolean) => {
        if (!condition) return
        const current = this.historyMap.get(achievementId)
        if (!current || current.status !== 'not-achieved') {
          return
        }
        const updated: AchievementHistoryEntry = {
          ...current,
          status: 'achieved',
        }
        this.history = this.history.map((entry) =>
          entry.id === achievementId ? updated : entry,
        )
      }

      maybeUpdate(ORC_HERO_ACHIEVEMENT_ID, progress.orcHeroDefeated === true)
      maybeUpdate(BEAM_CANNON_ACHIEVEMENT_ID, progress.beamCannonDefeated === true)
      maybeUpdate(
        RELIC_LIMIT_4_ACHIEVEMENT_ID,
        progress.maxRelicOwnedCount >= RELIC_LIMIT_4_TARGET,
      )
      maybeUpdate(
        RELIC_LIMIT_5_ACHIEVEMENT_ID,
        progress.maxRelicOwnedCount >= RELIC_LIMIT_5_TARGET,
      )
      maybeUpdate(HEAVEN_CHAIN_ACHIEVEMENT_ID, progress.heavenChainUsedCount >= HEAVEN_CHAIN_TARGET)
      maybeUpdate(COWARD_FLEE_ACHIEVEMENT_ID, progress.cowardFleeCount >= COWARD_FLEE_TARGET)
      maybeUpdate(
        COWARD_DEFEAT_ACHIEVEMENT_ID,
        progress.cowardDefeatCount >= COWARD_DEFEAT_TARGET,
      )
      maybeUpdate(
        TENTACLE_DEFEAT_ACHIEVEMENT_ID,
        progress.tentacleDefeatCount >= TENTACLE_DEFEAT_TARGET,
      )
      maybeUpdate(
        RESULT_HP_30_ACHIEVEMENT_ID,
        progress.resultHpAtMost30Count >= RESULT_HP_30_TARGET,
      )
      maybeUpdate(FIRST_DAMAGE_ACHIEVEMENT_ID, progress.damageTakenCount >= FIRST_DAMAGE_TARGET)
      maybeUpdate(DEFEAT_ACHIEVEMENT_ID, progress.defeatCount >= DEFEAT_TARGET)
      maybeUpdate(CORROSION_FIRST_ACHIEVEMENT_ID, progress.corrosionAccumulated >= CORROSION_FIRST_TARGET)
      maybeUpdate(CORROSION_30_ACHIEVEMENT_ID, progress.corrosionAccumulated >= CORROSION_30_TARGET)
      maybeUpdate(CORROSION_100_ACHIEVEMENT_ID, progress.corrosionAccumulated >= CORROSION_100_TARGET)
      maybeUpdate(SLIME_FIRST_ACHIEVEMENT_ID, progress.stickyAccumulated >= SLIME_FIRST_TARGET)
      maybeUpdate(SLIME_3_ACHIEVEMENT_ID, progress.stickyAccumulated >= SLIME_3_TARGET)
      maybeUpdate(SLIME_10_ACHIEVEMENT_ID, progress.stickyAccumulated >= SLIME_10_TARGET)
      maybeUpdate(
        MULTI_HIT_4_RECEIVED_ACHIEVEMENT_ID,
        progress.maxMultiHitReceived >= MULTI_HIT_4_TARGET,
      )
      maybeUpdate(
        MULTI_HIT_5_RECEIVED_ACHIEVEMENT_ID,
        progress.maxMultiHitReceived >= MULTI_HIT_5_TARGET,
      )
      maybeUpdate(
        MULTI_HIT_6_RECEIVED_ACHIEVEMENT_ID,
        progress.maxMultiHitReceived >= MULTI_HIT_6_TARGET,
      )
      maybeUpdate(DAMAGE_30_ACHIEVEMENT_ID, progress.maxDamageTaken >= DAMAGE_30_TARGET)
      maybeUpdate(DAMAGE_40_ACHIEVEMENT_ID, progress.maxDamageTaken >= DAMAGE_40_TARGET)
      maybeUpdate(DAMAGE_50_ACHIEVEMENT_ID, progress.maxDamageTaken >= DAMAGE_50_TARGET)
      maybeUpdate(KISS_RECEIVED_ACHIEVEMENT_ID, progress.kissReceivedCount >= KISS_RECEIVED_TARGET)
      maybeUpdate(KISS_USED_ACHIEVEMENT_ID, progress.kissUsedCount >= KISS_USED_TARGET)
      maybeUpdate(AURA_FIRST_ACHIEVEMENT_ID, progress.masochisticAuraUsedCount >= AURA_FIRST_TARGET)
      maybeUpdate(AURA_5_ACHIEVEMENT_ID, progress.masochisticAuraUsedCount >= AURA_5_TARGET)

      this.persist()
    },
    claimAchievement(id: string): { success: boolean; message: string } {
      this.ensureInitialized()
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === id)
      if (!def) {
        return { success: false, message: '不明な実績です' }
      }
      if (def.category !== 'reward') {
        return { success: false, message: '称号は報酬として獲得できません' }
      }
      const historyEntry = this.historyMap.get(id)
      if (!historyEntry) {
        return { success: false, message: '履歴の同期に失敗しました' }
      }
      if (historyEntry.status !== 'achieved') {
        return { success: false, message: '獲得できる状態ではありません' }
      }
      if (this.availableMemoryPoints < def.memoryPointCost) {
        return { success: false, message: '記憶ポイントが不足しています' }
      }

      const playerStore = usePlayerStore()
      playerStore.ensureInitialized()
      if (def.reward.type === 'relic') {
        const result = playerStore.addRelic(def.reward.relicClassName)
        if (!result.success) {
          return { success: false, message: result.message }
        }
      } else if (def.reward.type === 'relic-limit') {
        const increase = Math.max(0, Math.floor(def.reward.limitIncrease))
        if (increase > 0) {
          // 上限解放はレリック獲得前提の報酬なので、減らさず加算のみ許可する。
          playerStore.setRelicLimit(playerStore.relicLimit + increase)
        }
      } else if (def.reward.type === 'max-hp') {
        const maxHpGain = Math.max(0, Math.floor(def.reward.maxHpGain))
        const healAmount = Math.max(0, Math.floor(def.reward.healAmount))
        if (maxHpGain > 0) {
          // 最大HP上昇と同時に、増加分を即時回復して達成のご褒美感を出す。
          playerStore.setMaxHp(playerStore.maxHp + maxHpGain)
        }
        if (healAmount > 0) {
          playerStore.healHp(healAmount)
        }
      }

      const updated: AchievementHistoryEntry = {
        ...historyEntry,
        status: 'owned',
      }
      this.history = this.history.map((entry) => (entry.id === id ? updated : entry))
      this.persist()
      return { success: true, message: '報酬を獲得しました' }
    },
    resetHistory(): void {
      // デッキ編集画面などから呼び出して履歴を初期化する用途。
      this.history = buildDefaultHistory()
      this.persist()
    },
    persist(): void {
      const payload: AchievementPersistedPayload = {
        version: STORAGE_VERSION,
        entries: this.history.map((entry) => ({ ...entry })),
      }
      savePersisted(payload)
    },
  },
})
